'use server';

import { createServerSupabaseClient } from '@/lib/supabase-server';
import { getAuthenticatedUser } from '@/lib/actions/auth';
import { logger } from '@/lib/logger';
import type { AttendanceStatus } from '@/lib/types';

// ─── Types ───────────────────────────────────────────────────────────────

interface ActionResult {
  success: boolean;
  error?: string;
  data?: unknown;
}

interface UpsertStaffInput {
  userId?: string;  // existing user id for update, undefined for create
  fullName: string;
  email: string;
  phone?: string;
  role: 'technician' | 'delivery';
  shopId: string;
  aadharNumber?: string; // for technicians
}

interface SetAttendanceInput {
  employeeId: string;
  date: string;        // YYYY-MM-DD
  status: AttendanceStatus | null; // null = delete
}

interface SaveSalaryInput {
  employeeId: string;
  month: string;       // YYYY-MM-01
  baseSalary: number;
  perDayDeduction: number;
  override: number | null;
}

// ─── Actions ─────────────────────────────────────────────────────────────

/**
 * Create or update a staff member for a specific shop.
 * Only shop_admins (for their shop) and admins can do this.
 */
export async function upsertStaff(input: UpsertStaffInput): Promise<ActionResult> {
  try {
    const { profile } = await getAuthenticatedUser(['shop_admin', 'admin']);
    logger.info('SHOP_ADMIN', 'upsertStaff', { userId: profile.id, shopId: input.shopId, role: input.role });

    // Shop admins can only manage staff in their own shop
    if (profile.role === 'shop_admin' && profile.shop_id !== input.shopId) {
      logger.warn('SHOP_ADMIN', 'Cross-shop staff mutation blocked', {
        adminShopId: profile.shop_id,
        targetShopId: input.shopId,
      });
      return { success: false, error: 'You can only manage staff in your own shop.' };
    }

    // Validate inputs
    if (!input.fullName.trim()) {
      return { success: false, error: 'Staff name is required.' };
    }
    if (!input.email.trim()) {
      return { success: false, error: 'Email is required.' };
    }
    if (!['technician', 'delivery', 'shop_admin'].includes(input.role)) {
      return { success: false, error: 'Invalid staff role.' };
    }

    const supabase = await createServerSupabaseClient();

    // Upsert the user record
    const { data: user, error: userError } = await supabase
      .from('users')
      .upsert({
        ...(input.userId ? { id: input.userId } : {}),
        full_name: input.fullName,
        email: input.email,
        phone: input.phone || null,
        role: input.role,
        shop_id: input.shopId,
        is_active: true,
      }, { onConflict: 'id' })
      .select('id')
      .single();

    if (userError) {
      logger.error('SHOP_ADMIN', 'Staff upsert failed', { error: userError.message });
      return { success: false, error: `Failed to save staff: ${userError.message}` };
    }

    // If technician, insert technician_details
    if (input.role === 'technician' && input.aadharNumber && user) {
      const { error: detailError } = await supabase
        .from('technician_details')
        .insert({
          user_id: user.id,
          aadhar_number: input.aadharNumber,
          verified: false,
        });

      if (detailError && !detailError.message.includes('duplicate')) {
        logger.warn('SHOP_ADMIN', 'Technician details insert error', { error: detailError.message });
      }
    }

    logger.info('SHOP_ADMIN', 'Staff upserted', { staffId: user?.id, role: input.role });
    return { success: true, data: { userId: user?.id } };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error('SHOP_ADMIN', 'upsertStaff exception', { error: message });
    return { success: false, error: message };
  }
}

/**
 * Permanently delete a staff member and all related records.
 * Only shop_admins (for their shop) and admins can do this.
 */
export async function deleteStaff(staffId: string): Promise<ActionResult> {
  try {
    const { profile } = await getAuthenticatedUser(['shop_admin', 'admin']);
    logger.info('SHOP_ADMIN', 'deleteStaff', { userId: profile.id, staffId });

    const supabase = await createServerSupabaseClient();

    // Fetch the staff member
    const { data: staff, error: staffError } = await supabase
      .from('users')
      .select('id, full_name, role, shop_id')
      .eq('id', staffId)
      .single();

    if (staffError || !staff) {
      return { success: false, error: 'Staff member not found.' };
    }

    // Shop admins can only delete staff in their own shop
    if (profile.role === 'shop_admin' && staff.shop_id !== profile.shop_id) {
      return { success: false, error: 'You can only remove staff in your own shop.' };
    }

    // Only allow deleting technicians, delivery staff, and shop admins
    if (!['technician', 'delivery', 'shop_admin'].includes(staff.role)) {
      return { success: false, error: 'Cannot remove users with this role.' };
    }

    // Check for active repair assignments (technician)
    if (staff.role === 'technician') {
      const { count } = await supabase
        .from('repairs')
        .select('id', { count: 'exact', head: true })
        .eq('technician_id', staffId)
        .not('status', 'in', '("delivered","cancelled","done")');

      if (count && count > 0) {
        return { success: false, error: `Cannot remove — ${count} active repair(s) assigned. Reassign them first.` };
      }
    }

    // Check for active delivery assignments
    if (staff.role === 'delivery') {
      const { count } = await supabase
        .from('delivery_assignments')
        .select('id', { count: 'exact', head: true })
        .eq('delivery_boy_id', staffId)
        .not('status', 'in', '("delivered","returned")');

      if (count && count > 0) {
        return { success: false, error: `Cannot remove — ${count} active delivery assignment(s). Complete or reassign them first.` };
      }
    }

    // Instead of deleting the user and their history, revoke their staff privileges
    const { error: demoteError } = await supabase.from('users').update({
      role: 'customer',
      shop_id: null
    }).eq('id', staffId);

    if (demoteError) {
      logger.error('SHOP_ADMIN', 'Staff role revocation failed', { error: demoteError.message });
      return { success: false, error: `Failed to revoke access: ${demoteError.message}` };
    }

    logger.info('SHOP_ADMIN', 'Staff access revoked (demoted to customer)', { staffId, name: staff.full_name });
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error('SHOP_ADMIN', 'deleteStaff exception', { error: message });
    return { success: false, error: message };
  }
}

