/**
 * Email delivery service — EngineerPrep India
 *
 * Uses Nodemailer with SMTP. In development without SMTP config, emails
 * are logged to the console (Ethereal.email preview mode).
 *
 * IMPORTANT: Never log password reset tokens or verification tokens.
 */

import * as nodemailer from "nodemailer";
import type { Transporter, SendMailOptions } from "nodemailer";

let _transport: Transporter | null = null;
let _devAccount: { user: string; pass: string } | null = null;

async function getTransport(): Promise<Transporter> {
  if (_transport) return _transport;

  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPassword = process.env.SMTP_PASSWORD;

  if (smtpHost && smtpUser && smtpPassword) {
    // Production / configured SMTP
    _transport = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(process.env.SMTP_PORT ?? "587", 10),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: smtpUser,
        pass: smtpPassword,
      },
    });
    console.info("[email] SMTP transport initialized:", smtpHost);
  } else {
    // Development: use Ethereal.email test account
    if (!_devAccount) {
      try {
        _devAccount = await nodemailer.createTestAccount();
        console.info(
          "[email] Development mode — using Ethereal.email test account:",
          _devAccount.user,
        );
      } catch {
        // If Ethereal fails (no network), log to console
        console.warn(
          "[email] No SMTP configured and Ethereal.email unavailable. Emails will be logged only.",
        );
        // Return a mock transport that just logs
        _transport = {
          sendMail: async (options: { to: unknown; subject: unknown }) => {
            console.log("[email] Mock delivery (configure SMTP to send real emails):");
            console.log("  To:", options.to);
            console.log("  Subject:", options.subject);
            return { messageId: `mock-${Date.now()}` };
          },
        } as unknown as Transporter;
        return _transport;
      }
    }
    _transport = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: { user: _devAccount.user, pass: _devAccount.pass },
    });
  }

  return _transport;
}

const FROM_ADDRESS =
  process.env.EMAIL_FROM ?? "EngineerPrep India <noreply@engineerprep.in>";
const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:3000";

