import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { eventAcceptsRegistrations } from "@/lib/events";
import { createRegistration, getRegistrationFormByEventId } from "@/lib/repositories/forms";
import { getEventBySlug } from "@/lib/repositories/events";
import type { FormField, RegistrationAnswerValue } from "@/types/forms";

export const runtime = "nodejs";

class SubmissionError extends Error {}

const uploadExtensions: Record<string, string> = {
  "application/pdf": ".pdf",
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const eventSlug = String(data.get("eventSlug") || "");
    const event = await getEventBySlug(eventSlug);
    if (!event) return NextResponse.json({ message: "Event not found." }, { status: 404 });
    if (!eventAcceptsRegistrations(event)) return NextResponse.json({ message: "Registration is not open for this event." }, { status: 409 });
    const form = await getRegistrationFormByEventId(event.id);
    if (!form) return NextResponse.json({ message: "This event has no registration form." }, { status: 409 });

    const answers: Record<string, RegistrationAnswerValue> = {};
    for (const field of form.fields.sort((a, b) => a.order - b.order)) {
      if (field.type === "sectionHeading") continue;
      const values = data.getAll(field.id);
      if (field.required && (!values.length || values.every((value) => !value || (typeof value === "string" && !value.trim())))) {
        return NextResponse.json({ message: `${field.label} is required.` }, { status: 422 });
      }
      if (field.type === "file") {
        const file = values.find((value): value is File => value instanceof File && value.size > 0);
        if (!file) continue;
        if (file.size > 5 * 1024 * 1024) return NextResponse.json({ message: `${field.label} must be smaller than 5 MB.` }, { status: 413 });
        const extension = uploadExtensions[file.type];
        if (!extension) return NextResponse.json({ message: `${field.label} must be a PDF, JPEG, PNG, or WebP file.` }, { status: 415 });
        const directory = path.join(process.cwd(), "public", "uploads", "registrations");
        await fs.mkdir(directory, { recursive: true });
        const fileName = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}${extension}`;
        await fs.writeFile(path.join(directory, fileName), Buffer.from(await file.arrayBuffer()));
        answers[field.id] = `/uploads/registrations/${fileName}`;
        continue;
      }
      const textValues = values.filter((value): value is string => typeof value === "string").map((value) => value.trim()).filter(Boolean);
      validateField(field, textValues);
      if (textValues.length) answers[field.id] = field.type === "checkbox" ? textValues : textValues[0];
    }

    const nameField = form.fields.find((field) => field.type === "shortText" && /name/i.test(field.label)) ?? form.fields.find((field) => field.type === "shortText");
    const emailField = form.fields.find((field) => field.type === "email");
    const nameValue = nameField ? answers[nameField.id] : undefined;
    const emailValue = emailField ? answers[emailField.id] : undefined;
    const now = new Date().toISOString();
    const registration = await createRegistration({
      eventId: event.id,
      eventSlug: event.slug,
      name: typeof nameValue === "string" ? nameValue : "Registrant",
      email: typeof emailValue === "string" ? emailValue : "",
      answers,
      submittedAt: now,
    });
    return NextResponse.json({ id: registration.id, message: "Registration received." }, { status: 201 });
  } catch (error) {
    if (error instanceof SubmissionError) return NextResponse.json({ message: error.message }, { status: 422 });
    console.error("Registration submission failed", error);
    return NextResponse.json({ message: "Registration could not be saved." }, { status: 500 });
  }
}

function validateField(field: FormField, values: string[]) {
  if (!values.length) return;
  if (field.type === "email" && !/^\S+@\S+\.\S+$/.test(values[0])) throw new SubmissionError(`${field.label} must be a valid email.`);
  if (field.type === "number" && Number.isNaN(Number(values[0]))) throw new SubmissionError(`${field.label} must be a number.`);
  if (["dropdown", "multipleChoice", "checkbox"].includes(field.type) && field.options && values.some((value) => !field.options?.includes(value))) throw new SubmissionError(`${field.label} contains an invalid choice.`);
}
