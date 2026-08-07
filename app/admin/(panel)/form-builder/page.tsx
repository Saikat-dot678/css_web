import { AdminHeader } from "@/components/admin/AdminHeader";
import { FormBuilder } from "@/components/admin/FormBuilder";
import { getEvents } from "@/lib/repositories/events";
import { getRegistrationFormByEventId } from "@/lib/repositories/forms";

export default async function FormBuilderPage({ searchParams }: { searchParams: Promise<{ event?: string }> }) {
  const events = await getEvents();
  const selectedId = (await searchParams).event || events[0]?.id;
  const form = selectedId ? await getRegistrationFormByEventId(selectedId) : null;
  return <><AdminHeader title="Registration form builder" description="Add, reorder, require, and configure fields for each event." /><main className="admin-content">{form ? <FormBuilder form={form} events={events} /> : <div className="empty-state"><strong>No form available</strong><p>Create an event first; its registration form will be created automatically.</p></div>}</main></>;
}