/**
 * Toggle a staff member's active status.
 */
export async function toggleStaffActive(staffId: string, currentActive: boolean): Promise<ActionResult> {
  try {
    const { profile } = await getAuthenticatedUser(['shop_admin', 'admin']);
    logger.info('SHOP_ADMIN', 'toggleStaffActive', { userId: profile.id, staffId, currentActive });

    const supabase = await createServerSupabaseClient();

    // Verify the staff belongs to the admin's shop
    if (profile.role === 'shop_admin') {
      const { data: staff } = await supabase.from('users').select('shop_id').eq('id', staffId).single();
      if (staff?.shop_id !== profile.shop_id) {
        return { success: false, error: 'You can only manage staff in your own shop.' };
      }
    }

    const { error } = await supabase
      .from('users')
      .update({ is_active: !currentActive })
      .eq('id', staffId);

    if (error) {
      logger.error('SHOP_ADMIN', 'Toggle active failed', { error: error.message });
      return { success: false, error: error.message };
    }

    logger.info('SHOP_ADMIN', 'Staff active toggled', { staffId, newActive: !currentActive });
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error('SHOP_ADMIN', 'toggleStaffActive exception', { error: message });
    return { success: false, error: message };
  }
}

/**
 * Set attendance for an employee on a specific date.
 * null status = delete the attendance record.
 */
export async function setAttendance(input: SetAttendanceInput): Promise<ActionResult> {
  try {
    const { profile } = await getAuthenticatedUser(['shop_admin', 'admin']);
    const shopId = profile.role === 'admin' ? null : profile.shop_id;
    
    logger.info('SHOP_ADMIN', 'setAttendance', {
      userId: profile.id,
      employeeId: input.employeeId,
      date: input.date,
      status: input.status,
    });

    const supabase = await createServerSupabaseClient();

    if (input.status === null) {
      // Delete the attendance record
      const { error } = await supabase
        .from('attendance')
        .delete()
        .match({ employee_id: input.employeeId, date: input.date });

      if (error) {
        logger.error('SHOP_ADMIN', 'Attendance delete failed', { error: error.message });
        return { success: false, error: error.message };
      }
    } else {
      // Upsert the attendance record
      const { error } = await supabase
        .from('attendance')
        .upsert(
          {
            employee_id: input.employeeId,
            shop_id: shopId,
            date: input.date,
            status: input.status,
          },
          { onConflict: 'employee_id,date' as any }
        );

      if (error) {
        logger.error('SHOP_ADMIN', 'Attendance upsert failed', { error: error.message });
        return { success: false, error: error.message };
      }
    }

    logger.debug('SHOP_ADMIN', 'Attendance set', { employeeId: input.employeeId, date: input.date, status: input.status });
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error('SHOP_ADMIN', 'setAttendance exception', { error: message });
    return { success: false, error: message };
  }
}

/**
 * Save salary configuration for an employee.
 */
export async function saveSalaryConfig(input: SaveSalaryInput): Promise<ActionResult> {
  try {
    const { profile } = await getAuthenticatedUser(['shop_admin', 'admin']);
    const shopId = profile.role === 'admin' ? null : profile.shop_id;

    logger.info('SHOP_ADMIN', 'saveSalaryConfig', {
      userId: profile.id,
      employeeId: input.employeeId,
      month: input.month,
    });

    // Validate
    if (input.baseSalary < 0 || input.perDayDeduction < 0) {
      return { success: false, error: 'Salary values cannot be negative.' };
    }

    const supabase = await createServerSupabaseClient();

    const { error } = await supabase.from('salary_config').upsert(
      {
        employee_id: input.employeeId,
        shop_id: shopId,
        month: input.month,
        base_salary: input.baseSalary,
        per_day_deduction: input.perDayDeduction,
        final_salary_override: input.override,
      },
      { onConflict: 'employee_id,month' as any }
    );

    if (error) {
      logger.error('SHOP_ADMIN', 'Salary config save failed', { error: error.message });
      return { success: false, error: error.message };
    }

    logger.info('SHOP_ADMIN', 'Salary config saved', { employeeId: input.employeeId, month: input.month });
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error('SHOP_ADMIN', 'saveSalaryConfig exception', { error: message });
    return { success: false, error: message };
  }
}
