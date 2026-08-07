import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { getEvents } from "@/lib/repositories/events";
import { getRegistrationForms, getRegistrations } from "@/lib/repositories/forms";

const csvCell = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;

export async function GET(request: NextRequest) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const eventId = request.nextUrl.searchParams.get("event") || undefined;
  const [events, forms, registrations] = await Promise.all([getEvents(), getRegistrationForms(), getRegistrations(eventId)]);
  const eventMap = new Map(events.map((event) => [event.id, event]));
  const form = eventId ? forms.find((item) => item.eventId === eventId) : undefined;
  const fieldIds = form?.fields.filter((field) => field.type !== "sectionHeading").map((field) => field.id)
    ?? [...new Set(registrations.flatMap((registration) => Object.keys(registration.answers)))];
  const labels = new Map(forms.flatMap((item) => item.fields.map((field) => [field.id, field.label] as const)));
  const rows = [
    ["Response ID", "Event", "Name", "Email", "Submitted", ...fieldIds.map((id) => labels.get(id) ?? id)],
    ...registrations.map((registration) => [registration.id, eventMap.get(registration.eventId)?.title ?? registration.eventSlug, registration.name, registration.email, registration.submittedAt, ...fieldIds.map((id) => {
      const answer = registration.answers[id];
      return Array.isArray(answer) ? answer.join("; ") : answer ?? "";
    })]),
  ];
  const csv = `\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\r\n")}`;
  const filename = eventId ? `${eventMap.get(eventId)?.slug ?? "event"}-responses.csv` : "all-event-responses.csv";
  return new NextResponse(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${filename}"` } });
}
