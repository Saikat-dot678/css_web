import { z } from "zod";
import { baseEntitySchema } from "./common";

export const formFieldTypeSchema = z.enum([
  "shortText", "longText", "email", "phone", "number", "dropdown", "multipleChoice", "checkbox",
  "date", "time", "dateTime", "url", "file", "consent", "sectionHeading", "information", "divider",
]);

const optionalNonNegativeInt = z.number().int().nonnegative().optional();
const optionalFiniteNumber = z.number().finite().optional();

export const formFieldSchema = z.object({
  id: z.string().trim().min(1).max(120),
  type: formFieldTypeSchema,
  label: z.string().trim().min(1).max(240),
  placeholder: z.string().trim().max(240).optional(),
  helperText: z.string().trim().max(1200).optional(),
  required: z.boolean(),
  options: z.array(z.string().trim().min(1).max(240)).optional(),
  order: z.number().int().nonnegative(),
  minLength: optionalNonNegativeInt,
  maxLength: optionalNonNegativeInt,
  min: optionalFiniteNumber,
  max: optionalFiniteNumber,
  step: z.number().finite().positive().optional(),
  allowedFileTypes: z.array(z.string().trim().min(1).max(120)).max(20).optional(),
  maxFileSizeMb: z.number().finite().positive().max(20).optional(),
  allowMultipleFiles: z.boolean().optional(),
}).superRefine((field, context) => {
  if (["dropdown", "multipleChoice", "checkbox"].includes(field.type) && (!field.options || field.options.length < 1)) {
    context.addIssue({ code: "custom", message: "This field type requires at least one option.", path: ["options"] });
  }
  if (field.minLength !== undefined && field.maxLength !== undefined && field.minLength > field.maxLength) {
    context.addIssue({ code: "custom", message: "Minimum length cannot exceed maximum length.", path: ["minLength"] });
  }
  if (field.min !== undefined && field.max !== undefined && field.min > field.max) {
    context.addIssue({ code: "custom", message: "Minimum cannot exceed maximum.", path: ["min"] });
  }
  if (["sectionHeading", "information", "divider"].includes(field.type) && field.required) {
    context.addIssue({ code: "custom", message: "Display-only fields cannot be required.", path: ["required"] });
  }
});

const optionalDateTime = z.string().datetime({ offset: true }).optional();

export const formDefinitionSchema = baseEntitySchema.extend({
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens only."),
  title: z.string().trim().min(2).max(180),
  description: z.string().trim().max(3000).optional(),
  kind: z.enum(["standalone", "event"]),
  eventId: z.string().trim().min(1).optional(),
  eventOwned: z.boolean().optional(),
  status: z.enum(["draft", "published", "closed"]),
  submitLabel: z.string().trim().min(1).max(80),
  successTitle: z.string().trim().max(160).optional(),
  successMessage: z.string().trim().max(1200).optional(),
  opensAt: optionalDateTime,
  closesAt: optionalDateTime,
  responseLimit: z.number().int().positive().optional(),
  fields: z.array(formFieldSchema).max(100),
}).superRefine((form, context) => {
  if (form.kind === "event" && !form.eventId) context.addIssue({ code: "custom", message: "Event-linked forms require an event.", path: ["eventId"] });
  if (form.kind === "standalone" && form.eventId) context.addIssue({ code: "custom", message: "Standalone forms cannot have an event.", path: ["eventId"] });
  if (form.opensAt && form.closesAt && new Date(form.opensAt) >= new Date(form.closesAt)) {
    context.addIssue({ code: "custom", message: "Close time must be after open time.", path: ["closesAt"] });
  }
  const fieldIds = new Set<string>();
  for (const field of form.fields) {
    if (fieldIds.has(field.id)) context.addIssue({ code: "custom", message: "Field IDs must be unique.", path: ["fields"] });
    fieldIds.add(field.id);
  }
});

const answerValueSchema = z.union([z.string(), z.array(z.string())]);

export const formResponseSchema = baseEntitySchema.extend({
  formId: z.string().trim().min(1),
  formSlug: z.string().trim().min(1),
  eventId: z.string().trim().min(1).optional(),
  eventSlug: z.string().trim().min(1).optional(),
  answers: z.record(z.string(), answerValueSchema),
  submittedAt: z.string().datetime({ offset: true }),
  name: z.string().optional(),
  email: z.string().optional(),
});

export const registrationFormSchema = formDefinitionSchema;
export const registrationSchema = formResponseSchema;

export const formUpdateSchema = z.object({
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  title: z.string().trim().min(2).max(180).optional(),
  description: z.string().trim().max(3000).nullable().optional(),
  kind: z.enum(["standalone", "event"]).optional(),
  eventId: z.string().trim().min(1).nullable().optional(),
  eventOwned: z.boolean().optional(),
  status: z.enum(["draft", "published", "closed"]).optional(),
  submitLabel: z.string().trim().min(1).max(80).optional(),
  successTitle: z.string().trim().max(160).nullable().optional(),
  successMessage: z.string().trim().max(1200).nullable().optional(),
  opensAt: z.string().datetime({ offset: true }).nullable().optional(),
  closesAt: z.string().datetime({ offset: true }).nullable().optional(),
  responseLimit: z.number().int().positive().nullable().optional(),
  fields: z.array(formFieldSchema).max(100).optional(),
}).strict();
