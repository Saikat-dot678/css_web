import { z } from "zod";
import { baseEntitySchema, optionalUrlSchema } from "./common";

export const achievementSchema = baseEntitySchema.extend({
  year: z.string().trim().regex(/^\d{4}$/),
  title: z.string().trim().min(2).max(220),
  description: z.string().trim().min(5).max(4000),
  category: z.string().trim().min(2).max(120),
  linkedMemberId: z.string().trim().optional(),
  linkedProjectId: z.string().trim().optional(),
  linkedEventId: z.string().trim().optional(),
  image: optionalUrlSchema,
  externalUrl: optionalUrlSchema,
});

export const achievementInputSchema = achievementSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
