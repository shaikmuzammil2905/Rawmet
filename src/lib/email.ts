import nodemailer from "nodemailer";

function getSmtpTransporter() {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT || 587);
  const user = (process.env.SMTP_USER || "shaikmuzammil2905@gmail.com").trim();
  // Strip whitespace from password (Google App passwords are often copied with spaces like 'abcd efgh ijkl mnop')
  const rawPass =
    process.env.SMTP_PASSWORD ||
    Buffer.from("Y2NhZ2J0dGZ0ZGx2Z2NyeA==", "base64").toString("utf-8"); // ccagbttftdlvgcrx
  const pass = rawPass.replace(/\s+/g, "");

  // For Gmail, service: 'gmail' automatically uses optimal ports and SSL settings
  if (host.includes("gmail.com") || process.env.SMTP_SERVICE === "gmail") {
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user,
        pass,
      },
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 10000,
    });
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 10000,
  });
}

function getSenderAddress(): string {
  const user = process.env.SMTP_USER || "shaikmuzammil2905@gmail.com";
  return process.env.SMTP_FROM || `"RAWMAT MART" <${user}>`;
}

export async function sendOtpEmail(
  toEmail: string,
  otpCode: string,
  purpose: "seller_login" | "customer_login" | "password_reset" = "seller_login"
): Promise<{ success: boolean; error?: string }> {
  try {
    const transporter = getSmtpTransporter();

    const title =
      purpose === "password_reset"
        ? "Password Reset Verification Code"
        : purpose === "seller_login"
        ? "Seller Portal Login OTP"
        : "Login Verification OTP";

    const messageSubtitle =
      purpose === "password_reset"
        ? "Use the verification code below to securely reset your RAWMAT MART account password."
        : "Use the One-Time Password (OTP) below to sign in to your RAWMAT MART portal.";

    const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${title}</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f1f5f9; padding: 30px 15px;">
          <tr>
            <td align="center">
              <table width="100%" max-width="560" cellpadding="0" cellspacing="0" style="max-width: 560px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
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
                    <h2 style="color: #0f172a; margin: 0 0 12px 0; font-size: 19px; font-weight: 700;">
                      ${title}
                    </h2>
                    <p style="color: #475569; font-size: 14px; line-height: 1.5; margin: 0 0 24px 0;">
                      ${messageSubtitle}
                    </p>

                    <!-- OTP Box -->
                    <div style="background-color: #f8fafc; border: 2px dashed #0a2458; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
                      <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">
                        Your Verification OTP
                      </span>
                      <span style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #0a2458; font-family: monospace;">
                        ${otpCode}
                      </span>
                    </div>

                    <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin: 0 0 16px 0;">
                      ⏳ This OTP is valid for <strong>10 minutes</strong>. Do not share this code with anyone, including RAWMAT MART support representatives.
                    </p>
                    <p style="color: #94a3b8; font-size: 12px; line-height: 1.4; margin: 0;">
                      If you did not initiate this request, you can safely ignore this email.
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 18px 30px; text-align: center;">
                    <p style="color: #64748b; font-size: 12px; margin: 0;">
                      © ${new Date().getFullYear()} RAWMAT MART • Operated by Sirrinidhi Enterprises
                    </p>
                    <p style="color: #94a3b8; font-size: 11px; margin: 4px 0 0 0;">
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
      subject: `[RAWMAT MART] ${otpCode} is your ${title}`,
      text: `Your RAWMAT MART verification code is: ${otpCode}. Valid for 10 minutes.`,
      html: htmlContent,
    });

    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("sendOtpEmail error:", errorMsg);
    return { success: false, error: errorMsg };
  }
}
