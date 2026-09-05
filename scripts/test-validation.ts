import assert from "node:assert/strict";
import { FormSubmissionError, parseFormSubmission } from "../lib/forms/submission";
import type { FileStorage } from "../lib/storage/types";
import { urlSchema } from "../lib/validation/common";
import { resourceInputSchema } from "../lib/validation/resource";
import type { FormDefinition } from "../types/forms";

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

console.info("URL safety and upload validation status propagation passed.");
