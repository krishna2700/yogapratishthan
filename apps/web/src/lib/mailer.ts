import "server-only";
import nodemailer from "nodemailer";

/** Hardcoded, not user-suppliable — this is the whole point of the reset
 *  flow's security model: only whoever controls this inbox can ever
 *  complete a password change, no matter what a request payload contains. */
export const ADMIN_NOTIFICATION_EMAIL = "krisnaruparelia0207@gmail.com";

function getTransport() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) {
    throw new Error("GMAIL_USER / GMAIL_APP_PASSWORD are not configured");
  }
  return nodemailer.createTransport({ service: "gmail", auth: { user, pass } });
}

export async function sendPasswordResetEmail(resetUrl: string) {
  const transport = getTransport();
  await transport.sendMail({
    from: process.env.GMAIL_USER,
    to: ADMIN_NOTIFICATION_EMAIL,
    subject: "Yogapratishthan — reset your admin password",
    text: `Someone requested a password change for the Yogapratishthan admin login.\n\nSet a new password here (expires in 30 minutes):\n${resetUrl}\n\nIf you didn't request this, you can ignore this email — your password won't change.`,
    html: `
      <p>Someone requested a password change for the Yogapratishthan admin login.</p>
      <p><a href="${resetUrl}">Set a new password</a> (link expires in 30 minutes).</p>
      <p style="color:#666;font-size:13px">If you didn't request this, you can ignore this email — your password won't change.</p>
    `,
  });
}
