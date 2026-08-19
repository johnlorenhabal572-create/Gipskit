import nodemailer from 'nodemailer';

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass }
    });
  }
  return transporter;
}

export async function sendVerificationEmail(toEmail: string, code: string): Promise<{ sent: boolean; previewCode: string }> {
  console.log(`\n==============================================`);
  console.log(`🔐 [GMAIL AUTH CODE FOR: ${toEmail}]`);
  console.log(`✨ VERIFICATION CODE: ${code}`);
  console.log(`⏳ Valid for 10 minutes.`);
  console.log(`==============================================\n`);

  const mailer = getTransporter();
  if (mailer) {
    try {
      await mailer.sendMail({
        from: process.env.SMTP_FROM || `"Store Authentication" <${process.env.SMTP_USER}>`,
        to: toEmail,
        subject: `Your Login Verification Code: ${code}`,
        text: `Your login verification code is: ${code}. It expires in 10 minutes.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #eaeaea; border-radius: 16px;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h2 style="color: #111; margin: 0; font-size: 24px;">Authentication Code</h2>
              <p style="color: #666; font-size: 14px; margin-top: 8px;">Use the code below to log in to your account</p>
            </div>
            <div style="background-color: #f9f9f9; padding: 20px; text-align: center; border-radius: 12px; margin-bottom: 24px;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #ff5500; font-family: monospace;">${code}</span>
            </div>
            <p style="color: #888; font-size: 12px; text-align: center; margin: 0;">This code will expire in 10 minutes. If you didn't request this code, please ignore this email.</p>
          </div>
        `
      });
      return { sent: true, previewCode: code };
    } catch (err) {
      console.error('[Email Service] Failed to send email via SMTP:', (err as Error).message);
    }
  }

  return { sent: false, previewCode: code };
}
