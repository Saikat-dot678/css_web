import { z } from "zod";

export const idSchema = z.string().trim().min(1).max(120);

const httpUrlSchema = z.string().url().refine((value) => {
  try {
    const protocol = new URL(value).protocol;
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}, "Use an http or https URL.");

const rootRelativeUrlSchema = z.string().trim().regex(/^\/(?!\/)[^\s]*$/, "Use a root-relative path beginning with a single slash.");

export const urlSchema = z.union([
  httpUrlSchema,
  rootRelativeUrlSchema,
  z.literal("#"),
]);
export const optionalUrlSchema = z.union([urlSchema, z.literal("")]).optional();
export const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const timestampSchema = z.string().datetime({ offset: true });
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
