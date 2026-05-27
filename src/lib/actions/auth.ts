'use server';

import { createServerSupabaseClient } from '@/lib/supabase-server';
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
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single();

  if (profileError || !profile) {
    logger.error('AUTH', 'Profile not found for authenticated user', { 
      userId: authUser.id,
      error: profileError?.message 
    });
    throw new Error('PROFILE_NOT_FOUND: Your user profile could not be loaded. Please contact support.');
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
