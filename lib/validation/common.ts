import { z } from "zod";

export const idSchema = z.string().trim().min(1).max(120);
export const urlSchema = z.union([
  z.string().url(),
  z.string().startsWith("/"),
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
