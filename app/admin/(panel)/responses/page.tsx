import { AdminHeader } from "@/components/admin/AdminHeader";
import { ResponsesTable } from "@/components/admin/ResponsesTable";
import { getEvents } from "@/lib/repositories/events";
import { getRegistrationForms, getRegistrations } from "@/lib/repositories/forms";

export default async function AdminResponsesPage({ searchParams }: { searchParams: Promise<{ event?: string }> }) {
  const params = await searchParams;
  const [events, registrations, forms] = await Promise.all([getEvents(), getRegistrations(), getRegistrationForms()]);
  return <><AdminHeader title="Responses" description="Inspect, filter and export event registrations." /><main className="admin-content"><section className="admin-panel"><div className="panel-head"><h2>Registration ledger</h2><span>{registrations.length} total</span></div><ResponsesTable events={events} registrations={registrations} forms={forms} initialEventId={params.event} /></section></main></>;
}
