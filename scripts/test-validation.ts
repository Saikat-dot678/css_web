import assert from "node:assert/strict";
import { createResponsesCsv } from "../lib/forms/csv";
import { FormSubmissionError, parseFormSubmission } from "../lib/forms/submission";
import type { FileStorage } from "../lib/storage/types";
import { academicYearSchema, urlSchema } from "../lib/validation/common";
import { announcementInputSchema, siteContentSchema } from "../lib/validation/content";
import { resourceInputSchema } from "../lib/validation/resource";
import type { FormDefinition, FormResponse } from "../types/forms";

async function main() {
  const siteContent = {
    heroHeadline: "A valid homepage headline",
    heroDescription: "A valid homepage description.",
    recruitmentText: "A valid recruitment message.",
    recruitmentOpen: true,
    currentAcademicYear: "2026-27",
  };
  assert.equal(siteContentSchema.safeParse(siteContent).success, true);
  assert.equal(siteContentSchema.safeParse({ ...siteContent, heroHeadline: "   " }).success, false);
  assert.equal(siteContentSchema.safeParse({ ...siteContent, heroDescription: "x".repeat(1001) }).success, false);
  assert.equal(siteContentSchema.safeParse({ ...siteContent, currentAcademicYear: "2026-99" }).success, false);
  assert.equal(academicYearSchema.safeParse("2027-28").success, true);
  assert.equal(academicYearSchema.safeParse("2027/28").success, false);
  assert.equal(announcementInputSchema.safeParse({ title: "Notice", content: "Published content", pinned: false, published: true }).success, true);
  assert.equal(announcementInputSchema.safeParse({ title: "   ", content: "Published content", pinned: false, published: true }).success, false);
  assert.equal(announcementInputSchema.safeParse({ title: "Notice", content: "x".repeat(1001), pinned: false, published: true }).success, false);

  for (const value of ["https://example.com/path?q=1", "http://localhost:3000/test", "/uploads/image.png", "/api/posters/demo", "#", " /safe-looking "]) {
    assert.equal(urlSchema.safeParse(value).success, true, `expected safe URL: ${value}`);
  }

  for (const value of ["javascript:alert(1)", "data:text/html,test", "file:///etc/passwd", "ftp://example.com/file", "//evil.example/path", "/path with space"]) {
    assert.equal(urlSchema.safeParse(value).success, false, `expected unsafe URL rejection: ${value}`);
  }

  const baseResource = {
    title: "Safe resource",
    description: "A resource used to exercise backend URL validation.",
    category: "technical_resources" as const,
    featured: false,
  };
  assert.equal(resourceInputSchema.safeParse({ ...baseResource, url: "https://example.com" }).success, true);
  assert.equal(resourceInputSchema.safeParse({ ...baseResource, url: "javascript:alert(document.domain)" }).success, false);

  const timestamp = "2026-09-05T00:00:00.000Z";
  const uploadForm: FormDefinition = {
    id: "upload-status-test",
    slug: "upload-status-test",
    title: "Upload status test",
    kind: "standalone",
    eventOwned: false,
    status: "published",
    submitLabel: "Submit",
    fields: [{ id: "document", type: "file", label: "Document", required: true, order: 0, allowedFileTypes: ["application/pdf"], maxFileSizeMb: 1 }],
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  const uploadData = new FormData();
  uploadData.set("document", new File(["test"], "test.pdf", { type: "application/pdf" }));

  for (const status of [413, 415]) {
    const storage: FileStorage = {
      saveFormFile: async () => { throw Object.assign(new Error(status === 413 ? "File is too large." : "File type is not allowed."), { status }); },
    };
    await assert.rejects(
      () => parseFormSubmission(uploadForm, uploadData, storage),
      (error: unknown) => error instanceof FormSubmissionError && error.status === status,
      `expected upload storage status ${status} to reach the submission boundary`,
    );
  }

  const csvForm: FormDefinition = {
    ...uploadForm,
    id: "csv-form",
    slug: "csv-form",
    title: "CSV form",
    fields: [{ id: "answer", type: "shortText", label: "Answer", required: false, order: 0 }],
  };
  const csvResponse: FormResponse = {
    id: "csv-response",
    formId: csvForm.id,
    formSlug: csvForm.slug,
    answers: { answer: "=1+1" },
    submittedAt: timestamp,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  const csv = createResponsesCsv([csvForm], [csvResponse], [], csvForm.id);
  assert.ok(csv.includes("\"'=1+1\""), "formula-leading CSV values must be neutralized");
  assert.ok(!csv.includes("\"=1+1\""), "raw spreadsheet formulas must not be emitted");

  console.info("Content, academic-year, announcement, URL, upload-status, and CSV validation passed.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
