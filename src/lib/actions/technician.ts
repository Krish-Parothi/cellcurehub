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

interface AddPartInput {
  repairId: string;
  partId: string;
  quantity: number;
  costAtTime: number;
  currentStock: number;
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
 * Add a part to a repair (Part Requisition).
 * Only technicians assigned to the repair (or admins/shop_admins) can do this.
 * Automatically deducts from inventory.
 */
export async function addPartToRepair(input: AddPartInput): Promise<ActionResult> {
  try {
    const { profile } = await getAuthenticatedUser(['technician', 'admin', 'shop_admin']);
    logger.info('TECHNICIAN', 'addPartToRepair', {
      userId: profile.id,
      repairId: input.repairId,
      partId: input.partId,
      quantity: input.quantity,
    });

    // Validate
    if (input.quantity < 1) {
      return { success: false, error: 'Quantity must be at least 1.' };
    }
    if (input.quantity > input.currentStock) {
      logger.warn('TECHNICIAN', 'Insufficient stock', { partId: input.partId, requested: input.quantity, available: input.currentStock });
      return { success: false, error: `Only ${input.currentStock} units in stock.` };
    }

    const supabase = await createServerSupabaseClient();

    // Verify repair is assigned to this technician
    if (profile.role === 'technician') {
      const { data: repair } = await supabase
        .from('repairs')
        .select('technician_id')
        .eq('id', input.repairId)
        .single();

      if (repair?.technician_id !== profile.id) {
        logger.warn('TECHNICIAN', 'Part add on unassigned repair', { repairId: input.repairId });
        return { success: false, error: 'You can only add parts to repairs assigned to you.' };
      }
    }

    // Insert parts_used
    const { error: insertError } = await supabase.from('parts_used').insert({
      repair_id: input.repairId,
      part_id: input.partId,
      quantity: input.quantity,
      cost_at_time: input.costAtTime,
    });

    if (insertError) {
      logger.error('TECHNICIAN', 'Parts_used insert failed', { error: insertError.message });
      return { success: false, error: `Failed to log part usage: ${insertError.message}` };
    }

    // Deduct from inventory
    const { error: stockError } = await supabase
      .from('parts')
      .update({ quantity_in_stock: input.currentStock - input.quantity })
      .eq('id', input.partId);

    if (stockError) {
      logger.error('TECHNICIAN', 'Stock deduction failed', { partId: input.partId, error: stockError.message });
      // Non-fatal but important to log
    }

    logger.info('TECHNICIAN', 'Part added successfully', { partId: input.partId, quantity: input.quantity });
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error('TECHNICIAN', 'addPartToRepair exception', { error: message });
    return { success: false, error: message };
  }
}

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
