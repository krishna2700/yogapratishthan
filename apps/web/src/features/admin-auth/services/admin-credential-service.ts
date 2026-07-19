import "server-only";
import { randomUUID } from "node:crypto";
import { prisma } from "@yogapratishthan/db";
import { hashPassword, verifyPassword } from "@/lib/password-hash";
import { sendPasswordResetEmail } from "@/lib/mailer";

const SINGLETON_ID = "singleton";
const RESET_TOKEN_TTL_MS = 30 * 60 * 1000;
const RESET_REQUEST_COOLDOWN_MS = 60 * 1000;

export class InvalidResetTokenError extends Error {}

/** DB-backed password wins once it exists; ADMIN_PASSWORD is only a
 *  bootstrap fallback for a brand-new deployment that's never had its
 *  password changed yet. */
export async function isValidAdminPassword(password: string): Promise<boolean> {
  const credential = await prisma.adminCredential.findUnique({ where: { id: SINGLETON_ID } });
  if (credential?.passwordHash) {
    return verifyPassword(password, credential.passwordHash);
  }
  return Boolean(process.env.ADMIN_PASSWORD) && password === process.env.ADMIN_PASSWORD;
}

/** Always emails the hardcoded admin address (see mailer.ts) — never a
 *  caller-supplied one — regardless of who calls this or from where. */
export async function requestPasswordReset(origin: string) {
  const existing = await prisma.adminCredential.findUnique({ where: { id: SINGLETON_ID } });
  if (existing?.resetTokenExpires) {
    const requestedAt = existing.resetTokenExpires.getTime() - RESET_TOKEN_TTL_MS;
    if (Date.now() - requestedAt < RESET_REQUEST_COOLDOWN_MS) return;
  }

  const token = randomUUID();
  const resetTokenExpires = new Date(Date.now() + RESET_TOKEN_TTL_MS);

  await prisma.adminCredential.upsert({
    where: { id: SINGLETON_ID },
    create: { id: SINGLETON_ID, resetToken: token, resetTokenExpires },
    update: { resetToken: token, resetTokenExpires },
  });

  await sendPasswordResetEmail(`${origin}/reset-password?token=${token}`);
}

export async function confirmPasswordReset(token: string, newPassword: string) {
  const credential = await prisma.adminCredential.findUnique({ where: { resetToken: token } });
  if (!credential || !credential.resetTokenExpires || credential.resetTokenExpires < new Date()) {
    throw new InvalidResetTokenError("This reset link is invalid or has expired");
  }

  await prisma.adminCredential.update({
    where: { id: SINGLETON_ID },
    data: { passwordHash: hashPassword(newPassword), resetToken: null, resetTokenExpires: null },
  });
}
