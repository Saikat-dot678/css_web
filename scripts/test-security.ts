import assert from "node:assert/strict";
import { ZodError } from "zod";
import { adminErrorMessage } from "../lib/admin-errors";
import { encodeAdminSession, validAdminSession } from "../lib/admin-session";
import { eventAcceptsRegistrations, eventIsPublic } from "../lib/events";
import { normalizeProjectRecord } from "../lib/project-record";
import { isSameOriginMutation } from "../lib/request-security";
import { urlSchema } from "../lib/validation/common";
import { projectInputSchema } from "../lib/validation/project";
import { MongoDatabase } from "../lib/db/mongodb";
import { getDatabase } from "../lib/db";
import type { Event } from "../types/event";
import type { Project } from "../types/project";

async function main() {
  process.env.ADMIN_EMAIL = " admin@example.test ";
  process.env.ADMIN_PASSWORD = "test-only-password";
  process.env.ADMIN_SESSION_SECRET = "test-only-independent-signing-secret";
  const now = Date.now();
  const token = encodeAdminSession("ADMIN@example.test", now + 10000);
  assert.equal(validAdminSession(token, now), true);
  assert.equal(validAdminSession(token, now + 10001), false);
  assert.equal(validAdminSession(`${token}junk`, now), false);
  assert.equal(validAdminSession(encodeAdminSession("other@example.test", now + 10000), now), false);
  assert.equal(validAdminSession(encodeAdminSession("admin@example.test", now + 9 * 60 * 60 * 1000), now), false);
  process.env.ADMIN_PASSWORD = "changed-test-only-password";
  assert.equal(validAdminSession(token, now), false);
  process.env.ADMIN_PASSWORD = "test-only-password";
  process.env.ADMIN_SESSION_SECRET = "changed-test-only-secret";
  assert.equal(validAdminSession(token, now), false);

  for (const path of ["/\\evil.example/path", "/\u0000evil", "/\u001fevil", "//evil.example"]) assert.equal(urlSchema.safeParse(path).success, false);
  assert.equal(urlSchema.safeParse("/uploads/safe.png").success, true);
  const request = (origin: string) => new Request("https://example.test/api/admin/forms", { headers: { origin } });
  assert.equal(isSameOriginMutation(request("https://example.test")), true);
  assert.equal(isSameOriginMutation(request("https://evil.test")), false);
  assert.equal(isSameOriginMutation(new Request("https://example.test/api", { headers: { "sec-fetch-site": "cross-site" } })), false);

  const draft = { status: "draft", registrationOpen: true } as Event;
  assert.equal(eventIsPublic(draft), false);
  assert.equal(eventAcceptsRegistrations(draft), false);
  assert.equal(eventAcceptsRegistrations({ ...draft, status: "closed" }), false);
  assert.equal(eventAcceptsRegistrations({ ...draft, status: "upcoming" }), true);
  const legacy = normalizeProjectRecord({ technologies: "TS, React", contributors: undefined } as unknown as Project);
  assert.deepEqual(legacy.technologies, ["TS", "React"]);
  assert.deepEqual(legacy.contributors, []);
  assert.equal(projectInputSchema.safeParse({ title: "x" }).success, false);
  assert.equal(adminErrorMessage(new Error("mongodb://private-host/internal"), "Try again."), "Try again.");
  assert.match(adminErrorMessage(new ZodError([{ code: "custom", path: ["description"], message: "Use at least 8 characters." }]), "Try again."), /description/);

  // Simulate the driver's insertion mutation without an external database.
  const mongo = new MongoDatabase("mongodb://localhost:27017");
  let count = 0;
  let indexes = 0;
  const collection = {
    insertOne: async (entity: Record<string, unknown>) => { entity._id = { bson: true }; },
    createIndex: async () => { indexes++; return "expiresAt_1"; },
    findOneAndUpdate: async () => ({ count: ++count }),
  };
  Object.defineProperty(mongo, "client", { value: { connect: async () => undefined, db: () => ({ collection: () => collection }) } });
  const entity = { id: "test-project" } as Project;
  const inserted = await mongo.insert("projects", entity);
  assert.equal("_id" in inserted, false);
  assert.equal("_id" in entity, false);
  const allowed = await Promise.all(Array.from({ length: 11 }, () => mongo.consumeLoginAttempt("test")));
  assert.equal(allowed.filter(Boolean).length, 10);
  assert.equal(indexes, 1);

  delete process.env.MONGO_URL;
  process.env.VERCEL = "1";
  globalThis.cssDatabase = undefined;
  assert.throws(getDatabase, /MONGO_URL is required/);
  delete process.env.VERCEL;
  console.info("Session tampering/expiry/rotation, draft visibility, legacy projects, URL safety, origin checks, sanitized errors, Mongo insertion/rate limits, and Vercel persistence guard passed.");
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
