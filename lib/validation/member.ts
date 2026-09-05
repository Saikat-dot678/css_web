import { z } from "zod";
import { baseEntitySchema, optionalUrlSchema, urlSchema } from "./common";

export const academicGroupSchema = z.enum([
  "office_bearer",
  "third_year",
  "second_year",
  "mtech",
  "phd",
]);

export const memberSchema = baseEntitySchema.extend({
  name: z.string().trim().min(2).max(120),
  photo: urlSchema,
  role: z.string().trim().min(2).max(120),
  programme: z.string().trim().min(2).max(120),
  academicGroup: academicGroupSchema,
  workingGroup: z.string().trim().min(2).max(120),
  academicYear: z.string().trim().regex(/^\d{4}-\d{2}$/),
  linkedin: optionalUrlSchema,
  instagram: optionalUrlSchema,
  facebook: optionalUrlSchema,
  github: optionalUrlSchema,
  email: z.union([z.string().email(), z.literal("")]).optional(),
  researchArea: z.string().trim().optional(),
  bio: z.string().trim().max(2000).optional(),
});

export const memberInputSchema = memberSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const facultySchema = baseEntitySchema.extend({
  name: z.string().trim().min(2).max(120),
  photo: urlSchema,
  role: z.string().trim().min(2).max(120),
  department: z.string().trim().min(2).max(160),
  email: z.union([z.string().email(), z.literal("")]).optional(),
  profileUrl: optionalUrlSchema,
  bio: z.string().trim().max(2000).optional(),
});

export const facultyInputSchema = facultySchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
