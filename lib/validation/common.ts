import { z } from "zod";

export const idSchema = z.string().trim().min(1).max(120);

const httpUrlSchema = z
  .string()
  .trim()
  .url({ message: "Use an http or https URL." })
  .refine((value) => {
    try {
      const protocol = new URL(value).protocol;
      return protocol === "http:" || protocol === "https:";
    } catch {
      return false;
    }
  }, "Use an http or https URL.");

const rootRelativeUrlSchema = z
  .string()
  .trim()
  .regex(/^\/(?!\/)[^\s\\\u0000-\u001f\u007f]*$/, "Use a root-relative path beginning with a single slash.");

/** Normalizes admin-entered links before URL schema validation. */
export function normalizeUrlInput(raw: string): string {
  const value = raw.trim();
  if (!value || value === "#") return "#";
  if (value.startsWith("//")) return value;
  if (value.startsWith("/")) return value;
  if (/^[a-z][a-z0-9+.-]*:/i.test(value)) return value;
  return `https://${value}`;
}

export const urlSchema = z.preprocess(
  (value) => (typeof value === "string" ? normalizeUrlInput(value) : value),
  z.union([httpUrlSchema, rootRelativeUrlSchema, z.literal("#")]),
);
export const optionalUrlSchema = z.preprocess(
  (value) => value === null || (typeof value === "string" && !value.trim()) ? undefined : value,
  urlSchema.optional(),
);

export const optionalStringSchema = z
  .union([z.string(), z.null()])
  .optional()
  .transform((v) => (v != null ? v : undefined));
export const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const timestampSchema = z.string().datetime({ offset: true });
export const academicYearSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}$/, "Use the academic-year format YYYY-YY, for example 2026-27.")
  .refine((value) => {
    const [start, end] = value.split("-").map(Number);
    return Number.isFinite(start) && Number.isFinite(end) && (start + 1) % 100 === end;
  }, "The second year must immediately follow the first, for example 2026-27.");
export const baseEntitySchema = z.object({
  id: idSchema,
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export const csvList = (value: FormDataEntryValue | null) =>
  String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

export const lines = (value: FormDataEntryValue | null) =>
  String(value ?? "")
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
