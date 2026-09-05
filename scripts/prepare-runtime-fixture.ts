import path from "node:path";
import { JsonDatabase } from "../lib/db/json-db";
import { FormService } from "../lib/forms/service";
import type { FormField } from "../types/forms";

const filePath = path.join(process.cwd(), "data", "db.json");
const service = new FormService(new JsonDatabase(filePath));
const slug = "runtime-qa-form";

const existing = await service.getFormBySlug(slug);
if (existing) {
  for (const response of await service.listResponses({ formId: existing.id })) await service.deleteResponse(response.id);
  await service.deleteForm(existing.id);
}

const fields: FormField[] = [
  { id: "name", type: "shortText", label: "Name", required: true, order: 0, minLength: 2, maxLength: 80 },
  { id: "email", type: "email", label: "Email", required: true, order: 1 },
  { id: "score", type: "number", label: "Score", required: true, order: 2, min: 1, max: 5, step: 1 },
  { id: "track", type: "dropdown", label: "Track", required: true, order: 3, options: ["Web", "App"] },
  { id: "skills", type: "checkbox", label: "Skills", required: false, order: 4, options: ["React", "Next.js"] },
  { id: "date", type: "date", label: "Date", required: true, order: 5 },
  { id: "time", type: "time", label: "Time", required: true, order: 6 },
  { id: "datetime", type: "dateTime", label: "Date and time", required: true, order: 7 },
  { id: "portfolio", type: "url", label: "Portfolio", required: false, order: 8 },
  { id: "resume", type: "file", label: "Resume", required: false, order: 9, allowedFileTypes: ["application/pdf"], maxFileSizeMb: 1 },
  { id: "consent", type: "consent", label: "Consent", required: true, order: 10 },
  { id: "section", type: "sectionHeading", label: "Additional information", required: false, order: 11 },
  { id: "info", type: "information", label: "Information", helperText: "Runtime QA information block", required: false, order: 12 },
  { id: "divider", type: "divider", label: "Divider", required: false, order: 13 },
];

const form = await service.createForm({
  slug,
  title: "Runtime QA Form",
  description: "Temporary local runtime fixture used by automated QA.",
  kind: "standalone",
  eventOwned: false,
  status: "published",
  submitLabel: "Send QA response",
  successTitle: "QA response received",
  successMessage: "Temporary response saved.",
  responseLimit: 20,
  fields,
});

console.info(`Prepared runtime fixture ${form.id} at /forms/${form.slug}.`);
