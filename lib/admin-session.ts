import { createHmac, scryptSync, timingSafeEqual } from "node:crypto";

let cachedKey: { password: string; secret: string; key: Buffer } | undefined;
function signingKey() {
  const password = process.env.ADMIN_PASSWORD || "css-local-demo-session";
  const secret = process.env.ADMIN_SESSION_SECRET || "";
  if (!cachedKey || cachedKey.password !== password || cachedKey.secret !== secret) {
    cachedKey = { password, secret, key: scryptSync(`${secret}:${password}`, "css-admin-session-v2", 32) };
  }
  return cachedKey.key;
}

export const configuredAdminEmail = () => process.env.ADMIN_EMAIL?.trim().toLowerCase() || "";
const sign = (payload: string) => createHmac("sha256", signingKey()).update(payload).digest("hex");

export function encodeAdminSession(email: string, expiresAt: number) {
  const payload = Buffer.from(JSON.stringify({ email: email.trim().toLowerCase(), expiresAt })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function validAdminSession(value: string, now = Date.now()) {
  if (value.length > 2048) return false;
  const [payload, signature, extra] = value.split(".");
  if (!payload || !signature || extra || !/^[a-f0-9]{64}$/.test(signature)) return false;
  if (!timingSafeEqual(Buffer.from(sign(payload), "hex"), Buffer.from(signature, "hex"))) return false;
  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return session.email === configuredAdminEmail() && Number.isFinite(session.expiresAt) && session.expiresAt > now && session.expiresAt <= now + 8 * 60 * 60 * 1000;
  } catch { return false; }
}
