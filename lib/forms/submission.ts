import type { FormAnswerValue, FormDefinition, FormField } from "@/types/forms";
import type { FileStorage } from "@/lib/storage/types";

export class FormSubmissionError extends Error {
  constructor(message: string, readonly status = 422) {
    super(message);
  }
}

const displayOnlyTypes = new Set<FormField["type"]>(["sectionHeading", "information", "divider"]);
const textTypes = new Set<FormField["type"]>(["shortText", "longText", "email", "phone", "url"]);

const isValidDate = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
};

const isValidTime = (value: string) => /^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(value);

export function assertFormAvailable(
  form: FormDefinition,
  options: { responseCount: number; eventAcceptsRegistrations?: boolean; now?: Date } = { responseCount: 0 },
) {
  const now = options.now ?? new Date();
  if (form.status === "draft") throw new FormSubmissionError("This form is still a draft.", 409);
  if (form.status === "closed") throw new FormSubmissionError("This form is closed.", 409);
  if (form.opensAt && new Date(form.opensAt).getTime() > now.getTime()) throw new FormSubmissionError("This form is not open yet.", 409);
  if (form.closesAt && new Date(form.closesAt).getTime() < now.getTime()) throw new FormSubmissionError("This form is closed.", 409);
  if (form.responseLimit !== undefined && options.responseCount >= form.responseLimit) throw new FormSubmissionError("This form has reached its response limit.", 409);
  if (form.kind === "event" && options.eventAcceptsRegistrations === false) throw new FormSubmissionError("Registration is not open for this event.", 409);
}

export async function parseFormSubmission(
  form: FormDefinition,
  data: FormData,
  storage: FileStorage,
  allowedMetadataKeys: string[] = [],
): Promise<Record<string, FormAnswerValue>> {
  const fields = form.fields.toSorted((a, b) => a.order - b.order);
  const fieldMap = new Map(fields.filter((field) => !displayOnlyTypes.has(field.type)).map((field) => [field.id, field]));
  const metadataKeys = new Set(allowedMetadataKeys);
  for (const key of data.keys()) {
    if (!fieldMap.has(key) && !metadataKeys.has(key)) throw new FormSubmissionError(`Unknown form field “${key}”.`);
  }

  const answers: Record<string, FormAnswerValue> = {};
  for (const field of fields) {
    if (displayOnlyTypes.has(field.type)) continue;
    const rawValues = data.getAll(field.id);

    if (field.type === "file") {
      const files = rawValues.filter((value): value is File => value instanceof File && value.size > 0);
      const unexpectedText = rawValues.some((value) => typeof value === "string" && value.trim().length > 0);
      if (unexpectedText) throw new FormSubmissionError(`${field.label} contains an invalid file value.`);
      if (field.required && files.length === 0) throw new FormSubmissionError(`${field.label} is required.`);
      if (files.length === 0) continue;
      if (!field.allowMultipleFiles && files.length > 1) throw new FormSubmissionError(`${field.label} accepts one file only.`);
      const stored: string[] = [];
      for (const file of files) {
        const result = await storage.saveFormFile(file, {
          formId: form.id,
          fieldId: field.id,
          allowedTypes: field.allowedFileTypes?.length
            ? field.allowedFileTypes
            : ["application/pdf", "image/jpeg", "image/png", "image/webp"],
          maxBytes: Math.round((field.maxFileSizeMb ?? 5) * 1024 * 1024),
        });
        stored.push(result.url);
      }
      answers[field.id] = field.allowMultipleFiles ? stored : stored[0];
      continue;
    }

    if (rawValues.some((value) => value instanceof File && value.size > 0)) {
      throw new FormSubmissionError(`${field.label} contains an invalid value.`);
    }
    const values = rawValues
      .filter((value): value is string => typeof value === "string")
      .map((value) => value.trim())
      .filter(Boolean);
    if (field.required && values.length === 0) throw new FormSubmissionError(`${field.label} is required.`);
    if (values.length === 0) continue;
    if (field.type !== "checkbox" && values.length > 1) throw new FormSubmissionError(`${field.label} accepts one value only.`);
    validateTextValues(field, values);
    answers[field.id] = field.type === "checkbox" ? values : values[0];
  }
  return answers;
}

export function validateTextValues(field: FormField, values: string[]) {
  if (!values.length) return;
  const first = values[0];
  if (textTypes.has(field.type)) {
    if (field.minLength !== undefined && first.length < field.minLength) throw new FormSubmissionError(`${field.label} must contain at least ${field.minLength} characters.`);
    if (field.maxLength !== undefined && first.length > field.maxLength) throw new FormSubmissionError(`${field.label} must contain no more than ${field.maxLength} characters.`);
  }
  if (field.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(first)) throw new FormSubmissionError(`${field.label} must be a valid email.`);
  if (field.type === "url") {
    try {
      const parsed = new URL(first);
      if (!["http:", "https:"].includes(parsed.protocol)) throw new Error("protocol");
    } catch {
      throw new FormSubmissionError(`${field.label} must be a valid http(s) URL.`);
    }
  }
  if (field.type === "number") {
    const numeric = Number(first);
    if (!Number.isFinite(numeric)) throw new FormSubmissionError(`${field.label} must be a number.`);
    if (field.min !== undefined && numeric < field.min) throw new FormSubmissionError(`${field.label} must be at least ${field.min}.`);
    if (field.max !== undefined && numeric > field.max) throw new FormSubmissionError(`${field.label} must be at most ${field.max}.`);
    if (field.step !== undefined) {
      const base = field.min ?? 0;
      const units = (numeric - base) / field.step;
      if (Math.abs(units - Math.round(units)) > 1e-8) throw new FormSubmissionError(`${field.label} must use increments of ${field.step}.`);
    }
  }
  if (["dropdown", "multipleChoice", "checkbox"].includes(field.type) && field.options && values.some((value) => !field.options?.includes(value))) {
    throw new FormSubmissionError(`${field.label} contains an invalid choice.`);
  }
  if (field.type === "date" && !isValidDate(first)) throw new FormSubmissionError(`${field.label} must be a valid date.`);
  if (field.type === "time" && !isValidTime(first)) throw new FormSubmissionError(`${field.label} must be a valid time.`);
  if (field.type === "dateTime") {
    const match = /^(\d{4}-\d{2}-\d{2})T((?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?)$/.exec(first);
    if (!match || !isValidDate(match[1]) || !isValidTime(match[2])) throw new FormSubmissionError(`${field.label} must be a valid date and time.`);
  }
}

export function getFormAvailability(
  form: FormDefinition,
  options: { responseCount: number; eventAcceptsRegistrations?: boolean; now?: Date } = { responseCount: 0 },
) {
  try {
    assertFormAvailable(form, options);
    return { available: true as const, message: "Open" };
  } catch (error) {
    if (error instanceof FormSubmissionError) return { available: false as const, message: error.message, status: error.status };
    throw error;
  }
}
