import { notFound } from "next/navigation";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { EventEditor } from "@/components/admin/EventEditor";
import { getEventById } from "@/lib/repositories/events";

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const event = await getEventById((await params).id);
  if (!event) notFound();
  return <><AdminHeader title="Edit event" description="Every event keeps a poster, details, registration state, and archive material." /><main className="admin-content"><EventEditor event={event} /></main></>;
}
