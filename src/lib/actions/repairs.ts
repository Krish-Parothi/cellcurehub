'use server';

import { createServerSupabaseClient } from '@/lib/supabase-server';
import { getAuthenticatedUser } from '@/lib/actions/auth';
import { logger } from '@/lib/logger';

// ─── Types ───────────────────────────────────────────────────────────────

interface BookRepairInput {
  device_id: string | null;
  manual_model: string | null;
  imei_number: string | null;
  phone: string;
  contact_email: string;
  repair_type: string;
  custom_repair_description: string | null;
  issue_description: string;
  pickup_type: 'home' | 'store';
  address: string;
  coordinates: string | null;
  preferred_date: string | null;
  time_slot: string | null;
  estimated_cost: number | null;
}

interface ActionResult {
  success: boolean;
  error?: string;
  data?: unknown;
}

// ─── Helpers ─────────────────────────────────────────────────────────────

function validateImei(imei: string): boolean {
  return /^\d{15}$/.test(imei);
}

// ─── Actions ─────────────────────────────────────────────────────────────

/**
 * Book a new repair — customers only.
 * Validates input, inserts the repair, and creates the initial timeline entry.
 */
export async function bookRepair(input: BookRepairInput): Promise<ActionResult> {
  try {
    // 1. Auth check — only customers (and admins acting on behalf) can book
    const { profile } = await getAuthenticatedUser(['customer', 'admin']);
    logger.info('REPAIR', 'bookRepair started', { userId: profile.id, device_id: input.device_id, repair_type: input.repair_type });

    // 2. Input validation
    if (input.imei_number && !validateImei(input.imei_number)) {
      logger.warn('REPAIR', 'Invalid IMEI', { imei: input.imei_number });
      return { success: false, error: 'IMEI must be exactly 15 digits.' };
    }
    if (!input.phone || !/^[6-9]\d{9}$/.test(input.phone)) {
      return { success: false, error: 'Valid 10-digit phone number is required.' };
    }
    if (!input.repair_type) {
      return { success: false, error: 'Repair type is required.' };
    }
    if (input.repair_type === 'custom' && !input.custom_repair_description?.trim()) {
      return { success: false, error: 'Custom repair requires a description.' };
    }
    if (input.pickup_type === 'home' && !input.address.trim()) {
      return { success: false, error: 'Address is required for home pickup.' };
    }
    if (!input.device_id && !input.manual_model?.trim()) {
      return { success: false, error: 'Please select a device or enter a model name.' };
    }

    // 3. Insert repair — always set customer_id to the authenticated user
    const supabase = await createServerSupabaseClient();

    const { data: repair, error: repairError } = await supabase
      .from('repairs')
      .insert({
        customer_id: profile.id, // ← ENFORCED server-side, not from input
        device_id: input.device_id,
        manual_model: input.manual_model,
        imei_number: input.imei_number,
        contact_email: input.contact_email,
        repair_type: input.repair_type,
        custom_repair_description: input.custom_repair_description,
        issue_description: input.issue_description,
        status: 'ticket_raised',
        pickup_type: input.pickup_type,
        address: input.address,
        coordinates: input.coordinates,
        preferred_date: input.preferred_date,
        time_slot: input.time_slot,
        estimated_cost: input.estimated_cost,
      })
      .select('id')
      .single();

    if (repairError) {
      logger.error('REPAIR', 'Insert failed', { error: repairError.message, code: repairError.code });
      return { success: false, error: `Failed to create booking: ${repairError.message}` };
    }

    logger.info('REPAIR', 'Repair created', { repairId: repair.id, customerId: profile.id });

    // 4. Create timeline entry
    const { error: timelineError } = await supabase.from('repair_timeline').insert({
      repair_id: repair.id,
      status: 'ticket_raised',
      note: 'Your ticket has been raised! We will contact you soon',
      updated_by: profile.id,
    });

    if (timelineError) {
      logger.error('REPAIR', 'Timeline insert failed', { repairId: repair.id, error: timelineError.message });
      // Non-fatal — repair was created, timeline is supplementary
    }

    return { success: true, data: { repairId: repair.id } };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error('REPAIR', 'bookRepair exception', { error: message });
    return { success: false, error: message };
  }
}

