import "server-only";

import { timingSafeEqual } from "node:crypto";
import { configuredAdminEmail, encodeAdminSession, validAdminSession } from "./admin-session";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE_NAME = "css_admin_session";

const configured = () => Boolean(process.env.ADMIN_EMAIL?.trim() && process.env.ADMIN_PASSWORD?.trim());
const production = () => process.env.NODE_ENV === "production";

export const adminAuthConfigured = configured;
export const adminDemoModeEnabled = () => !configured() && !production();

export async function isAdminAuthenticated() {
  if (!configured()) return !production();
  const value = (await cookies()).get(COOKIE_NAME)?.value;
  if (!value) return false;
  return validAdminSession(value);
}

export async function requireAdmin() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");
}

export async function verifyAdminCredentials(email: string, password: string) {
  if (!configured()) return !production();
  const actualEmail = Buffer.from(email.trim().toLowerCase());
  const expectedEmail = Buffer.from(configuredAdminEmail());
  const actualPassword = Buffer.from(password);
  const expectedPassword = Buffer.from(process.env.ADMIN_PASSWORD || "");
  return actualEmail.length === expectedEmail.length && actualPassword.length === expectedPassword.length && timingSafeEqual(actualEmail, expectedEmail) && timingSafeEqual(actualPassword, expectedPassword);
}

export async function createAdminSession(email: string) {
  if (!configured() && production()) throw new Error("Admin authentication is not configured for production.");
  const maxAge = 60 * 60 * 8;
  (await cookies()).set(COOKIE_NAME, encodeAdminSession(email, Date.now() + maxAge * 1000), {
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
