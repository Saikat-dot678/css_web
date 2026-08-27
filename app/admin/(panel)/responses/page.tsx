import { AdminHeader } from "@/components/admin/AdminHeader";
import { ResponsesTable } from "@/components/admin/ResponsesTable";
import { getEvents } from "@/lib/repositories/events";
import { getFormResponses, getForms } from "@/lib/repositories/forms";

export default async function AdminResponsesPage({ searchParams }: { searchParams: Promise<{ form?: string; event?: string }> }) {
  const params = await searchParams;
  const [events, responses, forms] = await Promise.all([getEvents(), getFormResponses(), getForms()]);
  return <><AdminHeader title="Responses" description="Inspect, search, filter, delete, and export responses from standalone and event-linked forms." /><main className="admin-content"><section className="admin-panel"><div className="panel-head"><h2>Response ledger</h2><span>{responses.length} total</span></div><ResponsesTable events={events} responses={responses} forms={forms} initialFormId={params.form} initialEventId={params.event} /></section></main></>;
}
