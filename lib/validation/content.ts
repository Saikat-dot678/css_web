import { z } from "zod";

import { academicYearSchema } from "./common";

export const announcementInputSchema = z.object({
  title: z.string().trim().min(1, "Enter an announcement title.").max(180, "Keep the title to 180 characters or fewer."),
  content: z.string().trim().min(1, "Enter announcement content.").max(1000, "Keep announcement content to 1000 characters or fewer."),
  pinned: z.boolean(),
  published: z.boolean(),
});

export const siteContentSchema = z.object({
  heroHeadline: z.string().trim().min(5, "Enter a homepage headline of at least 5 characters.").max(240, "Keep the homepage headline to 240 characters or fewer."),
  heroDescription: z.string().trim().min(5, "Enter a homepage description of at least 5 characters.").max(1000, "Keep the homepage description to 1000 characters or fewer."),
  recruitmentText: z.string().trim().min(5, "Enter recruitment copy of at least 5 characters.").max(1000, "Keep recruitment copy to 1000 characters or fewer."),
  recruitmentOpen: z.boolean(),
  currentAcademicYear: academicYearSchema,
});
