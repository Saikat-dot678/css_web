import { NextResponse } from "next/server";
import { FormSubmissionError } from "@/lib/forms/submission";
import { submitFormData } from "@/lib/forms/submit-server";
import { getEventBySlug } from "@/lib/repositories/events";
import { getFormByEventId } from "@/lib/repositories/forms";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const eventSlug = String(data.get("eventSlug") || "").trim();
    const event = await getEventBySlug(eventSlug);
    if (!event) return NextResponse.json({ message: "Event not found." }, { status: 404 });
    const form = await getFormByEventId(event.id);
    if (!form) return NextResponse.json({ message: "This event has no registration form." }, { status: 409 });
    if (form.kind !== "event" || form.eventId !== event.id) return NextResponse.json({ message: "The linked registration form is misconfigured." }, { status: 409 });
    const response = await submitFormData({ form, data, event, metadataKeys: ["eventSlug"] });
    return NextResponse.json({ id: response.id, message: form.successMessage || "Registration received." }, { status: 201 });
  } catch (error) {
    if (error instanceof FormSubmissionError) return NextResponse.json({ message: error.message }, { status: error.status });
    const status = typeof (error as { status?: unknown })?.status === "number" ? Number((error as { status: number }).status) : 500;
    if (status !== 500) return NextResponse.json({ message: error instanceof Error ? error.message : "Upload rejected." }, { status });
    console.error("Registration submission failed", error);
    return NextResponse.json({ message: "Registration could not be saved." }, { status: 500 });
  }
}
