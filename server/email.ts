import nodemailer from 'nodemailer';

let transporter: nodemailer.Transporter | null = null;
let isTransporterVerified = false;

// Safe error logger that classifies failure types and never exposes passwords/secrets
function logSafeSmtpError(stage: 'verification' | 'send', error: any, host: string, port: number, user?: string) {
  const code = error?.code || 'UNKNOWN';
  const rawMessage = error?.message || String(error);
  const responseCode = error?.responseCode;
  const pass = process.env.SMTP_PASS;

  // Sanitize message to strip password if it appears anywhere
  let safeMessage = rawMessage.split('\n')[0];
  if (pass && pass.length > 3) {
    safeMessage = safeMessage.split(pass).join('[REDACTED]');
  }

  let failureCategory = 'General SMTP Failure';
  if (
    code === 'ETIMEDOUT' ||
    code === 'ECONNREFUSED' ||
    code === 'ESOCKETTIMEDOUT' ||
    code === 'ENOTFOUND' ||
    code === 'ECONNRESET' ||
    safeMessage.toLowerCase().includes('connection timeout') ||
    safeMessage.toLowerCase().includes('timeout')
  ) {
    failureCategory = 'Connection Timeout / Network Blocked';
  } else if (
    code === 'EAUTH' ||
    responseCode === 535 ||
    safeMessage.toLowerCase().includes('bad credentials') ||
    safeMessage.toLowerCase().includes('username and password not accepted') ||
    safeMessage.toLowerCase().includes('invalid login')
  ) {
    failureCategory = 'Authentication Failed (Check SMTP_USER or Google App Password)';
  } else if (code === 'EENVELOPE' || safeMessage.toLowerCase().includes('recipient')) {
    failureCategory = 'Envelope / Recipient Address Invalid';
  } else if (code === 'EMESSAGE') {
    failureCategory = 'Message Body / Content Format Error';
  }

  // Mask user email for privacy (e.g. j***g@gmail.com)
  const maskedUser = user
    ? user.replace(/^([^@]{1,2})[^@]*(@.*)$/, '$1***$2')
    : 'not_configured';

  console.error(`[Email Service - ${failureCategory}] Stage: ${stage} | Endpoint: ${host}:${port} (SSL: ${port === 465}) | Account: ${maskedUser} | Error Code: ${code} | Details: ${safeMessage}`);
}

export function getTransporter(): nodemailer.Transporter | null {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST?.trim() || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT?.trim() || '465', 10);
  const isSecure = port === 465;
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();

  if (!user || !pass) {
    console.warn(`[Email Service] SMTP credentials not provided. Set SMTP_USER and SMTP_PASS to enable real email delivery.`);
    return null;
  }

  try {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: isSecure, // true for 465 (SSL), false for 587 (TLS/STARTTLS)
      auth: {
        user,
        pass
      },
      pool: true,
      maxConnections: 3,
      maxMessages: 100,
      connectionTimeout: 10000, // 10s connection timeout for container environments like Render
      greetingTimeout: 10000,   // 10s greeting timeout
      socketTimeout: 15000,     // 15s socket activity timeout
      tls: {
        rejectUnauthorized: false
      }
    });

    if (transporter && !isTransporterVerified) {
      transporter.verify().then(() => {
        isTransporterVerified = true;
        const maskedUser = user.replace(/^([^@]{1,2})[^@]*(@.*)$/, '$1***$2');
        console.log(`[Email Service] SMTP verified successfully on ${host}:${port} (secure: ${isSecure}) for ${maskedUser}`);
      }).catch((err) => {
        logSafeSmtpError('verification', err, host, port, user);
      });
    }
  } catch (err) {
    logSafeSmtpError('verification', err, host, port, user);
    transporter = null;
  }

  return transporter;
}

// Pre-initialize transporter at startup
setTimeout(() => {
  try {
    getTransporter();
  } catch (e) {
    // Suppress startup exceptions
  }
}, 500);

export async function sendVerificationEmail(toEmail: string, code: string): Promise<{ sent: boolean; previewCode: string }> {
  console.log(`\n==============================================`);
  console.log(`🔐 [GIP'S KITCHEN AUTH CODE FOR: ${toEmail}]`);
  console.log(`✨ VERIFICATION CODE: ${code}`);
  console.log(`⏳ Valid for 10 minutes.`);
  console.log(`==============================================\n`);

  const host = process.env.SMTP_HOST?.trim() || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT?.trim() || '465', 10);
  const user = process.env.SMTP_USER?.trim();

  const mailer = getTransporter();
  if (mailer && user) {
    const startTime = Date.now();
    try {
      const fromAddress = process.env.SMTP_FROM?.trim() || `"Gip's Kitchen" <${user}>`;
      
      const info = await mailer.sendMail({
        from: fromAddress,
        to: toEmail,
        subject: `${code} is your Gip's Kitchen verification code`,
        text: `Your Gip's Kitchen verification code is: ${code}. It expires in 10 minutes. If you did not request this, please ignore this email.`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7f7f7;">
            <div style="max-width: 480px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e5e5e5; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
              
              <!-- Header with brand color -->
              <div style="background-color: #1a1a1a; padding: 28px 24px; text-align: center; border-bottom: 3px solid #ff5500;">
                <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 900; letter-spacing: 1px;">
                  GIP'S <span style="color: #ff5500;">KITCHEN</span>
                </h1>
                <p style="color: #a3a3a3; margin: 6px 0 0; font-size: 12px; letter-spacing: 0.5px; text-transform: uppercase; font-weight: 600;">
                  Food & Drinks • Account Verification
                </p>
              </div>

              <!-- Main Content -->
              <div style="padding: 32px 24px; text-align: center;">
                <p style="color: #333333; font-size: 15px; margin: 0 0 16px; font-weight: 500;">
                  Here is your 6-digit verification code to complete your registration:
                </p>

                <!-- Code Box -->
                <div style="background-color: #fff8f5; border: 2px dashed #ff5500; border-radius: 12px; padding: 20px; margin: 20px 0; display: inline-block; min-width: 220px;">
                  <span style="font-size: 34px; font-weight: 900; letter-spacing: 8px; color: #ff5500; font-family: 'Courier New', Courier, monospace; display: block;">
                    ${code}
                  </span>
                </div>

                <p style="color: #737373; font-size: 13px; margin: 16px 0 0; line-height: 1.5;">
                  ⏱️ This code will expire in <strong>10 minutes</strong>.<br>
                  For your security, never share this code with anyone.
                </p>
              </div>

              <!-- Footer -->
              <div style="background-color: #fafafa; padding: 18px 24px; text-align: center; border-top: 1px solid #eeeeee;">
                <p style="color: #a3a3a3; font-size: 11px; margin: 0; line-height: 1.4;">
                  If you didn't request this verification code, you can safely ignore this email.<br>
                  © ${new Date().getFullYear()} Gip's Kitchen Food & Drinks. All rights reserved.
                </p>
              </div>

            </div>
          </body>
          </html>
        `
      });

      const elapsed = Date.now() - startTime;
      console.log(`[Email Service] Verification code email successfully delivered to ${toEmail} in ${elapsed}ms. MessageId: ${info.messageId}`);
      return { sent: true, previewCode: code };
    } catch (err) {
      logSafeSmtpError('send', err, host, port, user);
      // Invalidate transporter on send error so next attempt tries a fresh socket
      transporter = null;
      isTransporterVerified = false;
    }
  } else {
    console.warn(`[Email Service] SMTP Transporter not ready. Verification code logged to server output.`);
  }

  return { sent: false, previewCode: code };
}

