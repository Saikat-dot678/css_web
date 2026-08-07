import { AdminEventTable } from "@/components/admin/AdminEventTable";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { getEvents } from "@/lib/repositories/events";

export default async function AdminEventsPage() {
  const events = await getEvents();
  return <><AdminHeader title="Events" description="Publish, edit, and archive poster-led events." /><main className="admin-content"><AdminEventTable events={events} /></main></>;
}
