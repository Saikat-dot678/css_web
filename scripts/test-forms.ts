import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import path from "node:path";
import { JsonDatabase } from "../lib/db/json-db";
import { createResponsesCsv } from "../lib/forms/csv";
import { FormService } from "../lib/forms/service";
import { assertFormAvailable, FormSubmissionError, parseFormSubmission } from "../lib/forms/submission";
import type { FileStorage } from "../lib/storage/types";
import type { DatabaseShape } from "../types/database";
import type { FormDefinition, FormField } from "../types/forms";

const sourcePath = path.join(process.cwd(), "data", "db.json");
const testPath = path.join(process.cwd(), "data", ".forms-test.json");
const fakeStorage: FileStorage = { saveFormFile: async () => ({ url: "/uploads/test.pdf", mimeType: "application/pdf", size: 1 }) };
const field = (id: string, type: FormField["type"], label: string, order: number, required = false, patch: Partial<FormField> = {}): FormField => ({ id, type, label, order, required, ...patch });

async function expectSubmissionError(run: () => Promise<unknown>, contains: string) {
  await assert.rejects(run, (error: unknown) => error instanceof FormSubmissionError && error.message.includes(contains));
}

async function main() {
  await fs.copyFile(sourcePath, testPath);
  const database = new JsonDatabase(testPath);
  const service = new FormService(database);
  const source = JSON.parse(await fs.readFile(sourcePath, "utf8")) as DatabaseShape;
  const event = source.events[0];
  assert.ok(event, "seed database needs at least one event");

  // Existing event-only documents must normalize without a destructive migration.
  const normalizedLegacy = await service.listForms();
  assert.ok(normalizedLegacy.every((form) => Boolean(form.slug) && Boolean(form.status) && Boolean(form.submitLabel)));

  const auditionFields = [
    field("name", "shortText", "Name", 0, true, { minLength: 2, maxLength: 120 }),
    field("email", "email", "Email", 1, true),
    field("roll", "shortText", "Roll number", 2, true),
    field("domain", "dropdown", "Domain", 3, false, { options: ["Web development", "App development", "Graphic designing"] }),
    field("why", "longText", "Why CSS?", 4),
    field("portfolio", "url", "Portfolio URL", 5),
    field("available", "date", "Available date", 6),
    field("resume", "file", "Resume", 7, false, { allowedFileTypes: ["application/pdf"], maxFileSizeMb: 5 }),
    field("consent", "consent", "Consent", 8, true),
  ];
  const standalone = await service.createForm({
    slug: "css-second-year-audition-2026-test",
    title: "CSS Second-Year Audition 2026",
    description: "Test fixture",
    kind: "standalone",
    eventOwned: false,
    status: "published",
    submitLabel: "Apply",
    successTitle: "Application received.",
    successMessage: "Thanks.",
    fields: auditionFields,
  });
  assert.equal(standalone.kind, "standalone");

  const eventForm = await service.createForm({
    slug: `test-${event.slug}-registration`,
    title: `${event.title} test registration`,
    kind: "event",
    eventId: event.id,
    eventOwned: false,
    status: "published",
    submitLabel: "Register",
    fields: [field("attendee", "shortText", "Attendee", 0, true), field("mail", "email", "Email", 1, true)],
  });
  assert.equal(eventForm.eventId, event.id);

  // Update and reorder fields.
  const updated = await service.updateForm(standalone.id, { fields: [...auditionFields].reverse().map((item, order) => ({ ...item, order })) });
  assert.equal(updated.fields[0].id, "consent");
  const restored = await service.updateForm(standalone.id, { fields: auditionFields });

  const valid = new FormData();
  valid.set("name", "Student Name"); valid.set("email", "student@nitdgp.ac.in"); valid.set("roll", "24CS0001");
  valid.set("domain", "Web development"); valid.set("why", "I want to build useful systems."); valid.set("portfolio", "https://example.com");
  valid.set("available", "2026-09-01"); valid.set("consent", "Yes");

  const missing = new FormData();
  await expectSubmissionError(() => parseFormSubmission(restored, missing, fakeStorage), "Name");

  const cloneData = (source: FormData) => { const copy = new FormData(); source.forEach((value, key) => copy.append(key, value)); return copy; };
  const badEmail = cloneData(valid); badEmail.set("email", "not-an-email");
  await expectSubmissionError(() => parseFormSubmission(restored, badEmail, fakeStorage), "valid email");

  const badChoice = cloneData(valid); badChoice.set("domain", "Secret option");
  await expectSubmissionError(() => parseFormSubmission(restored, badChoice, fakeStorage), "invalid choice");

  const numericForm = await service.createForm({
    slug: "number-validation-test", title: "Number validation", kind: "standalone", status: "published", eventOwned: false, submitLabel: "Send",
    fields: [field("score", "number", "Score", 0, true, { min: 1, max: 5, step: 1 })],
  });
  const badNumber = new FormData(); badNumber.set("score", "6");
  await expectSubmissionError(() => parseFormSubmission(numericForm, badNumber, fakeStorage), "at most 5");

  await assert.rejects(() => service.createForm({
    slug: standalone.slug, title: "Duplicate published slug", kind: "standalone", eventOwned: false, status: "published", submitLabel: "Send", fields: [],
  }), /published form already uses/i);

  assert.throws(() => assertFormAvailable({ ...restored, status: "draft" }, { responseCount: 0 }), /draft/);
  assert.throws(() => assertFormAvailable({ ...restored, status: "closed" }, { responseCount: 0 }), /closed/);
  assert.throws(() => assertFormAvailable({ ...restored, responseLimit: 1 }, { responseCount: 1 }), /response limit/);
  assert.throws(() => assertFormAvailable(eventForm, { responseCount: 0, eventAcceptsRegistrations: false }), /Registration is not open/);

  assertFormAvailable(restored, { responseCount: 0 });
  const answers = await parseFormSubmission(restored, valid, fakeStorage);
  const standaloneResponse = await service.createResponse({ formId: restored.id, formSlug: restored.slug, answers, submittedAt: new Date().toISOString() });
  assert.equal(standaloneResponse.answers.email, "student@nitdgp.ac.in");

  const eventData = new FormData(); eventData.set("attendee", "Event Student"); eventData.set("mail", "event@nitdgp.ac.in");
  assertFormAvailable(eventForm, { responseCount: 0, eventAcceptsRegistrations: true });
  const eventAnswers = await parseFormSubmission(eventForm, eventData, fakeStorage);
  const eventResponse = await service.createResponse({ formId: eventForm.id, formSlug: eventForm.slug, eventId: event.id, eventSlug: event.slug, answers: eventAnswers, submittedAt: new Date().toISOString() });
  assert.equal(eventResponse.eventId, event.id);

  const csv = createResponsesCsv(await service.listForms(), [standaloneResponse], source.events, restored.id);
  assert.match(csv, /"Name"/); assert.match(csv, /"Email"/); assert.ok(!csv.split("\r\n")[0].includes('"name"'));

  await assert.rejects(() => service.deleteForm(restored.id), /responses first/i);
  assert.equal(await service.deleteResponse(standaloneResponse.id), true);
  assert.equal(await service.getResponseById(standaloneResponse.id), null);

  const restarted = new FormService(new JsonDatabase(testPath));
  assert.equal((await restarted.getFormById(restored.id))?.title, "CSS Second-Year Audition 2026");
  assert.equal((await restarted.getResponseById(eventResponse.id))?.formId, eventForm.id);

  console.info("Generic form CRUD, legacy normalization, field validation, availability, standalone/event responses, delete safety, CSV labels, and JSON persistence passed.");
}

main().finally(() => fs.rm(testPath, { force: true })).catch((error) => { console.error(error); process.exitCode = 1; });
