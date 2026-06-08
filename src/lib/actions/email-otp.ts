'use server';

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Use service role key to bypass RLS for email_otps table
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! // Fallback to anon key if service key not configured, but it will fail if RLS is on and service key is missing
);

const MAILJET_API_KEY = process.env.MAILJET_API_KEY;
const MAILJET_SECRET_KEY = process.env.MAILJET_SECRET_KEY;
const MAILJET_SENDER_EMAIL = process.env.MAILJET_SENDER_EMAIL || 'noreply@cellcurehub.com';

/**
 * Generates a 6-digit OTP, stores it in DB, and sends via Mailjet
 */
export async function sendEmailOtp(email: string) {
  try {
    if (!MAILJET_API_KEY || !MAILJET_SECRET_KEY) {
      console.warn('Mailjet credentials not found in .env, simulating OTP send.');
      // Fallback for development if keys aren't set
      const devOtp = '123456';
      await storeOtpInDb(email, devOtp);
      return { success: true, message: 'OTP stored (dev mode: 123456)' };
    }

    const otpCode = crypto.randomInt(100000, 999999).toString();
    
    // Store in DB first
    await storeOtpInDb(email, otpCode);

    // Send via Mailjet
    const authHeader = 'Basic ' + Buffer.from(`${MAILJET_API_KEY}:${MAILJET_SECRET_KEY}`).toString('base64');
    
    const response = await fetch('https://api.mailjet.com/v3.1/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify({
        Messages: [
          {
            From: {
              Email: MAILJET_SENDER_EMAIL,
              Name: 'CellCureHub'
            },
            To: [
              {
                Email: email
              }
            ],
            Subject: 'Your CellCureHub Verification Code',
            TextPart: `Welcome to CellCureHub! Your verification code is: ${otpCode}. It expires in 10 minutes.`,
            HTMLPart: `
              <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaec; border-radius: 10px;">
                <h2 style="color: #FF5C00; text-align: center;">CellCureHub</h2>
                <p>Hello,</p>
                <p>Welcome to CellCureHub! Use the verification code below to complete your registration:</p>
                <div style="background-color: #F7F7F5; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
                  <span style="font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #1A1A1A;">${otpCode}</span>
                </div>
                <p style="font-size: 12px; color: #666;">This code will expire in 10 minutes.</p>
              </div>
            `
          }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Mailjet API Error:', errorData);
      return { success: false, error: 'Failed to send verification email' };
    }

    return { success: true };

  } catch (err: any) {
    console.error('Email OTP send error:', err);
    return { success: false, error: err.message || 'Internal server error' };
  }
}

async function storeOtpInDb(email: string, otpCode: string) {
  // Delete old unused OTPs for this email to prevent clutter
  await supabase.from('email_otps').delete().eq('email', email);

  // Expire in 10 mins
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 10);

  const { error } = await supabase.from('email_otps').insert({
    email,
    otp_code: otpCode,
    expires_at: expiresAt.toISOString(),
  });

  if (error) throw error;
}

/**
 * Validates the OTP against the database
 */
export async function verifyEmailOtp(email: string, otpCode: string) {
  try {
    const { data, error } = await supabase
      .from('email_otps')
      .select('*')
      .eq('email', email)
      .eq('otp_code', otpCode)
      .eq('verified', false)
      .maybeSingle();

    if (error) {
      return { success: false, error: 'Database error while verifying OTP' };
    }

    if (!data) {
      return { success: false, error: 'Invalid or expired OTP' };
    }

    const now = new Date();
    const expiresAt = new Date(data.expires_at);

    if (now > expiresAt) {
      return { success: false, error: 'OTP has expired' };
    }

    // Mark as verified
    await supabase.from('email_otps').update({ verified: true }).eq('id', data.id);

    return { success: true };
  } catch (err: any) {
    console.error('Email OTP verification error:', err);
    return { success: false, error: err.message || 'Internal server error' };
  }
}
