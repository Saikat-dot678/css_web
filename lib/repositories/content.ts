import "server-only";

import { getDatabase } from "@/lib/db";
import { announcementInputSchema, siteContentSchema } from "@/lib/validation/content";
import type { Announcement, SiteContent } from "@/types/content";
import { createEntity, updateEntity, type EntityInput } from "./base";

export const getAnnouncements = async (publishedOnly = false) => {
  const items = await getDatabase().list<Announcement>("announcements");
  return items
    .filter((item) => !publishedOnly || item.published)
    .sort((a, b) =>
      Number(b.pinned) - Number(a.pinned)
      || b.updatedAt.localeCompare(a.updatedAt)
      || b.createdAt.localeCompare(a.createdAt)
      || a.id.localeCompare(b.id),
    );
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

export const getSiteContent = async () => siteContentSchema.parse(await getDatabase().getSiteContent());
export const updateSiteContent = (content: SiteContent) =>
  getDatabase().updateSiteContent(siteContentSchema.parse(content));
