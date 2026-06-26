'use server';

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

// Use service role key to bypass RLS for email_otps table
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_USER = process.env.GMAIL_USER || process.env.SMTP_USER;
const SMTP_PASS = process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || 'noreply@cellcurehub.com';

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465, // true for 465, false for other ports
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

/**
 * Generates a 6-digit OTP, stores it in DB, and sends via Nodemailer
 */
export async function sendEmailOtp(email: string) {
  try {
    if (!SMTP_USER || !SMTP_PASS) {
      console.warn('SMTP credentials not found in .env, simulating OTP send.');
      // Fallback for development if keys aren't set
      const devOtp = '123456';
      await storeOtpInDb(email, devOtp);
      return { success: true, message: 'OTP stored (dev mode: 123456)' };
    }

    const otpCode = crypto.randomInt(100000, 999999).toString();
    
    // Store in DB first
    await storeOtpInDb(email, otpCode);

    // Send via Nodemailer
    const htmlContent = `
      <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaec; border-radius: 10px;">
        <h2 style="color: #FF5C00; text-align: center;">CellCureHub</h2>
        <p>Hello,</p>
        <p>Welcome to CellCureHub! Use the verification code below:</p>
        <div style="background-color: #F7F7F5; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
          <span style="font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #1A1A1A;">${otpCode}</span>
        </div>
        <p style="font-size: 12px; color: #666;">This code will expire in 10 minutes.</p>
      </div>
    `;

    const info = await transporter.sendMail({
      from: `"CellCureHub" <${SMTP_FROM}>`,
      to: email,
      subject: 'Your CellCureHub Verification Code',
      text: `Your verification code is: ${otpCode}. It expires in 10 minutes.`,
      html: htmlContent,
    });

    console.log('Message sent: %s', info.messageId);
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
