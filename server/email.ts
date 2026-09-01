import nodemailer from 'nodemailer';

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter) return transporter;

  const user = process.env.GMAIL_USER || process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS || process.env.EMAIL_PASS || process.env.SMTP_PASSWORD;
  const host = process.env.SMTP_HOST || (user && user.includes('@gmail.com') ? 'smtp.gmail.com' : undefined);
  const port = parseInt(process.env.SMTP_PORT || (host === 'smtp.gmail.com' ? '465' : '587'), 10);

  if (!user || !pass) {
    console.warn('\n⚠️ [Email Service] No email credentials found in environment variables!');
    console.warn('⚠️ To enable real email delivery on Render/Cloud, set:');
    console.warn('   - GMAIL_USER (e.g. yourstore@gmail.com)');
    console.warn('   - GMAIL_APP_PASSWORD (16-character Google App Password from myaccount.google.com/apppasswords)\n');
    return null;
  }

  try {
    // If Gmail is detected, use optimized Gmail configuration
    if (host === 'smtp.gmail.com' || (user && user.endsWith('@gmail.com')) || (!host && user)) {
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: user.trim(),
          pass: pass.trim().replace(/\s+/g, '') // remove spaces from 16-char app password
        },
        tls: {
          rejectUnauthorized: false
        }
      });
    } else if (host) {
      transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: {
          user: user.trim(),
          pass: pass.trim()
        },
        tls: {
          rejectUnauthorized: false
        }
      });
    }
  } catch (err) {
    console.error('❌ [Email Service] Failed to initialize nodemailer transporter:', err);
  }

  return transporter;
}

export async function sendVerificationEmail(toEmail: string, code: string): Promise<{ sent: boolean; previewCode: string; error?: string }> {
  console.log(`\n==============================================`);
  console.log(`🔐 [AUTH CODE DISPATCH FOR: ${toEmail}]`);
  console.log(`✨ VERIFICATION CODE: ${code}`);
  console.log(`⏳ Valid for 10 minutes.`);
  console.log(`==============================================\n`);

  const senderEmail = process.env.GMAIL_USER || process.env.SMTP_USER || process.env.EMAIL_USER || 'no-reply@gipskitchen.com';
  const mailer = getTransporter();

  if (mailer) {
    try {
      const info = await mailer.sendMail({
        from: process.env.SMTP_FROM || `"Gip's Kitchen" <${senderEmail}>`,
        to: toEmail,
        subject: `Your Gip's Kitchen Verification Code: ${code}`,
        text: `Your Gip's Kitchen verification code is: ${code}. It expires in 10 minutes.`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 32px 24px; border: 1px solid #e5e7eb; border-radius: 16px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h1 style="color: #111827; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">GIP'S KITCHEN</h1>
              <p style="color: #6b7280; font-size: 14px; margin-top: 6px;">Email Verification Code</p>
            </div>
            <div style="background-color: #f9fafb; padding: 24px; text-align: center; border-radius: 12px; margin-bottom: 24px; border: 1px dashed #d1d5db;">
              <span style="font-size: 36px; font-weight: 900; letter-spacing: 10px; color: #ff5500; font-family: monospace; display: inline-block; margin-left: 10px;">${code}</span>
            </div>
            <p style="color: #4b5563; font-size: 13px; line-height: 1.5; text-align: center; margin: 0 0 12px 0;">
              Enter this 6-digit code on the registration page to verify your account.
            </p>
            <p style="color: #9ca3af; font-size: 11px; text-align: center; margin: 0;">
              This code will expire in 10 minutes. If you did not request this code, please ignore this email.
            </p>
          </div>
        `
      });

      console.log(`✅ [Email Service] Verification email successfully sent to ${toEmail}. MessageId: ${info.messageId}`);
      return { sent: true, previewCode: code };
    } catch (err: any) {
      console.error(`❌ [Email Service] Failed to send email to ${toEmail}:`, err.message);
      if (err.message && err.message.includes('535')) {
        console.error('👉 Tip: Gmail requires an "App Password" (16 characters) when 2-Step Verification is active, not your regular Gmail password.');
        console.error('👉 Generate one at: https://myaccount.google.com/apppasswords');
      }
      return { sent: false, previewCode: code, error: err.message };
    }
  }

  return { 
    sent: false, 
    previewCode: code, 
    error: 'Email transporter not configured. Please add GMAIL_USER and GMAIL_APP_PASSWORD to your environment variables in Render.' 
  };
}

