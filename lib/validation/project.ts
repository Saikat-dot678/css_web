import { z } from "zod";
import { baseEntitySchema, optionalUrlSchema } from "./common";

export const projectSchema = baseEntitySchema.extend({
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().trim().min(2).max(180),
  description: z.string().trim().min(8).max(4000),
  status: z.enum(["planning", "active", "completed", "archived"]),
  technologies: z.array(z.string().trim().min(1)),
  contributors: z.array(z.string().trim().min(1)),
  githubUrl: optionalUrlSchema,
  externalUrl: optionalUrlSchema,
  image: optionalUrlSchema,
  acceptingContributors: z.boolean(),
  owner: z.string().trim().min(2),
  academicYear: z.string().trim().regex(/^\d{4}-\d{2}$/),
});

export const projectInputSchema = projectSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
