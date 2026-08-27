import type { FormDefinition, FormField, FormResponse } from "@/types/forms";

const safeSlug = (value: unknown, fallback: string) => {
  const slug = typeof value === "string" ? value.trim().toLowerCase() : "";
  return slug || fallback;
};

export function normalizeForm(raw: unknown): FormDefinition {
  const value = (raw ?? {}) as Partial<FormDefinition> & { eventId?: string };
  const id = String(value.id || "");
  const eventId = typeof value.eventId === "string" && value.eventId.trim() ? value.eventId.trim() : undefined;
  const kind = value.kind === "standalone" || value.kind === "event" ? value.kind : eventId ? "event" : "standalone";
  const fields = Array.isArray(value.fields)
    ? value.fields.map((field, index) => normalizeField(field, index)).sort((a, b) => a.order - b.order)
    : [];

  return {
    id,
    createdAt: String(value.createdAt || new Date(0).toISOString()),
    updatedAt: String(value.updatedAt || value.createdAt || new Date(0).toISOString()),
    slug: safeSlug(value.slug, eventId ? `event-form-${id}` : `form-${id}`),
    title: String(value.title || "Untitled form"),
    description: typeof value.description === "string" && value.description.trim() ? value.description : undefined,
    kind,
    eventId: kind === "event" ? eventId : undefined,
    eventOwned: kind === "event" ? (value.eventOwned ?? Boolean(eventId)) : false,
    status: value.status === "draft" || value.status === "published" || value.status === "closed"
      ? value.status
      : eventId
        ? "published"
        : "draft",
    submitLabel: String(value.submitLabel || (eventId ? "Submit registration" : "Submit")),
    successTitle: typeof value.successTitle === "string" && value.successTitle.trim() ? value.successTitle : undefined,
    successMessage: typeof value.successMessage === "string" && value.successMessage.trim() ? value.successMessage : undefined,
    opensAt: typeof value.opensAt === "string" && value.opensAt ? value.opensAt : undefined,
    closesAt: typeof value.closesAt === "string" && value.closesAt ? value.closesAt : undefined,
    responseLimit: typeof value.responseLimit === "number" && Number.isFinite(value.responseLimit) ? value.responseLimit : undefined,
    fields,
  };
}

function normalizeField(raw: unknown, fallbackOrder: number): FormField {
  const value = (raw ?? {}) as Partial<FormField>;
  return {
    id: String(value.id || `field-${fallbackOrder}`),
    type: value.type || "shortText",
    label: String(value.label || "Field"),
    placeholder: value.placeholder,
    helperText: value.helperText,
    required: Boolean(value.required),
    options: Array.isArray(value.options) ? value.options.map(String) : undefined,
    order: Number.isInteger(value.order) ? Number(value.order) : fallbackOrder,
    minLength: typeof value.minLength === "number" ? value.minLength : undefined,
    maxLength: typeof value.maxLength === "number" ? value.maxLength : undefined,
    min: typeof value.min === "number" ? value.min : undefined,
    max: typeof value.max === "number" ? value.max : undefined,
    step: typeof value.step === "number" ? value.step : undefined,
    allowedFileTypes: Array.isArray(value.allowedFileTypes) ? value.allowedFileTypes.map(String) : undefined,
    maxFileSizeMb: typeof value.maxFileSizeMb === "number" ? value.maxFileSizeMb : undefined,
    allowMultipleFiles: Boolean(value.allowMultipleFiles),
  };
}

export function normalizeResponse(raw: unknown, forms: FormDefinition[]): FormResponse {
  const value = (raw ?? {}) as Partial<FormResponse> & { eventId?: string; eventSlug?: string };
  const legacyForm = value.formId
    ? forms.find((form) => form.id === value.formId)
    : value.eventId
      ? forms.find((form) => form.eventId === value.eventId)
      : undefined;
  const formId = String(value.formId || legacyForm?.id || "");
  const formSlug = String(value.formSlug || legacyForm?.slug || (value.eventSlug ? `${value.eventSlug}-registration` : formId));
  return {
    id: String(value.id || ""),
    createdAt: String(value.createdAt || value.submittedAt || new Date(0).toISOString()),
    updatedAt: String(value.updatedAt || value.createdAt || value.submittedAt || new Date(0).toISOString()),
    formId,
    formSlug,
    eventId: value.eventId || legacyForm?.eventId,
    eventSlug: value.eventSlug,
    answers: (value.answers && typeof value.answers === "object" ? value.answers : {}) as FormResponse["answers"],
    submittedAt: String(value.submittedAt || value.createdAt || new Date(0).toISOString()),
    name: typeof value.name === "string" ? value.name : undefined,
    email: typeof value.email === "string" ? value.email : undefined,
  };
}
