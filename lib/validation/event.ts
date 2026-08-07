import { z } from "zod";
import { baseEntitySchema, isoDateSchema, optionalUrlSchema, urlSchema } from "./common";

export const eventStatusSchema = z.enum([
  "draft",
  "upcoming",
  "registration_open",
  "save_the_date",
  "ongoing",
  "closed",
  "past",
  "archived",
]);

const speakerSchema = z.object({
  name: z.string().trim().min(1),
  position: z.string().trim().optional(),
  organisation: z.string().trim().optional(),
  linkedin: optionalUrlSchema,
  photo: optionalUrlSchema,
});

const scheduleSchema = z.object({
  time: z.string().trim().min(1),
  title: z.string().trim().min(1),
  description: z.string().trim().optional(),
});

export const eventSchema = baseEntitySchema.extend({
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().trim().min(2).max(160),
  poster: urlSchema,
  category: z.string().trim().min(2).max(80),
  status: eventStatusSchema,
  date: isoDateSchema,
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.union([z.string().regex(/^\d{2}:\d{2}$/), z.literal("")]).optional(),
  venue: z.string().trim().min(2).max(180),
  shortDescription: z.string().trim().min(5).max(280),
  fullDescription: z.string().trim().min(10).max(8000),
  registrationOpen: z.boolean(),
  registrationDeadline: z.string().trim().optional(),
  eligibility: z.string().trim().optional(),
  entryFee: z.string().trim().optional(),
  featured: z.boolean(),
  speakers: z.array(speakerSchema),
  schedule: z.array(scheduleSchema),
  registrationFormId: z.string().trim().optional(),
  recap: z.string().trim().optional(),
  attendance: z.string().trim().optional(),
  gallery: z.array(urlSchema),
  resources: z.array(z.object({ label: z.string().min(1), url: urlSchema })),
  results: z.array(
    z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      linkedMemberId: z.string().optional(),
    }),
  ),
});

export const eventInputSchema = eventSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
