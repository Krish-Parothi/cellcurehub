'use server';

import nodemailer from 'nodemailer';

export async function sendCustomEmail(toEmail: string, customerName: string, subject: string, messageBody: string) {
  try {
    const { GMAIL_USER, GMAIL_APP_PASSWORD } = process.env;

    if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
      return { success: false, error: 'Gmail credentials not configured in .env.local' };
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: GMAIL_USER,
        pass: GMAIL_APP_PASSWORD,
      },
    });

    const formattedMessage = messageBody.replace(/\n/g, '<br/>');

    const mailOptions = {
      from: `"CellCureHub Support" <${GMAIL_USER}>`,
      to: toEmail,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-w: 600px; margin: 0 auto; color: #1A1A1A; line-height: 1.6;">
          <h2 style="color: #FF5C00;">Hi ${customerName || 'there'},</h2>
          <div style="margin: 20px 0;">
            ${formattedMessage}
          </div>
          <p style="margin-top: 30px; border-top: 1px solid #E8E4DF; padding-top: 20px; font-size: 0.9em; color: #666;">
            Best Regards,<br><strong>The CellCureHub Team</strong>
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error: any) {
    console.error('[EMAIL_ERROR]', error);
    return { success: false, error: error.message || 'Failed to send email' };
  }
}