function htmlWrapper(title: string, content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background: #f8f9fa; }
    .container { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #FF5A00, #FF8A00); padding: 32px 40px; }
    .header h1 { margin: 0; color: #fff; font-size: 24px; font-weight: 700; }
    .header p { margin: 4px 0 0; color: rgba(255,255,255,0.85); font-size: 14px; }
    .body { padding: 40px; }
    .body p { color: #374151; line-height: 1.6; margin: 0 0 16px; }
    .button { display: inline-block; padding: 14px 28px; background: #FF5A00; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 8px 0 24px; }
    .footer { padding: 24px 40px; background: #f8f9fa; border-top: 1px solid #e5e7eb; }
    .footer p { margin: 0; color: #9ca3af; font-size: 12px; line-height: 1.6; }
    .divider { height: 1px; background: #e5e7eb; margin: 24px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>EngineerPrep India</h1>
      <p>Engineering Careers Made Simple</p>
    </div>
    <div class="body">
      ${content}
    </div>
    <div class="footer">
      <p>This email was sent by EngineerPrep India. If you didn't request this, you can safely ignore it.</p>
      <p>&copy; ${new Date().getFullYear()} EngineerPrep India. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
}

async function send(options: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<{ messageId: string; previewUrl?: string }> {
  const transport = await getTransport();
  const result = await transport.sendMail({
    from: FROM_ADDRESS,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
  });

  const previewUrl = nodemailer.getTestMessageUrl(result) || undefined;
  if (previewUrl) {
    console.info("[email] Preview URL:", previewUrl);
  }

  return { messageId: result.messageId as string, previewUrl };
}

/* ========================= Email Templates ========================= */

export async function sendVerificationEmail(
  to: string,
  name: string,
  token: string,
): Promise<void> {
  const verifyUrl = `${FRONTEND_URL}/verify-email?token=${token}`;

  await send({
    to,
    subject: "Verify your email — EngineerPrep India",
    html: htmlWrapper(
      "Verify your email",
      `<p>Hi ${name},</p>
       <p>Welcome to EngineerPrep India! Please verify your email address to get started.</p>
       <a href="${verifyUrl}" class="button">Verify Email Address</a>
       <p>This link expires in 24 hours.</p>
       <div class="divider"></div>
       <p>If the button doesn't work, copy and paste this link:</p>
       <p style="word-break:break-all;color:#6b7280;font-size:13px;">${verifyUrl}</p>`,
    ),
    text: `Hi ${name},\n\nVerify your email: ${verifyUrl}\n\nThis link expires in 24 hours.`,
  });
}

export async function sendPasswordResetEmail(
  to: string,
  name: string,
  token: string,
): Promise<void> {
  const resetUrl = `${FRONTEND_URL}/reset-password?token=${token}`;

  await send({
    to,
    subject: "Reset your password — EngineerPrep India",
    html: htmlWrapper(
      "Reset your password",
      `<p>Hi ${name},</p>
       <p>We received a request to reset your password. Click the button below to choose a new password.</p>
       <a href="${resetUrl}" class="button">Reset Password</a>
       <p>This link expires in <strong>1 hour</strong>. If you didn't request this, you can safely ignore this email.</p>
       <div class="divider"></div>
       <p>If the button doesn't work, copy and paste this link:</p>
       <p style="word-break:break-all;color:#6b7280;font-size:13px;">${resetUrl}</p>`,
    ),
    text: `Hi ${name},\n\nReset your password: ${resetUrl}\n\nThis link expires in 1 hour. If you didn't request this, ignore this email.`,
  });
}

export async function sendJobAlertEmail(
  to: string,
  name: string,
  job: { title: string; company: string; location: string; deadline?: Date },
): Promise<void> {
  const jobUrl = `${FRONTEND_URL}/jobs`;
  const deadlineStr = job.deadline
    ? `Deadline: ${job.deadline.toLocaleDateString("en-IN")}`
    : "";

  await send({
    to,
    subject: `New job opportunity: ${job.title} at ${job.company}`,
    html: htmlWrapper(
      "New Job Opportunity",
      `<p>Hi ${name},</p>
       <p>A new job matching your profile has been posted:</p>
       <p><strong>${job.title}</strong> at <strong>${job.company}</strong><br>
       📍 ${job.location}${deadlineStr ? `<br>⏰ ${deadlineStr}` : ""}</p>
       <a href="${jobUrl}" class="button">View Opportunity</a>`,
    ),
    text: `Hi ${name},\n\nNew job: ${job.title} at ${job.company} (${job.location})\n${deadlineStr}\n\nView: ${jobUrl}`,
  });
}

export async function sendWeeklySummaryEmail(
  to: string,
  name: string,
  stats: {
    dsaSolved: number;
    roadmapProgress: number;
    testsTaken: number;
    streak: number;
  },
): Promise<void> {
  await send({
    to,
    subject: "Your weekly learning summary — EngineerPrep India",
    html: htmlWrapper(
      "Weekly Summary",
      `<p>Hi ${name},</p>
       <p>Here's your learning summary for this week:</p>
       <ul>
         <li>🧮 DSA problems solved: <strong>${stats.dsaSolved}</strong></li>
         <li>🗺️ Roadmap topics completed: <strong>${stats.roadmapProgress}</strong></li>
         <li>📝 Mock tests taken: <strong>${stats.testsTaken}</strong></li>
         <li>🔥 Current streak: <strong>${stats.streak} days</strong></li>
       </ul>
       <a href="${FRONTEND_URL}/dashboard" class="button">View Dashboard</a>`,
    ),
    text: `Hi ${name},\n\nWeekly summary:\n- DSA solved: ${stats.dsaSolved}\n- Roadmap: ${stats.roadmapProgress}\n- Tests: ${stats.testsTaken}\n- Streak: ${stats.streak} days`,
  });
}
