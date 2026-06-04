'use server';

import { createServerSupabaseClient } from '@/lib/supabase-server';
import { getAuthenticatedUser } from '@/lib/actions/auth';
import { logger } from '@/lib/logger';
import type { DeliveryStatus } from '@/lib/types';

// ─── Types ───────────────────────────────────────────────────────────────

interface ActionResult {
  success: boolean;
  error?: string;
  data?: unknown;
}

interface UpdateDeliveryStatusInput {
  assignmentId: string;
  newStatus: DeliveryStatus;
  intakePhotos?: string[];
  intakeCondition?: Record<string, boolean | string>;
  customerSignatureUrl?: string;
}

// ─── Status Transition Rules ──────────────────────────────────────────────

const VALID_TRANSITIONS: Record<string, DeliveryStatus[]> = {
  assigned: ['in_transit'],
  in_transit: ['picked_up', 'at_store'],
  picked_up: ['at_store'],
  at_store: ['out_for_delivery'],
  out_for_delivery: ['delivered', 'returned'],
};

// ─── Actions ─────────────────────────────────────────────────────────────

/**
 * Update a delivery assignment status.
 * Only delivery boys assigned to the job (or admins) can update.
 */
export async function updateDeliveryStatus(input: UpdateDeliveryStatusInput): Promise<ActionResult> {
  try {
    const { profile } = await getAuthenticatedUser(['delivery', 'admin', 'shop_admin']);
    logger.info('DELIVERY', 'updateDeliveryStatus', {
      userId: profile.id,
      assignmentId: input.assignmentId,
      newStatus: input.newStatus,
    });

    const supabase = await createServerSupabaseClient();

    // Fetch the assignment
    const { data: assignment, error: fetchError } = await supabase
      .from('delivery_assignments')
      .select('id, delivery_boy_id, status, repair_id, shop_id')
      .eq('id', input.assignmentId)
      .single();

    if (fetchError || !assignment) {
      logger.error('DELIVERY', 'Assignment not found', { assignmentId: input.assignmentId });
      return { success: false, error: 'Delivery assignment not found.' };
    }

    // Verify ownership for delivery boys
    if (profile.role === 'delivery' && assignment.delivery_boy_id !== profile.id) {
      logger.warn('DELIVERY', 'Unauthorized assignment update', {
        assignmentId: input.assignmentId,
        deliveryBoyId: profile.id,
        assignedTo: assignment.delivery_boy_id,
      });
      return { success: false, error: 'You can only update assignments assigned to you.' };
    }

    // Validate status transition
    const allowedNext = VALID_TRANSITIONS[assignment.status];
    if (profile.role === 'delivery' && (!allowedNext || !allowedNext.includes(input.newStatus))) {
      logger.warn('DELIVERY', 'Invalid status transition', {
        from: assignment.status,
        to: input.newStatus,
      });
      return { success: false, error: `Cannot transition from "${assignment.status}" to "${input.newStatus}".` };
    }

    // Build update payload
    const updatePayload: Record<string, unknown> = {
      status: input.newStatus,
    };

    if (input.intakePhotos) updatePayload.intake_photos = input.intakePhotos;
    if (input.intakeCondition) updatePayload.intake_condition = input.intakeCondition;
    if (input.customerSignatureUrl) updatePayload.customer_signature_url = input.customerSignatureUrl;

    const { error: updateError } = await supabase
      .from('delivery_assignments')
      .update(updatePayload)
      .eq('id', input.assignmentId);

    if (updateError) {
      logger.error('DELIVERY', 'Status update failed', { error: updateError.message });
      return { success: false, error: `Failed to update: ${updateError.message}` };
    }

    // If delivered, also update the repair status
    if (input.newStatus === 'delivered') {
      await supabase
        .from('repairs')
        .update({
          status: 'delivered',
          delivered_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', assignment.repair_id);

      await supabase.from('repair_timeline').insert({
        repair_id: assignment.repair_id,
        status: 'delivered',
        note: 'Device delivered to customer',
        updated_by: profile.id,
      });
    }

    // If picked_up, also update the repair status to device_received
    if (input.newStatus === 'picked_up') {
      await supabase
        .from('repairs')
        .update({ status: 'device_received', updated_at: new Date().toISOString() })
        .eq('id', assignment.repair_id);

      await supabase.from('repair_timeline').insert({
        repair_id: assignment.repair_id,
        status: 'device_received',
        note: 'Device picked up by delivery partner',
        updated_by: profile.id,
      });
    }

    logger.info('DELIVERY', 'Status updated', {
      assignmentId: input.assignmentId,
      from: assignment.status,
      to: input.newStatus,
    });
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error('DELIVERY', 'updateDeliveryStatus exception', { error: message });
    return { success: false, error: message };
  }
}

/**
 * Verify pickup OTP for device collection.
 */
export async function verifyPickupOtp(assignmentId: string, otpEntered: string): Promise<ActionResult> {
  try {
    const { profile } = await getAuthenticatedUser(['delivery', 'admin', 'shop_admin']);
    logger.info('DELIVERY', 'verifyPickupOtp', { userId: profile.id, assignmentId });

    const supabase = await createServerSupabaseClient();

    const { data: assignment, error } = await supabase
      .from('delivery_assignments')
      .select('id, delivery_boy_id, pickup_otp')
      .eq('id', assignmentId)
      .single();

    if (error || !assignment) {
      return { success: false, error: 'Assignment not found.' };
    }

    if (profile.role === 'delivery' && assignment.delivery_boy_id !== profile.id) {
      return { success: false, error: 'This assignment is not assigned to you.' };
    }

    if (assignment.pickup_otp !== otpEntered) {
      logger.warn('DELIVERY', 'OTP mismatch', { assignmentId, expected: '[REDACTED]', got: '[REDACTED]' });
      return { success: false, error: 'Invalid OTP. Please try again.' };
    }

    logger.info('DELIVERY', 'OTP verified', { assignmentId });
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error('DELIVERY', 'verifyPickupOtp exception', { error: message });
    return { success: false, error: message };
  }
}

/**
 * Verify delivery OTP for device handover.
 */
export async function verifyDeliveryOtp(assignmentId: string, otpEntered: string): Promise<ActionResult> {
  try {
    const { profile } = await getAuthenticatedUser(['delivery', 'admin', 'shop_admin']);
    logger.info('DELIVERY', 'verifyDeliveryOtp', { userId: profile.id, assignmentId });

    const supabase = await createServerSupabaseClient();

    const { data: assignment, error } = await supabase
      .from('delivery_assignments')
      .select('id, delivery_boy_id, delivery_otp')
      .eq('id', assignmentId)
      .single();

    if (error || !assignment) {
      return { success: false, error: 'Assignment not found.' };
    }

    if (profile.role === 'delivery' && assignment.delivery_boy_id !== profile.id) {
      return { success: false, error: 'This assignment is not assigned to you.' };
    }

    if (assignment.delivery_otp !== otpEntered) {
      logger.warn('DELIVERY', 'Delivery OTP mismatch', { assignmentId });
      return { success: false, error: 'Invalid OTP. Please try again.' };
    }

    logger.info('DELIVERY', 'Delivery OTP verified', { assignmentId });
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error('DELIVERY', 'verifyDeliveryOtp exception', { error: message });
    return { success: false, error: message };
  }
}

// ─── Twilio Verify OTP Actions ──────────────────────────────────────────

/**
 * Send OTP to customer via Twilio Verify for pickup or delivery handover.
 */
export async function sendDeliveryTwilioOtp(
  assignmentId: string,
  otpType: 'pickup' | 'delivery'
): Promise<ActionResult> {
  try {
    const { profile } = await getAuthenticatedUser(['delivery', 'admin', 'shop_admin']);
    logger.info('DELIVERY', 'sendDeliveryTwilioOtp', { userId: profile.id, assignmentId, otpType });

    const supabase = await createServerSupabaseClient();

    // Fetch assignment + customer phone
    const { data: assignment, error } = await supabase
      .from('delivery_assignments')
      .select('id, delivery_boy_id, repair_id, ewaste_id, repair:repairs(customer:users!repairs_customer_id_fkey(phone)), ewaste:ewaste(customer:users!ewaste_customer_id_fkey(phone))')
      .eq('id', assignmentId)
      .single();

    if (error || !assignment) {
      return { success: false, error: 'Assignment not found.' };
    }

    if (profile.role === 'delivery' && assignment.delivery_boy_id !== profile.id) {
      return { success: false, error: 'This assignment is not assigned to you.' };
    }

    const customerPhone = (assignment as any).repair?.customer?.phone || (assignment as any).ewaste?.customer?.phone;
    if (!customerPhone) {
      return { success: false, error: 'Customer phone number not found.' };
    }

    // Strip +91 prefix if present, then add it
    const cleanPhone = customerPhone.replace(/^\+91/, '').replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      return { success: false, error: 'Invalid customer phone number.' };
    }

    const twilioSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioAuth = process.env.TWILIO_AUTH_TOKEN;
    const verifySid = process.env.TWILIO_VERIFY_SERVICE_SID;

    if (!twilioSid || !twilioAuth || !verifySid) {
      logger.error('DELIVERY', 'Twilio Verify credentials missing');
      return { success: false, error: 'SMS service is not configured on the server.' };
    }

    const e164Phone = `+91${cleanPhone}`;
    const twilioUrl = `https://verify.twilio.com/v2/Services/${verifySid}/Verifications`;
    const twilioData = new URLSearchParams();
    twilioData.append('To', e164Phone);
    twilioData.append('Channel', 'sms');

    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${twilioSid}:${twilioAuth}`).toString('base64')}`
      },
      body: twilioData.toString(),
    });

    if (!response.ok) {
      const respText = await response.text();
      logger.error('DELIVERY', 'Twilio Verify API error', { response: respText });
      try {
        const errJson = JSON.parse(respText);
        if (errJson.message) {
          return { success: false, error: errJson.message };
        }
      } catch {}
      return { success: false, error: 'Failed to send OTP via SMS.' };
    }

    logger.info('DELIVERY', 'OTP sent via Twilio Verify', { assignmentId, otpType, phone: e164Phone });
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error('DELIVERY', 'sendDeliveryTwilioOtp exception', { error: message });
    return { success: false, error: message };
  }
}

