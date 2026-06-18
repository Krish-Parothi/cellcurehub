'use server';

import { createClient } from '@supabase/supabase-js';
import type { UserRole } from '@/lib/types';
import { getAuthenticatedUser } from './auth';
import { logger } from '../logger';

// We must use the service role key to invite users safely from the backend.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function inviteStaff(params: {
  email: string;
  fullName: string;
  role: UserRole;
  phone?: string;
  shopId?: string;
  aadharNumber?: string;
}) {
  try {
    const { profile } = await getAuthenticatedUser(['admin']);

    logger.info('ADMIN', `Pre-provisioning staff: ${params.email} as ${params.role}`, {
      invitedBy: profile.id,
    });

    // Generate a completely fake UUID. This avoids all email rate limits.
    // When the user logs in via Google, the OAuth callback will seamlessly merge this fake UUID into their real Google UUID.
    const fakeUserId = crypto.randomUUID();

    // Upsert into public.users with the fake UUID
    const { error: upsertError } = await supabaseAdmin.from('users').upsert(
      {
        id: fakeUserId,
        email: params.email,
        full_name: params.fullName,
        phone: params.phone ? `+91${params.phone.replace(/^\+91/, '')}` : null,
        role: params.role,
        shop_id: params.shopId || null,
        is_active: true,
        phone_verified: false,
      },
      { onConflict: 'email', ignoreDuplicates: false } // Conflict on email so we don't create duplicates!
    );

    if (upsertError) {
      logger.error('ADMIN', 'Failed to pre-provision user profile', { error: upsertError });
      return { success: false, error: 'Failed to create pre-provisioned profile: ' + upsertError.message };
    }

    // Save technician details if applicable
    if (params.role === 'technician' && params.aadharNumber) {
      // Need to find the actual ID if the upsert conflicted on email and kept the old ID
      const { data: existingUser } = await supabaseAdmin.from('users').select('id').eq('email', params.email).single();
      const finalUserId = existingUser?.id || fakeUserId;

      await supabaseAdmin.from('technician_details').upsert(
        {
          user_id: finalUserId,
          aadhar_number: params.aadharNumber,
          verified: false,
        },
        { onConflict: 'user_id' }
      );
    }

    logger.info('ADMIN', 'Staff member pre-provisioned successfully', { role: params.role });
    return { success: true };
  } catch (err: any) {
    logger.error('ADMIN', 'Unexpected error in inviteStaff', { error: err });
    return { success: false, error: err.message || 'An unexpected error occurred.' };
  }
}
