import { BrevoClient } from '@getbrevo/brevo';

let brevoClient: BrevoClient | null = null;
let cachedApiKey: string | undefined = undefined;

// Safe error logger that classifies Brevo API errors without exposing API keys or secrets
function logSafeBrevoError(error: any, toEmail: string): string {
  const apiKey = process.env.BREVO_API_KEY?.trim();
  const rawMessage = error?.message || String(error);
  const statusCode = error?.statusCode || error?.status || error?.response?.status;
  const body = error?.body || error?.response?.data;

  // Sanitize message to strip API key if it appears anywhere in output
  let safeMessage = rawMessage.split('\n')[0];
  if (apiKey && apiKey.length > 4) {
    safeMessage = safeMessage.split(apiKey).join('[REDACTED_API_KEY]');
  }

  let safeBodyStr = '';
  if (body) {
    const rawBody = typeof body === 'object' ? JSON.stringify(body) : String(body);
    safeBodyStr = apiKey && apiKey.length > 4 ? rawBody.split(apiKey).join('[REDACTED_API_KEY]') : rawBody;
  }

  let failureCategory = 'General Brevo API Failure';
  let userFriendlyError = 'Failed to send verification email via Brevo. Please try again later.';

  if (statusCode === 401 || (body && typeof body === 'object' && (body as any).code === 'unauthorized')) {
    failureCategory = 'Authentication Failed (Check BREVO_API_KEY)';
    userFriendlyError = 'Email authentication failed: Invalid or missing Brevo API key.';
  } else if (statusCode === 400) {
    failureCategory = 'Bad Request / Unverified Sender (Check BREVO_SENDER_EMAIL)';
    userFriendlyError = 'Brevo rejected email request. Ensure BREVO_SENDER_EMAIL is a verified sender in your Brevo account.';
  } else if (statusCode === 402) {
    failureCategory = 'Quota / Payment Required';
    userFriendlyError = 'Brevo email quota reached or subscription plan required.';
  } else if (statusCode === 429) {
    failureCategory = 'Rate Limit Exceeded';
    userFriendlyError = 'Brevo request rate limit exceeded. Please wait a moment and try again.';
  } else if (
    safeMessage.toLowerCase().includes('timeout') ||
    safeMessage.toLowerCase().includes('enotfound') ||
    safeMessage.toLowerCase().includes('econnrefused')
  ) {
    failureCategory = 'Network / Connection Timeout';
    userFriendlyError = 'Connection to Brevo API timed out. Please try again.';
  }

  // Mask recipient address for privacy (e.g. j***g@gmail.com)
  const maskedTo = toEmail.replace(/^([^@]{1,2})[^@]*(@.*)$/, '$1***$2');
  console.error(`[Brevo Email Service - ${failureCategory}] Recipient: ${maskedTo} | HTTP: ${statusCode || 'UNKNOWN'} | Details: ${safeMessage}${safeBodyStr ? ` | Response: ${safeBodyStr}` : ''}`);

  return userFriendlyError;
}

export function getBrevoClient(): BrevoClient | null {
  const apiKey = process.env.BREVO_API_KEY?.trim();
  if (!apiKey) {
    return null;
  }

  if (brevoClient && cachedApiKey === apiKey) {
    return brevoClient;
  }

  try {
    brevoClient = new BrevoClient({ apiKey });
    cachedApiKey = apiKey;
    return brevoClient;
  } catch (err) {
    console.error('[Brevo Email Service] Error initializing BrevoClient:', err instanceof Error ? err.message : String(err));
    return null;
  }
}

export async function sendVerificationEmail(
  toEmail: string,
  code: string
): Promise<{ sent: boolean; messageId?: string; previewCode: string; error?: string }> {
  console.log(`\n==============================================`);
  console.log(`🔐 [GIP'S KITCHEN AUTH CODE FOR: ${toEmail}]`);
  console.log(`✨ VERIFICATION CODE: ${code}`);
  console.log(`⏳ Valid for 10 minutes.`);
  console.log(`==============================================\n`);

  const apiKey = process.env.BREVO_API_KEY?.trim();
  const senderEmail = process.env.BREVO_SENDER_EMAIL?.trim();
  const senderName = process.env.BREVO_SENDER_NAME?.trim() || 'Gips Kitchen';

  if (!apiKey) {
    const errorMsg = 'BREVO_API_KEY is not configured in environment variables.';
    console.warn(`[Brevo Email Service] ${errorMsg}`);
    return { sent: false, previewCode: code, error: errorMsg };
  }

  if (!senderEmail) {
    const errorMsg = 'BREVO_SENDER_EMAIL is not configured in environment variables.';
    console.warn(`[Brevo Email Service] ${errorMsg}`);
    return { sent: false, previewCode: code, error: errorMsg };
  }

  const client = getBrevoClient();
  if (!client) {
    const errorMsg = 'Failed to initialize Brevo email client.';
    return { sent: false, previewCode: code, error: errorMsg };
  }

  const startTime = Date.now();

  try {
    const htmlContent = `
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
    `;

    const textContent = `Your Gip's Kitchen verification code is: ${code}. It expires in 10 minutes. If you did not request this, please ignore this email.`;

    const response = await client.transactionalEmails.sendTransacEmail({
      sender: {
        name: senderName,
        email: senderEmail
      },
      to: [{ email: toEmail }],
      subject: `${code} is your Gip's Kitchen verification code`,
      textContent,
      htmlContent
    });

    const elapsed = Date.now() - startTime;
    const messageId = response?.messageId || (Array.isArray(response?.messageIds) ? response.messageIds[0] : undefined);

    // Only report that the email was successfully sent after Brevo's API accepts the request successfully
    if (messageId || response) {
      console.log(`[Brevo Email Service] Verification email accepted by Brevo for ${toEmail} in ${elapsed}ms. MessageId: ${messageId || 'OK'}`);
      return { sent: true, messageId, previewCode: code };
    } else {
      console.warn(`[Brevo Email Service] Brevo API responded without messageId confirmation.`);
      return { sent: false, previewCode: code, error: 'Brevo API did not return delivery confirmation.' };
    }
  } catch (err: any) {
    const errorMsg = logSafeBrevoError(err, toEmail);
    return { sent: false, previewCode: code, error: errorMsg };
  }
}
