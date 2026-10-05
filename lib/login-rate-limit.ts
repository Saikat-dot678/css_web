import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { getDatabase } from "@/lib/db";
import { MongoDatabase } from "@/lib/db/mongodb";

const localAttempts = new Map<string, number>();
export async function loginAttemptAllowed() {
  const requestHeaders = await headers();
  const ip = process.env.VERCEL === "1"
    ? requestHeaders.get("x-vercel-forwarded-for") || requestHeaders.get("x-forwarded-for") || "unknown"
    : "local";
  const bucket = Math.floor(Date.now() / (10 * 60 * 1000));
  const key = createHash("sha256").update(`${bucket}:${ip.split(",")[0].trim()}`).digest("hex");
  const db = getDatabase();
  if (db instanceof MongoDatabase) return db.consumeLoginAttempt(key);
  // Local development only; production Vercel uses the shared Mongo counter.
  for (const oldKey of localAttempts.keys()) if (!oldKey.startsWith(`${bucket}:`)) localAttempts.delete(oldKey);
  const localKey = `${bucket}:${key}`;
  const count = (localAttempts.get(localKey) || 0) + 1;
  localAttempts.set(localKey, count);
  return count <= 10;
}
