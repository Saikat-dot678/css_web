import { AdminHeader } from "@/components/admin/AdminHeader";
import { ContentAdmin } from "@/components/admin/ContentAdmin";
import { getAnnouncements, getSiteContent } from "@/lib/repositories/content";

export default async function AdminContentPage() {
  const [content, announcements] = await Promise.all([getSiteContent(), getAnnouncements()]);
  return <><AdminHeader title="Content" description="Control homepage copy, recruitment state and announcements." /><ContentAdmin content={content} announcements={announcements} /></>;
}
