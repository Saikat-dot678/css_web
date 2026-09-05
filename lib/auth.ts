import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE_NAME = "css_admin_session";

const configured = () => Boolean(process.env.ADMIN_EMAIL?.trim() && process.env.ADMIN_PASSWORD?.trim());
const production = () => process.env.NODE_ENV === "production";
const secret = () => process.env.ADMIN_PASSWORD?.trim() || "css-local-demo-session";
const signatureFor = (payload: string) => createHmac("sha256", `${secret()}:css-admin-session-v1`).update(payload).digest("hex");

export const adminAuthConfigured = configured;
export const adminDemoModeEnabled = () => !configured() && !production();

export async function isAdminAuthenticated() {
  if (!configured()) return !production();
  const value = (await cookies()).get(COOKIE_NAME)?.value;
  if (!value) return false;
  const [payload, signature, extra] = value.split(".");
  if (!payload || !signature || extra) return false;
  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { email?: string; expiresAt?: number };
    if (session.email !== process.env.ADMIN_EMAIL || !session.expiresAt || session.expiresAt <= Date.now()) return false;
    const expected = Buffer.from(signatureFor(payload), "hex");
    const actual = Buffer.from(signature, "hex");
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

export async function requireAdmin() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");
}

export async function verifyAdminCredentials(email: string, password: string) {
  if (!configured()) return !production();
  const actualEmail = Buffer.from(email);
  const expectedEmail = Buffer.from(process.env.ADMIN_EMAIL || "");
  const actualPassword = Buffer.from(password);
  const expectedPassword = Buffer.from(process.env.ADMIN_PASSWORD || "");
  return actualEmail.length === expectedEmail.length && actualPassword.length === expectedPassword.length && timingSafeEqual(actualEmail, expectedEmail) && timingSafeEqual(actualPassword, expectedPassword);
}

export async function createAdminSession(email: string) {
  if (!configured() && production()) throw new Error("Admin authentication is not configured for production.");
  const maxAge = 60 * 60 * 8;
  const payload = Buffer.from(JSON.stringify({ email, expiresAt: Date.now() + maxAge * 1000 })).toString("base64url");
  (await cookies()).set(COOKIE_NAME, `${payload}.${signatureFor(payload)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: production(),
    path: "/",
    maxAge,
  });
}

export async function clearAdminSession() {
  (await cookies()).delete(COOKIE_NAME);
}
