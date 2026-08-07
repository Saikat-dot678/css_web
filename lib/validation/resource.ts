import { z } from "zod";
import { baseEntitySchema, urlSchema } from "./common";

export const resourceSchema = baseEntitySchema.extend({
  title: z.string().trim().min(2).max(180),
  description: z.string().trim().min(5).max(4000),
  category: z.enum([
    "internships",
    "hackathons",
    "research",
    "placements",
    "higher_studies",
    "competitive_programming",
    "technical_resources",
    "department",
  ]),
  url: urlSchema,
  deadline: z.string().trim().optional(),
  eligibility: z.string().trim().optional(),
  featured: z.boolean(),
  expiryDate: z.string().trim().optional(),
  meta: z.string().trim().optional(),
});

export const resourceInputSchema = resourceSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
