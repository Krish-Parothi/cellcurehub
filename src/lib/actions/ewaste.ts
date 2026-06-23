'use server';

import { createServerSupabaseClient } from '@/lib/supabase-server';
import { logger } from '@/lib/logger';
import { createClient } from '@supabase/supabase-js';

// Use service role client for elevating privileges to credit user's account safely
const getServiceRoleClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
};

export async function creditEwasteAccount(ewasteId: string, amount: number) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Verify admin role
    const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single();
    if (!userData || !['admin', 'shop_admin'].includes(userData.role)) {
      return { success: false, error: 'Unauthorized role' };
    }

    // Fetch E-waste request to get customer ID
    const { data: ewaste } = await supabase.from('ewaste').select('*').eq('id', ewasteId).single();
    if (!ewaste) {
      return { success: false, error: 'E-waste request not found' };
    }

    if (ewaste.status === 'credited') {
      return { success: false, error: 'Request is already credited' };
    }

    const adminSupabase = getServiceRoleClient();

    // Get current user credits
    const { data: customer } = await adminSupabase.from('users').select('credits').eq('id', ewaste.customer_id).single();
    const currentCredits = customer?.credits || 0;

    // Update user's credits
    const { error: creditError } = await adminSupabase
      .from('users')
      .update({ credits: currentCredits + amount })
      .eq('id', ewaste.customer_id);

    if (creditError) throw creditError;

    // Update E-waste status
    const { error: ewasteError } = await adminSupabase
      .from('ewaste')
      .update({ status: 'credited', admin_offer: amount })
      .eq('id', ewasteId);

    if (ewasteError) throw ewasteError;

    // Notify customer
    await adminSupabase.from('notifications').insert({
      recipient_id: ewaste.customer_id,
      type: 'ewaste_credited',
      message: `You have received ${amount} Credits for your E-waste submission.`,
    });

    return { success: true };
  } catch (err: any) {
    logger.error('EWASTE', 'Failed to credit account', err);
    return { success: false, error: err.message || 'Server error' };
  }
}

export async function revokeEwasteCredits(ewasteId: string) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return { success: false, error: 'Unauthorized' };

    const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single();
    if (!userData || !['admin', 'shop_admin'].includes(userData.role)) {
      return { success: false, error: 'Unauthorized role' };
    }

    const adminSupabase = getServiceRoleClient();

    const { data: ewaste } = await adminSupabase.from('ewaste').select('*').eq('id', ewasteId).single();
    if (!ewaste) return { success: false, error: 'E-waste request not found' };

    if (ewaste.status !== 'credited') {
      return { success: false, error: 'Request is not in credited status' };
    }

    const { data: customer } = await adminSupabase.from('users').select('credits').eq('id', ewaste.customer_id).single();
    const currentCredits = customer?.credits || 0;
    const deductAmount = ewaste.admin_offer || 0;

    const { error: creditError } = await adminSupabase
      .from('users')
      .update({ credits: Math.max(0, currentCredits - deductAmount) })
      .eq('id', ewaste.customer_id);

    if (creditError) throw creditError;

    const { error: ewasteError } = await adminSupabase
      .from('ewaste')
      .update({ status: 'rejected', admin_offer: null })
      .eq('id', ewasteId);

    if (ewasteError) throw ewasteError;

    await adminSupabase.from('notifications').insert({
      recipient_id: ewaste.customer_id,
      type: 'ewaste_revoked',
      message: `Your E-waste submission was cancelled and ${deductAmount} Credits were deducted.`,
    });

    return { success: true };
  } catch (err: any) {
    logger.error('EWASTE', 'Failed to revoke credits', err);
    return { success: false, error: err.message || 'Server error' };
  }
}

