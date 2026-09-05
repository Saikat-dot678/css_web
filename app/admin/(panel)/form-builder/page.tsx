import { AdminHeader } from "@/components/admin/AdminHeader";
import { FormBuilder } from "@/components/admin/FormBuilder";
import { getEvents } from "@/lib/repositories/events";
import { getForms } from "@/lib/repositories/forms";

export default async function FormBuilderPage({ searchParams }: { searchParams: Promise<{ form?: string; event?: string }> }) {
  const [events, forms] = await Promise.all([getEvents(), getForms()]);
  const params = await searchParams;
  const selected = forms.find((form) => form.id === params.form) ?? forms.find((form) => form.eventId === params.event) ?? forms[0];
  return <><AdminHeader title="Form builder" description="Build standalone forms or event registrations from the same reusable form engine." /><main className="admin-content"><FormBuilder key={selected?.id ?? "empty"} forms={forms} selectedForm={selected} events={events} /></main></>;
}
