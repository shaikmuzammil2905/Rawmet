import nodemailer from "nodemailer";

const VERIFIED_SMTP_USER = "madurfoods@gmail.com";
const VERIFIED_SMTP_PASS = "ardxrdyikzjopsod";

function getSmtpTransporter(useFallback = false) {
  if (useFallback) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: VERIFIED_SMTP_USER,
        pass: VERIFIED_SMTP_PASS,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });
  }

  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT || 587);
  const user = (
    process.env.SMTP_USER ||
    process.env.MAIL_FROM_EMAIL ||
    VERIFIED_SMTP_USER
  ).trim();

  const rawPass =
    process.env.SMTP_PASS ||
    process.env.SMTP_PASSWORD ||
    VERIFIED_SMTP_PASS;
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

function getSenderAddress(useFallback = false): string {
  const name = process.env.MAIL_FROM_NAME || "RAWMAT MART";
  if (useFallback) {
    return `"${name}" <${VERIFIED_SMTP_USER}>`;
  }
  const user =
    process.env.MAIL_FROM_EMAIL ||
    process.env.SMTP_USER ||
    VERIFIED_SMTP_USER;

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

    try {
      await transporter.sendMail({
        from: getSenderAddress(false),
        to: toEmail,
        subject,
        text: textContent,
        html: htmlContent,
      });
      return { success: true };
    } catch (primaryErr) {
      console.warn("Primary SMTP delivery failed, attempting verified fallback:", primaryErr);
      const fallbackTransporter = getSmtpTransporter(true);
      await fallbackTransporter.sendMail({
        from: getSenderAddress(true),
        to: toEmail,
        subject,
        text: textContent,
        html: htmlContent,
      });
      return { success: true };
    }
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

    const subject = "RAWMAT MART – Password Reset Request";

    const textContent = `Hello,

We received a request to reset your RAWMAT MART account password.

Click the link below to create a new password:
${resetLink}

This link is valid for 30 minutes and can only be used once.

If you did not request this change, please ignore this email.

Regards,
RAWMAT MART Team.`;

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
                      We received a request to reset your RAWMAT MART account password.<br /><br />
                      Click the button below to create a new password.
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
                      ⏳ This link is valid for 30 minutes and can only be used once.
                    </p>

                    <p style="color: #94a3b8; font-size: 12px; line-height: 1.5; margin: 0 0 24px 0;">
                      If you did not request this change, please ignore this email.
                    </p>

                    <p style="color: #334155; font-size: 13px; line-height: 1.5; margin: 0; border-top: 1px solid #f1f5f9; padding-top: 16px;">
                      Regards,<br />
                      <strong>RAWMAT MART Team.</strong>
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

    try {
      await transporter.sendMail({
        from: getSenderAddress(false),
        to: toEmail,
        subject,
        text: textContent,
        html: htmlContent,
      });
      return { success: true };
    } catch (primaryErr) {
      console.warn("Primary SMTP delivery failed for password reset, attempting verified fallback:", primaryErr);
      const fallbackTransporter = getSmtpTransporter(true);
      await fallbackTransporter.sendMail({
        from: getSenderAddress(true),
        to: toEmail,
        subject,
        text: textContent,
        html: htmlContent,
      });
      return { success: true };
    }
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

/**
 * 3. REAL WELCOME & REGISTRATION CONFIRMATION EMAIL
 */
export async function sendWelcomeRegistrationEmail(
  toEmail: string,
  userName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const transporter = getSmtpTransporter();
    const subject = "Welcome to RAWMAT MART – Account Registration Successful";

    const textContent = `Hello ${userName},

Thank you for registering on RAWMAT MART — Online Real-time Business Portal.

Your account has been created successfully. You can now:
• Access your Buyer & Seller Dashboard
• Browse verified industrial products, machineries, and turnkey plants
• Submit seller applications for verified GST listings
• Request quotations and post real-time requirements

Login URL: https://rawmet-pme3.vercel.app/login

Customer Support: +91 7382177653 | Email: support@rawmet.com

Regards,
RAWMAT MART
Sirrinidhi Enterprises`;

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
                    <p style="color: #0f172a; font-size: 16px; margin: 0 0 16px 0; font-weight: 700;">
                      Welcome, ${userName}! 👋
                    </p>
                    <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
                      Thank you for creating an account on <strong>RAWMAT MART</strong>. Your registration is confirmed and your account is active.
                    </p>

                    <div style="background-color: #f8fafc; border-radius: 12px; padding: 18px 20px; border: 1px solid #e2e8f0; margin-bottom: 24px;">
                      <p style="color: #0a2458; font-size: 13px; font-weight: 700; margin: 0 0 10px 0;">
                        What you can do with your account:
                      </p>
                      <ul style="color: #475569; font-size: 13px; line-height: 1.7; margin: 0; padding-left: 20px;">
                        <li>Browse verified raw materials, industry machinery, and turnkey plants</li>
                        <li>Submit real-time industrial requirements and receive supplier quotations</li>
                        <li>Apply to become a verified industrial seller / vendor</li>
                        <li>Track all your enquiries, orders, and listings from your unified dashboard</li>
                      </ul>
                    </div>

                    <!-- CTA Button -->
                    <div style="text-align: center; margin: 28px 0;">
                      <a
                        href="https://rawmet-pme3.vercel.app/login"
                        style="display: inline-block; background-color: #0a2458; color: #ffffff; text-decoration: none; padding: 14px 36px; border-radius: 50px; font-size: 14px; font-weight: 800; letter-spacing: 0.5px; box-shadow: 0 4px 12px rgba(10,36,88,0.25);"
                      >
                        SIGN IN TO YOUR ACCOUNT
                      </a>
                    </div>

                    <p style="color: #334155; font-size: 13px; line-height: 1.5; margin: 0; border-top: 1px solid #f1f5f9; padding-top: 16px;">
                      Regards,<br />
                      <strong>RAWMAT MART</strong><br />
                      <span style="color: #64748b; font-size: 12px;">Operated by Sirrinidhi Enterprises</span>
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

    try {
      await transporter.sendMail({
        from: getSenderAddress(false),
        to: toEmail,
        subject,
        text: textContent,
        html: htmlContent,
      });
      return { success: true };
    } catch (primaryErr) {
      console.warn("Primary SMTP failed for welcome email, attempting verified fallback:", primaryErr);
      const fallbackTransporter = getSmtpTransporter(true);
      await fallbackTransporter.sendMail({
        from: getSenderAddress(true),
        to: toEmail,
        subject,
        text: textContent,
        html: htmlContent,
      });
      return { success: true };
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("sendWelcomeRegistrationEmail error:", errorMsg);
    return { success: false, error: errorMsg };
  }
}

/**
 * 4. SELLER APPLICATION LIFECYCLE EMAILS (Received, Approved, Declined, Deactivated)
 */
export async function sendSellerApplicationEmail(
  toEmail: string,
  ownerName: string,
  businessName: string,
  status: "received" | "approved" | "rejected" | "suspended",
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!toEmail) return { success: false, error: "Recipient email missing." };
    const transporter = getSmtpTransporter();
    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://rawmet-pme3.vercel.app").replace(/\/$/, "");

    let subject = "";
    let headline = "";
    let messageBody = "";
    let badgeColor = "#0a2458";
    let ctaText = "Open Seller Page";
    let ctaLink = `${siteUrl}/seller`;

    if (status === "received") {
      subject = "RAWMAT MART – Seller Application Received";
      headline = "Seller Application Under Review";
      messageBody = `We have received your seller application for <strong>${businessName}</strong>. Your application is currently under admin verification. You will be notified once an administrator reviews your details.`;
      badgeColor = "#d97706";
    } else if (status === "approved") {
      subject = "RAWMAT MART – Your Seller Account Has Been Approved!";
      headline = "Seller Account Approved!";
      messageBody = `Congratulations! Your RAWMAT MART Vendor Account for <strong>${businessName}</strong> has been approved. Kindly start listing your products and services.`;
      badgeColor = "#059669";
      ctaText = "Start Listing Products";
    } else if (status === "rejected") {
      subject = "RAWMAT MART – Seller Application Status Update";
      headline = "Seller Application Declined";
      messageBody = `Your seller application for <strong>${businessName}</strong> has not been approved. Please contact RAWMAT MART support for further information.${reason ? `<br/><br/><strong>Remarks:</strong> ${reason}` : ""}`;
      badgeColor = "#dc2626";
      ctaText = "View Application Status";
    } else {
      subject = "RAWMAT MART – Seller Account Status Update";
      headline = "Seller Account Deactivated";
      messageBody = `Your RAWMAT MART seller account for <strong>${businessName}</strong> has been temporarily deactivated by the administrator.${reason ? `<br/><br/><strong>Remarks:</strong> ${reason}` : ""} Please contact RAWMAT MART support for assistance.`;
      badgeColor = "#475569";
    }

    const textContent = `Hello ${ownerName || "Seller"},

${messageBody.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()}

Visit: ${ctaLink}

Regards,
RAWMAT MART Team`;

    const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>${subject}</title></head>
      <body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:30px 15px;">
          <tr><td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;background-color:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
              <tr>
                <td style="background-color:#0a2458;padding:24px 30px;text-align:center;">
                  <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:800;">RAWMAT <span style="color:#f97316;">MART</span></h1>
                  <p style="color:#cbd5e1;margin:4px 0 0 0;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Seller Verification Portal</p>
                </td>
              </tr>
              <tr>
                <td style="padding:32px 30px;">
                  <div style="display:inline-block;background-color:${badgeColor};color:#ffffff;font-size:11px;font-weight:800;padding:4px 12px;border-radius:999px;text-transform:uppercase;margin-bottom:14px;">${headline}</div>
                  <p style="color:#0f172a;font-size:15px;margin:0 0 14px 0;font-weight:600;">Hello ${ownerName || "Partner"},</p>
                  <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 24px 0;">${messageBody}</p>
                  <div style="text-align:center;margin:24px 0;">
                    <a href="${ctaLink}" style="display:inline-block;background-color:#f97316;color:#ffffff;text-decoration:none;padding:13px 30px;border-radius:50px;font-size:13px;font-weight:800;">${ctaText}</a>
                  </div>
                  <p style="color:#334155;font-size:13px;line-height:1.5;margin:0;border-top:1px solid #f1f5f9;padding-top:16px;">
                    Regards,<br /><strong>RAWMAT MART Team</strong>
                  </p>
                </td>
              </tr>
            </table>
          </td></tr>
        </table>
      </body>
    </html>`;

    try {
      await transporter.sendMail({
        from: getSenderAddress(false),
        to: toEmail,
        subject,
        text: textContent,
        html: htmlContent,
      });
      return { success: true };
    } catch (primaryErr) {
      console.warn("Primary SMTP failed for seller status email, trying fallback:", primaryErr);
      const fallbackTransporter = getSmtpTransporter(true);
      await fallbackTransporter.sendMail({
        from: getSenderAddress(true),
        to: toEmail,
        subject,
        text: textContent,
        html: htmlContent,
      });
      return { success: true };
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("sendSellerApplicationEmail error:", errorMsg);
    return { success: false, error: errorMsg };
  }
}
