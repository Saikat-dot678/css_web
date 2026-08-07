import { AdminHeader } from "@/components/admin/AdminHeader";
import { EventEditor } from "@/components/admin/EventEditor";

export default function NewEventPage() {
  return <><AdminHeader title="Create event" description="Every event keeps a poster, details, registration state, and archive material." /><main className="admin-content"><EventEditor /></main></>;
}
