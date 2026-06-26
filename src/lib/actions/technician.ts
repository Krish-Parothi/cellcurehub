'use server';

import { createServerSupabaseClient } from '@/lib/supabase-server';
import { getAuthenticatedUser } from '@/lib/actions/auth';
import { logger } from '@/lib/logger';

// ─── Types ───────────────────────────────────────────────────────────────

interface ActionResult {
  success: boolean;
  error?: string;
  data?: unknown;
}


interface SubmitRcaInput {
  repairId: string;
  diagnosticChecklist: Record<string, boolean | string>;
  technicianNotes: string | null;
  beforePhotos: string[];
  afterPhotos: string[];
}

// ─── Actions ─────────────────────────────────────────────────────────────


/**
 * Submit an RCA (Root Cause Analysis) report.
 * Only technicians assigned to the repair can submit.
 */
export async function submitRcaReport(input: SubmitRcaInput): Promise<ActionResult> {
  try {
    const { profile } = await getAuthenticatedUser(['technician', 'admin', 'shop_admin']);
    logger.info('TECHNICIAN', 'submitRcaReport', { userId: profile.id, repairId: input.repairId });

    const supabase = await createServerSupabaseClient();

    // Verify repair is assigned to this technician
    if (profile.role === 'technician') {
      const { data: repair } = await supabase
        .from('repairs')
        .select('technician_id')
        .eq('id', input.repairId)
        .single();

      if (repair?.technician_id !== profile.id) {
        return { success: false, error: 'You can only submit RCA for repairs assigned to you.' };
      }
    }

    // Delete old unconfirmed RCAs for this repair to avoid duplicates
    await supabase.from('rca_reports')
      .delete()
      .eq('repair_id', input.repairId)
      .eq('admin_confirmed', false);

    // Insert the RCA report
    const { error: rcaError } = await supabase.from('rca_reports').insert({
      repair_id: input.repairId,
      technician_id: profile.id,
      diagnostic_checklist: input.diagnosticChecklist,
      technician_notes: input.technicianNotes,
      before_photos: input.beforePhotos,
      after_photos: input.afterPhotos,
      admin_confirmed: false,
    });

    if (rcaError) {
      logger.error('TECHNICIAN', 'RCA insert failed', { error: rcaError.message });
      return { success: false, error: `Failed to submit RCA: ${rcaError.message}` };
    }

    // Update repair status to pending_approval
    await supabase.from('repairs').update({ status: 'pending_approval' }).eq('id', input.repairId);

    // Add timeline entry
    await supabase.from('repair_timeline').insert({
      repair_id: input.repairId,
      status: 'done',
      note: 'Root Cause Analysis report submitted',
      updated_by: profile.id,
    });

    logger.info('TECHNICIAN', 'RCA submitted', { repairId: input.repairId });
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error('TECHNICIAN', 'submitRcaReport exception', { error: message });
    return { success: false, error: message };
  }
}

/**
 * Mark a repair as complete (done).
 * Updates status and logs timeline entry.
 */
export async function markRepairComplete(repairId: string): Promise<ActionResult> {
  try {
    const { profile } = await getAuthenticatedUser(['technician', 'admin', 'shop_admin']);
    logger.info('TECHNICIAN', 'markRepairComplete', { userId: profile.id, repairId });

    const supabase = await createServerSupabaseClient();

    // Verify ownership for technicians
    if (profile.role === 'technician') {
      const { data: repair } = await supabase
        .from('repairs')
        .select('technician_id')
        .eq('id', repairId)
        .single();

      if (repair?.technician_id !== profile.id) {
        return { success: false, error: 'You can only complete repairs assigned to you.' };
      }
    }

    const { error } = await supabase
      .from('repairs')
      .update({ status: 'done', updated_at: new Date().toISOString() })
      .eq('id', repairId);

    if (error) {
      logger.error('TECHNICIAN', 'Mark complete failed', { repairId, error: error.message });
      return { success: false, error: `Failed to mark complete: ${error.message}` };
    }

    await supabase.from('repair_timeline').insert({
      repair_id: repairId,
      status: 'done',
      note: 'Repair marked as complete — ready for admin review',
      updated_by: profile.id,
    });

    logger.info('TECHNICIAN', 'Repair completed', { repairId });
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error('TECHNICIAN', 'markRepairComplete exception', { error: message });
    return { success: false, error: message };
  }
}
