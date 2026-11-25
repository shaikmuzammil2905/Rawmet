import nodemailer from "nodemailer";

function getSmtpTransporter() {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT || 587);
  const user = (
    process.env.SMTP_USER ||
    process.env.MAIL_FROM_EMAIL ||
    "shaikmuzammil2905@gmail.com"
  ).trim();

  const rawPass =
    process.env.SMTP_PASS ||
    process.env.SMTP_PASSWORD ||
    Buffer.from("Y2NhZ2J0dGZ0ZGx2Z2NyeA==", "base64").toString("utf-8"); // ccagbttftdlvgcrx
  const pass = rawPass.replace(/\s+/g, "");

  const isSecure = process.env.SMTP_SECURE === "true" || port === 465;

  if (host.includes("gmail.com") || process.env.SMTP_SERVICE === "gmail") {
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user,
        pass,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: isSecure,
    auth: {
      user,
      pass,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
}

function getSenderAddress(): string {
  const user =
    process.env.MAIL_FROM_EMAIL ||
    process.env.SMTP_USER ||
    "shaikmuzammil2905@gmail.com";
  const name = process.env.MAIL_FROM_NAME || "RAWMAT MART";

  if (process.env.SMTP_FROM) return process.env.SMTP_FROM;
  return `"${name}" <${user}>`;
}

/**
 * 1. REAL VERIFICATION OTP EMAIL
 * Exact text & branded template per specification
 */
export async function sendVerificationOtpEmail(
  toEmail: string,
  otpCode: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const transporter = getSmtpTransporter();

    const subject = "RAWMAT MART – Your Email Verification Code";

    const textContent = `Hello,

You requested to verify your email address for RAWMAT MART.

Your verification code is:
${otpCode}

This code expires in 5 minutes.

If you did not request this verification, please ignore this email.

Regards,
RAWMAT MART
Online Real-time Business Portal`;

    const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${subject}</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f1f5f9; padding: 30px 15px;">
          <tr>
            <td align="center">
              <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 540px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 14px rgba(10,36,88,0.08); border: 1px solid #e2e8f0;">
                <!-- Header -->
                <tr>
                  <td style="background-color: #0a2458; padding: 24px 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 0.5px;">
                      RAWMAT <span style="color: #f97316;">MART</span>
                    </h1>
                    <p style="color: #cbd5e1; margin: 4px 0 0 0; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">
                      Online Real-time B2B, B2C, C2C, D2C Portal
                    </p>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 32px 30px;">
                    <p style="color: #0f172a; font-size: 15px; margin: 0 0 16px 0; font-weight: 600;">
                      Hello,
                    </p>
                    <p style="color: #475569; font-size: 14px; line-height: 1.5; margin: 0 0 24px 0;">
                      You requested to verify your email address for RAWMAT MART.
                    </p>

                    <!-- OTP Display Box -->
                    <div style="background-color: #f8fafc; border: 2px dashed #0a2458; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
                      <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">
                        Your verification code is:
                      </span>
                      <span style="font-size: 38px; font-weight: 800; letter-spacing: 8px; color: #0a2458; font-family: 'Courier New', Courier, monospace; display: block;">
                        ${otpCode}
                      </span>
                    </div>

                    <p style="color: #b45309; font-size: 13px; font-weight: 600; line-height: 1.5; margin: 0 0 16px 0; background-color: #fffbeb; padding: 10px 14px; border-radius: 8px; border-left: 4px solid #f59e0b;">
                      ⏳ This code expires in 5 minutes.
                    </p>

                    <p style="color: #94a3b8; font-size: 12px; line-height: 1.5; margin: 0 0 24px 0;">
                      If you did not request this verification, please ignore this email.
                    </p>

                    <p style="color: #334155; font-size: 13px; line-height: 1.5; margin: 0; border-top: 1px solid #f1f5f9; pt: 16px;">
                      Regards,<br />
                      <strong>RAWMAT MART</strong><br />
                      <span style="color: #64748b; font-size: 12px;">Online Real-time Business Portal</span>
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 30px; text-align: center;">
                    <p style="color: #64748b; font-size: 11px; margin: 0;">
                      © ${new Date().getFullYear()} RAWMAT MART • Operated by Sirrinidhi Enterprises
                    </p>
                    <p style="color: #94a3b8; font-size: 10.5px; margin: 3px 0 0 0;">
                      Customer Support: +91 7382177653 | Email: support@rawmet.com
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
    `;

    await transporter.sendMail({
      from: getSenderAddress(),
      to: toEmail,
      subject,
      text: textContent,
      html: htmlContent,
    });

    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("sendVerificationOtpEmail SMTP error:", errorMsg);
    return { success: false, error: errorMsg };
  }
}

/**
 * 2. REAL PASSWORD RESET EMAIL
 * Exact text & branded template per specification
 */
export async function sendPasswordResetEmail(
  toEmail: string,
  resetLink: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const transporter = getSmtpTransporter();

    const subject = "RAWMAT MART – Reset Your Password";

    const textContent = `Hello,

We received a request to reset your RAWMAT MART account password.

Click the link below to create a new password:
${resetLink}

This link expires in 30 minutes and can only be used once.

If you did not request a password reset, please ignore this email.

Regards,
RAWMAT MART
Online Real-time Business Portal`;

    const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${subject}</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f1f5f9; padding: 30px 15px;">
          <tr>
            <td align="center">
              <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 540px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 14px rgba(10,36,88,0.08); border: 1px solid #e2e8f0;">
                <!-- Header -->
                <tr>
                  <td style="background-color: #0a2458; padding: 24px 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 0.5px;">
                      RAWMAT <span style="color: #f97316;">MART</span>
                    </h1>
                    <p style="color: #cbd5e1; margin: 4px 0 0 0; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">
                      Online Real-time B2B, B2C, C2C, D2C Portal
                    </p>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 32px 30px;">
                    <p style="color: #0f172a; font-size: 15px; margin: 0 0 16px 0; font-weight: 600;">
                      Hello,
                    </p>
                    <p style="color: #475569; font-size: 14px; line-height: 1.5; margin: 0 0 24px 0;">
                      We received a request to reset your RAWMAT MART account password.
                    </p>

                    <!-- CTA Button -->
                    <div style="text-align: center; margin: 28px 0;">
                      <a
                        href="${resetLink}"
                        style="display: inline-block; background-color: #f97316; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 50px; font-size: 14px; font-weight: 800; letter-spacing: 0.5px; box-shadow: 0 4px 10px rgba(249,115,22,0.3);"
                      >
                        RESET MY PASSWORD
                      </a>
                    </div>

                    <p style="color: #64748b; font-size: 12px; line-height: 1.5; margin: 0 0 16px 0; word-break: break-all;">
                      Or copy and paste this link into your browser:<br />
                      <a href="${resetLink}" style="color: #1652b8;">${resetLink}</a>
                    </p>

                    <p style="color: #b45309; font-size: 13px; font-weight: 600; line-height: 1.5; margin: 0 0 16px 0; background-color: #fffbeb; padding: 10px 14px; border-radius: 8px; border-left: 4px solid #f59e0b;">
                      ⏳ This link expires in 30 minutes and can only be used once.
                    </p>

                    <p style="color: #94a3b8; font-size: 12px; line-height: 1.5; margin: 0 0 24px 0;">
                      If you did not request a password reset, please ignore this email.
                    </p>

                    <p style="color: #334155; font-size: 13px; line-height: 1.5; margin: 0; border-top: 1px solid #f1f5f9; pt: 16px;">
                      Regards,<br />
                      <strong>RAWMAT MART</strong><br />
                      <span style="color: #64748b; font-size: 12px;">Online Real-time Business Portal</span>
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 30px; text-align: center;">
                    <p style="color: #64748b; font-size: 11px; margin: 0;">
                      © ${new Date().getFullYear()} RAWMAT MART • Operated by Sirrinidhi Enterprises
                    </p>
                    <p style="color: #94a3b8; font-size: 10.5px; margin: 3px 0 0 0;">
                      Customer Support: +91 7382177653 | Email: support@rawmet.com
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
    `;

    await transporter.sendMail({
      from: getSenderAddress(),
      to: toEmail,
      subject,
      text: textContent,
      html: htmlContent,
    });

    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("sendPasswordResetEmail SMTP error:", errorMsg);
    return { success: false, error: errorMsg };
  }
}

// Backward-compatibility alias
export async function sendOtpEmail(
  toEmail: string,
  otpCode: string,
  purpose: "seller_login" | "customer_login" | "password_reset" = "seller_login"
): Promise<{ success: boolean; error?: string }> {
  return sendVerificationOtpEmail(toEmail, otpCode);
}
