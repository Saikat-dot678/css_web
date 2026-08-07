import "server-only";

import { z } from "zod";
import { getDatabase } from "@/lib/db";
import type { Announcement, SiteContent } from "@/types/content";
import { createEntity, updateEntity, type EntityInput } from "./base";

const announcementInputSchema = z.object({
  title: z.string().trim().min(1).max(180),
  content: z.string().trim().min(1).max(1000),
  pinned: z.boolean(),
  published: z.boolean(),
});
const siteContentSchema = z.object({
  heroHeadline: z.string().trim().min(5).max(240),
  heroDescription: z.string().trim().min(5).max(1000),
  recruitmentText: z.string().trim().min(5).max(1000),
  recruitmentOpen: z.boolean(),
  currentAcademicYear: z.string().regex(/^\d{4}-\d{2}$/),
});

export const getAnnouncements = async (publishedOnly = false) => {
  const items = await getDatabase().list<Announcement>("announcements");
  return items
    .filter((item) => !publishedOnly || item.published)
    .sort((a, b) => Number(b.pinned) - Number(a.pinned));
};
export const getAnnouncementById = (id: string) =>
  getDatabase().findById<Announcement>("announcements", id);
export async function createAnnouncement(input: EntityInput<Announcement>) {
  return createEntity<Announcement>(
    "announcements",
    "announcement",
    announcementInputSchema.parse(input),
  );
}
export async function updateAnnouncement(id: string, patch: Partial<EntityInput<Announcement>>) {
  const current = await getAnnouncementById(id);
  if (!current) throw new Error("Announcement not found.");
  return updateEntity<Announcement>(
    "announcements",
    id,
    announcementInputSchema.parse({ ...current, ...patch }),
  );
}
export const deleteAnnouncement = (id: string) => getDatabase().remove("announcements", id);

export const getSiteContent = () => getDatabase().getSiteContent();
export const updateSiteContent = (content: SiteContent) =>
  getDatabase().updateSiteContent(siteContentSchema.parse(content));