/**
 * Verify OTP entered by delivery boy via Twilio Verify.
 */
export async function verifyDeliveryTwilioOtp(
  assignmentId: string,
  otpType: 'pickup' | 'delivery',
  code: string
): Promise<ActionResult> {
  try {
    const { profile } = await getAuthenticatedUser(['delivery', 'admin', 'shop_admin']);
    logger.info('DELIVERY', 'verifyDeliveryTwilioOtp', { userId: profile.id, assignmentId, otpType });

    const supabase = await createServerSupabaseClient();

    // Fetch assignment + customer phone
    const { data: assignment, error } = await supabase
      .from('delivery_assignments')
      .select('id, delivery_boy_id, repair_id, repair:repairs(customer:users!repairs_customer_id_fkey(phone))')
      .eq('id', assignmentId)
      .single();

    if (error || !assignment) {
      return { success: false, error: 'Assignment not found.' };
    }

    if (profile.role === 'delivery' && assignment.delivery_boy_id !== profile.id) {
      return { success: false, error: 'This assignment is not assigned to you.' };
    }

    const customerPhone = (assignment as any).repair?.customer?.phone;
    if (!customerPhone) {
      return { success: false, error: 'Customer phone number not found.' };
    }

    const cleanPhone = customerPhone.replace(/^\+91/, '').replace(/\D/g, '');
    const e164Phone = `+91${cleanPhone}`;

    const twilioSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioAuth = process.env.TWILIO_AUTH_TOKEN;
    const verifySid = process.env.TWILIO_VERIFY_SERVICE_SID;

    if (!twilioSid || !twilioAuth || !verifySid) {
      return { success: false, error: 'SMS service not configured.' };
    }

    const twilioUrl = `https://verify.twilio.com/v2/Services/${verifySid}/VerificationCheck`;
    const twilioData = new URLSearchParams();
    twilioData.append('To', e164Phone);
    twilioData.append('Code', code);

    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${twilioSid}:${twilioAuth}`).toString('base64')}`
      },
      body: twilioData.toString(),
    });

    if (!response.ok) {
      const respText = await response.text();
      logger.error('DELIVERY', 'Twilio Verify Check error', { response: respText });
      try {
        const errJson = JSON.parse(respText);
        if (errJson.message) {
          return { success: false, error: errJson.message };
        }
      } catch {}
      return { success: false, error: 'Failed to verify OTP.' };
    }

    const result = await response.json();

    if (result.status === 'approved') {
      logger.info('DELIVERY', 'Delivery Twilio OTP verified', { assignmentId, otpType });
      return { success: true };
    } else {
      return { success: false, error: 'Invalid or expired OTP.' };
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error('DELIVERY', 'verifyDeliveryTwilioOtp exception', { error: message });
    return { success: false, error: message };
  }
}
