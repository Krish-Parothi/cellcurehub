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
  password?: string;
  phone?: string;
  shopId?: string;
  aadharNumber?: string;
}) {
  try {
    const { profile } = await getAuthenticatedUser(['admin']);

    logger.info('ADMIN', `Provisioning staff: ${params.email} as ${params.role}`, {
      invitedBy: profile.id,
    });

    if (!params.password) {
      return { success: false, error: 'Password is required to add staff.' };
    }

    let authUserId: string | null = null;

    // 1. Create or Update Auth User via Admin API
    try {
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: params.email,
        password: params.password,
        email_confirm: true,
        user_metadata: {
          full_name: params.fullName,
          phone: params.phone,
        },
        app_metadata: {
          role: params.role,
          shop_id: params.shopId || null,
        }
      });

      if (createError) {
        if (createError.message.includes('already exists') || createError.status === 422) {
          // User already exists in Auth, fetch their ID and update
          const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
          const existingUser = existingUsers?.users.find(u => u.email === params.email);
          
          if (!existingUser) {
             return { success: false, error: 'User exists but could not retrieve ID.' };
          }
          
          authUserId = existingUser.id;

          await supabaseAdmin.auth.admin.updateUserById(authUserId, {
            password: params.password,
            app_metadata: { role: params.role, shop_id: params.shopId || null }
          });
        } else {
          logger.error('ADMIN', 'Failed to create auth user', { error: createError });
          return { success: false, error: createError.message };
        }
      } else {
        authUserId = newUser.user.id;
      }
    } catch (e: any) {
      return { success: false, error: e.message };
    }

    if (!authUserId) return { success: false, error: 'Failed to resolve user ID' };

    // 2. Upsert into public.users table with real Auth UUID
    const { error: upsertError } = await supabaseAdmin.from('users').upsert({
      id: authUserId,
      email: params.email,
      full_name: params.fullName,
      phone: params.phone ? `+91${params.phone.replace(/^\+91/, '')}` : null,
      role: params.role,
      shop_id: params.shopId || null,
      is_active: true,
    }, { onConflict: 'id' });

    if (upsertError) {
       logger.error('ADMIN', 'Failed to upsert user profile', { error: upsertError });
       return { success: false, error: upsertError.message };
    }

    // Save technician details if applicable
    if (params.role === 'technician' && params.aadharNumber) {
      await supabaseAdmin.from('technician_details').upsert(
        {
          user_id: authUserId,
          aadhar_number: params.aadharNumber,
          verified: false,
        },
        { onConflict: 'user_id' }
      );
    }

    logger.info('ADMIN', 'Staff provisioned successfully', { role: params.role, authUserId });
    return { success: true, message: 'Staff created successfully. They can now login with the email and password.' };
  } catch (err: any) {
    logger.error('ADMIN', 'Unexpected error in inviteStaff', { error: err });
    return { success: false, error: err.message || 'An unexpected error occurred.' };
  }
}
