import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { createResponsesCsv } from "@/lib/forms/csv";
import { getEvents } from "@/lib/repositories/events";
import { getFormResponses, getForms } from "@/lib/repositories/forms";

export async function GET(request: NextRequest) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const formId = request.nextUrl.searchParams.get("form") || undefined;
  const eventId = request.nextUrl.searchParams.get("event") || undefined;
  const [events, forms, responses] = await Promise.all([getEvents(), getForms(), getFormResponses({ formId, eventId })]);
  const selected = formId ? forms.find((form) => form.id === formId) : undefined;
  if (formId && !selected) return NextResponse.json({ error: "Form not found" }, { status: 404 });
  const csv = createResponsesCsv(forms, responses, events, formId);
  const filename = selected ? `${selected.slug}-responses.csv` : eventId ? "event-form-responses.csv" : "all-form-responses.csv";
  return new NextResponse(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${filename}"` } });
}
