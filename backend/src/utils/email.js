const nodemailer = require('nodemailer');

/**
 * Create reusable transporter — configured via env vars
 */
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT, 10) || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Send a styled OTP verification email
 * @param {string} to - recipient email
 * @param {string} otp - 6-digit OTP code
 * @param {string} name - user's name for personalisation
 */
async function sendOtpEmail(to, otp, name) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0;padding:0;background:#0f0f23;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f23;padding:40px 20px;">
        <tr>
          <td align="center">
            <table width="480" cellpadding="0" cellspacing="0" style="background:linear-gradient(145deg,#1a1a3e,#16162e);border-radius:16px;border:1px solid rgba(91,110,245,0.2);overflow:hidden;">
              <!-- Header -->
              <tr>
                <td style="padding:32px 32px 0;text-align:center;">
                  <div style="display:inline-block;background:linear-gradient(135deg,#5b6ef5,#8b5cf6);border-radius:12px;padding:10px;margin-bottom:16px;">
                    <span style="font-size:24px;">🧠</span>
                  </div>
                  <h1 style="color:#ffffff;font-size:22px;margin:0 0 4px;">Quiz<span style="color:#7b95fa;">Pro</span></h1>
                  <p style="color:#94a3b8;font-size:13px;margin:0;">Verify your email address</p>
                </td>
              </tr>
              <!-- Body -->
              <tr>
                <td style="padding:28px 32px;">
                  <p style="color:#e2e8f0;font-size:15px;margin:0 0 20px;">
                    Hi <strong>${name}</strong>,
                  </p>
                  <p style="color:#94a3b8;font-size:14px;line-height:1.6;margin:0 0 24px;">
                    Use the verification code below to complete your registration. This code expires in <strong style="color:#e2e8f0;">10 minutes</strong>.
                  </p>
                  <!-- OTP Box -->
                  <div style="text-align:center;margin:0 0 24px;">
                    <div style="display:inline-block;background:rgba(91,110,245,0.1);border:2px dashed rgba(91,110,245,0.4);border-radius:12px;padding:16px 40px;">
                      <span style="font-size:36px;font-weight:700;letter-spacing:12px;color:#7b95fa;font-family:'Courier New',monospace;">
                        ${otp}
                      </span>
                    </div>
                  </div>
                  <p style="color:#64748b;font-size:13px;line-height:1.6;margin:0;">
                    If you didn't request this code, you can safely ignore this email. Someone may have typed your email by mistake.
                  </p>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="padding:20px 32px;border-top:1px solid rgba(255,255,255,0.05);text-align:center;">
                  <p style="color:#475569;font-size:12px;margin:0;">
                    © ${new Date().getFullYear()} QuizPro — Secure & Scalable Quiz Platform
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
    from: process.env.SMTP_FROM || `"QuizPro" <${process.env.SMTP_USER}>`,
    to,
    subject: `${otp} — Your QuizPro Verification Code`,
    html,
  });
}

module.exports = { sendOtpEmail };
