import { z } from "zod";
import { baseEntitySchema } from "./common";

export const formFieldTypeSchema = z.enum([
  "shortText",
  "longText",
  "email",
  "phone",
  "number",
  "dropdown",
  "multipleChoice",
  "checkbox",
  "date",
  "file",
  "consent",
  "sectionHeading",
]);

export const formFieldSchema = z
  .object({
    id: z.string().trim().min(1),
    type: formFieldTypeSchema,
    label: z.string().trim().min(1).max(240),
    placeholder: z.string().trim().max(240).optional(),
    helperText: z.string().trim().max(500).optional(),
    required: z.boolean(),
    options: z.array(z.string().trim().min(1)).optional(),
    order: z.number().int().nonnegative(),
  })
  .superRefine((field, context) => {
    if (["dropdown", "multipleChoice", "checkbox"].includes(field.type)) {
      if (!field.options || field.options.length < 1) {
        context.addIssue({
          code: "custom",
          message: "This field type requires at least one option.",
          path: ["options"],
        });
      }
    }
  });

export const registrationFormSchema = baseEntitySchema.extend({
  eventId: z.string().trim().min(1),
  title: z.string().trim().min(2),
  fields: z.array(formFieldSchema),
});

const answerValueSchema = z.union([z.string(), z.array(z.string())]);

export const registrationSchema = baseEntitySchema.extend({
  eventId: z.string().trim().min(1),
  eventSlug: z.string().trim().min(1),
  name: z.string().trim().min(1),
  email: z.union([z.string().email(), z.literal("")]),
  answers: z.record(z.string(), answerValueSchema),
  submittedAt: z.string().datetime({ offset: true }),
});
