'use server';

import { getAuthenticatedUser } from '@/lib/actions/auth';
import { logger } from '@/lib/logger';

interface ActionResult {
  success: boolean;
  error?: string;
  data?: unknown;
}

export async function sendBookingOtp(phone: string): Promise<ActionResult> {
  try {
    const { profile } = await getAuthenticatedUser(['customer', 'admin']);
    logger.info('OTP', 'sendBookingOtp started (Twilio Verify)', { userId: profile.id, phone });

    if (!/^[6-9]\d{9}$/.test(phone)) {
      return { success: false, error: 'Invalid 10-digit Indian mobile number.' };
    }

    const twilioSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioAuth = process.env.TWILIO_AUTH_TOKEN;
    const verifySid = process.env.TWILIO_VERIFY_SERVICE_SID;

    if (!twilioSid || !twilioAuth || !verifySid) {
      logger.error('OTP', 'Twilio Verify credentials missing');
      return { success: false, error: 'SMS service is not configured on the server.' };
    }

    const e164Phone = `+91${phone}`;
    const twilioUrl = `https://verify.twilio.com/v2/Services/${verifySid}/Verifications`;
    const twilioData = new URLSearchParams();
    twilioData.append('To', e164Phone);
    twilioData.append('Channel', 'sms');

    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${twilioSid}:${twilioAuth}`).toString('base64')}`
      },
      body: twilioData.toString(),
    });

    if (!response.ok) {
      const respText = await response.text();
      logger.error('OTP', 'Twilio Verify API error', { response: respText });
      try {
        const errJson = JSON.parse(respText);
        if (errJson.message) {
          return { success: false, error: errJson.message };
        }
      } catch {}
      return { success: false, error: 'Failed to send SMS via Twilio Verify.' };
    }

    logger.info('OTP', 'OTP sent via Twilio Verify successfully', { phone });
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    logger.error('OTP', 'sendBookingOtp exception', { error: msg });
    return { success: false, error: msg };
  }
}

export async function verifyBookingOtp(phone: string, code: string): Promise<ActionResult> {
  try {
    const { profile } = await getAuthenticatedUser(['customer', 'admin']);
    logger.info('OTP', 'verifyBookingOtp started (Twilio Verify)', { userId: profile.id, phone });

    const twilioSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioAuth = process.env.TWILIO_AUTH_TOKEN;
    const verifySid = process.env.TWILIO_VERIFY_SERVICE_SID;

    if (!twilioSid || !twilioAuth || !verifySid) {
      return { success: false, error: 'SMS service not configured on the server.' };
    }

    const e164Phone = `+91${phone}`;
    const twilioUrl = `https://verify.twilio.com/v2/Services/${verifySid}/VerificationCheck`;
    const twilioData = new URLSearchParams();
    twilioData.append('To', e164Phone);
    twilioData.append('Code', code);

    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${twilioSid}:${twilioAuth}`).toString('base64')}`
      },
      body: twilioData.toString(),
    });

    if (!response.ok) {
      const respText = await response.text();
      logger.error('OTP', 'Twilio Verify Check API error', { response: respText });
      try {
        const errJson = JSON.parse(respText);
        if (errJson.message) {
          return { success: false, error: errJson.message };
        }
      } catch {}
      return { success: false, error: 'Failed to verify OTP with Twilio.' };
    }

    const result = await response.json();
    
    if (result.status === 'approved') {
      logger.info('OTP', 'OTP verified successfully via Twilio Verify', { phone });
      return { success: true };
    } else {
      return { success: false, error: 'Invalid or expired OTP.' };
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    logger.error('OTP', 'verifyBookingOtp exception', { error: msg });
    return { success: false, error: msg };
  }
}
