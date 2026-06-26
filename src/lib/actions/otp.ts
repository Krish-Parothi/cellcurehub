'use server';

import { getAuthenticatedUser } from '@/lib/actions/auth';
import { logger } from '@/lib/logger';

interface ActionResult {
  success: boolean;
  error?: string;
  data?: unknown;
}

export async function sendBookingOtp(phone: string): Promise<ActionResult> {
  // SMS OTP is temporarily disabled, reverting to Email OTP only.
  return { success: false, error: 'SMS OTP is temporarily disabled.' };
}

export async function verifyBookingOtp(phone: string, code: string): Promise<ActionResult> {
  // SMS OTP is temporarily disabled, reverting to Email OTP only.
  return { success: false, error: 'SMS OTP is temporarily disabled.' };
}
