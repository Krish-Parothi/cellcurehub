'use server';

import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';
import type { User, UserRole } from '@/lib/types';

export interface AuthenticatedUser {
  authId: string;
  profile: User;
}

/**
 * Verify the current session and return the authenticated user profile.
 * 
 * This is the SINGLE SOURCE OF TRUTH for auth in all server actions.
 * Call this at the top of every server action before doing anything.
 * 
 * @param requiredRoles - If provided, the user's role must be one of these.
 * @returns The authenticated user, or throws an error.
 */
export async function getAuthenticatedUser(
  requiredRoles?: UserRole[]
): Promise<AuthenticatedUser> {
  const supabase = await createServerSupabaseClient();

  // Step 1: Verify the session (JWT from cookie)
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

  if (authError || !authUser) {
    logger.warn('AUTH', 'Unauthenticated access attempt', {
      error: authError?.message,
      hint: 'No valid session found in cookies'
    });
    throw new Error('UNAUTHENTICATED: You must be logged in to perform this action.');
  }

  logger.debug('AUTH', 'Session verified', { userId: authUser.id, email: authUser.email });

  // Step 2: Fetch the user profile from the public.users table
  let { data: profile, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single();

  if (profileError || !profile) {
    logger.warn('AUTH', 'Profile not found, attempting Just-In-Time provisioning', {
      userId: authUser.id,
      error: profileError?.message
    });

    // Create an admin client to bypass RLS and insert the profile
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const role = (authUser.app_metadata?.role as string) || 'customer';
    const phone = authUser.phone || authUser.app_metadata?.phone || null;

    const { data: newProfile, error: insertError } = await supabaseAdmin
      .from('users')
      .upsert({
        id: authUser.id,
        full_name: authUser.user_metadata?.full_name || authUser.email || 'User',
        email: authUser.email || null,
        phone: phone ? `+91${phone.replace(/^\+91/, '')}` : null,
        role: role as UserRole,
        is_active: true,
      }, { onConflict: 'id' })
      .select()
      .single();

    if (insertError || !newProfile) {
      logger.error('AUTH', 'JIT Provisioning failed', { userId: authUser.id, error: insertError?.message });
      throw new Error('PROFILE_NOT_FOUND: Your user profile could not be loaded or created. Please contact support.');
    }

    profile = newProfile;
  }

  // Step 3: Check if the user's account is active
  if (!profile.is_active) {
    logger.warn('AUTH', 'Inactive user attempted access', { userId: profile.id, role: profile.role });
    throw new Error('ACCOUNT_DISABLED: Your account has been deactivated. Please contact support.');
  }

  // Step 4: Verify role authorization if required
  if (requiredRoles && requiredRoles.length > 0) {
    if (!requiredRoles.includes(profile.role as UserRole)) {
      logger.warn('AUTH', 'Role authorization failed', {
        userId: profile.id,
        userRole: profile.role,
        requiredRoles,
      });
      throw new Error(
        `UNAUTHORIZED: This action requires one of these roles: ${requiredRoles.join(', ')}. Your role is: ${profile.role}.`
      );
    }
  }

  logger.debug('AUTH', 'Authorization passed', { userId: profile.id, role: profile.role });

  return {
    authId: authUser.id,
    profile: profile as User,
  };
}

export async function createVerifiedUser(
  email: string,
  password: string,
  fullName: string,
  phone: string
) {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const formattedPhone = phone ? `+91${phone.replace(/^\+91/, '')}` : null;

    // 1. Create the user in auth.users with email_confirm = true
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      phone_confirm: true,
      user_metadata: {
        full_name: fullName,
        phone: formattedPhone,
        role: 'customer'
      }
    });

    if (authError) {
      return { success: false, error: authError.message };
    }

    if (!authData.user) {
      return { success: false, error: 'Failed to create user' };
    }

    // 2. Insert into public.users
    const { error: dbError } = await supabaseAdmin.from('users').insert({
      id: authData.user.id,
      email,
      full_name: fullName,
      phone: formattedPhone,
      role: 'customer',
      is_active: true,
      phone_verified: false
    });

    if (dbError) {
      // Even if db insert fails, JIT will catch it later, but we should log it
      logger.error('AUTH', 'Failed to insert public user during signup', { error: dbError.message });
    }

    return { success: true, data: authData.user };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function verifyPasswordAndSendOtp(email: string, password: string) {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // We cannot easily verify a password using admin api directly without a session.
    // Instead we can use signInWithPassword with a throwaway standard client.
    const tempClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false } }
    );
    
    const { data, error } = await tempClient.auth.signInWithPassword({
      email,
      password
    });
    
    if (error || !data.user) {
      return { success: false, error: error?.message || 'Invalid credentials' };
    }
    
    // Credentials are valid. Now send the OTP.
    const { sendEmailOtp } = await import('@/lib/actions/email-otp');
    const otpResult = await sendEmailOtp(email);
    
    if (!otpResult.success) {
      return { success: false, error: otpResult.error };
    }
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