/**
 * Update repair status — role-restricted based on which statuses are allowed.
 * 
 * Technicians: can set diagnostic, repair_in_progress, qa_testing, done
 * Admin/Shop Admin: can set out_for_delivery, cancelled, device_received
 * Delivery: CANNOT update repair status directly (they update delivery_assignments)
 */
export async function updateRepairStatus(
  repairId: string,
  newStatus: string,
  note?: string
): Promise<ActionResult> {
  try {
    const { profile } = await getAuthenticatedUser(['technician', 'admin', 'shop_admin']);

    logger.info('REPAIR', 'updateRepairStatus', {
      repairId,
      newStatus,
      userId: profile.id,
      role: profile.role,
    });

    // Validate status transitions based on role
    const TECHNICIAN_STATUSES = ['device_received', 'diagnostic', 'repair_in_progress', 'qa_testing', 'done', 'pending_approval'];
    const ADMIN_STATUSES = ['device_received', 'out_for_delivery', 'cancelled', 'booked', 'pickup_scheduled', 'done'];

    if (profile.role === 'technician' && !TECHNICIAN_STATUSES.includes(newStatus)) {
      logger.warn('REPAIR', 'Technician tried forbidden status', { newStatus, userId: profile.id });
      return { success: false, error: `Technicians cannot set status to "${newStatus}".` };
    }

    // Admins can set any status
    if (profile.role !== 'admin' && profile.role !== 'shop_admin' && !TECHNICIAN_STATUSES.includes(newStatus)) {
      return { success: false, error: 'You are not authorized to set this status.' };
    }

    const supabase = await createServerSupabaseClient();

    // Verify the repair exists and (for technicians) is assigned to them
    const { data: repair, error: fetchError } = await supabase
      .from('repairs')
      .select('id, technician_id, shop_id, status')
      .eq('id', repairId)
      .single();

    if (fetchError || !repair) {
      logger.error('REPAIR', 'Repair not found', { repairId, error: fetchError?.message });
      return { success: false, error: 'Repair not found.' };
    }

    // Technicians can only update their own assigned repairs
    if (profile.role === 'technician' && repair.technician_id !== profile.id) {
      logger.warn('REPAIR', 'Technician tried to update unassigned repair', {
        repairId,
        technicianId: profile.id,
        assignedTo: repair.technician_id,
      });
      return { success: false, error: `You can only update repairs assigned to you. (You: ${profile.id}, Assigned: ${repair.technician_id})` };
    }

    // Shop admins can only update repairs in their shop
    if (profile.role === 'shop_admin' && repair.shop_id !== profile.shop_id) {
      logger.warn('REPAIR', 'Shop admin tried to update other shop repair', {
        repairId,
        shopAdminShopId: profile.shop_id,
        repairShopId: repair.shop_id,
      });
      return { success: false, error: 'You can only update repairs in your shop.' };
    }

    // Update the status
    const { error: updateError } = await supabase
      .from('repairs')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', repairId);

    if (updateError) {
      logger.error('REPAIR', 'Status update failed', { repairId, error: updateError.message });
      return { success: false, error: `Failed to update status: ${updateError.message}` };
    }

    // Insert timeline entry
    await supabase.from('repair_timeline').insert({
      repair_id: repairId,
      status: newStatus,
      note: note || `Status updated to ${newStatus}`,
      updated_by: profile.id,
    });

    logger.info('REPAIR', 'Status updated', { repairId, from: repair.status, to: newStatus });
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error('REPAIR', 'updateRepairStatus exception', { error: message });
    return { success: false, error: message };
  }
}
