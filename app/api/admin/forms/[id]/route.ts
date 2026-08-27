import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { getEventById, updateEvent } from "@/lib/repositories/events";
import { countFormResponses, deleteForm, getFormByEventId, getFormById, updateForm } from "@/lib/repositories/forms";
import { formUpdateSchema } from "@/lib/validation/forms";

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await context.params;
    const current = await getFormById(id);
    if (!current) return NextResponse.json({ message: "Form not found." }, { status: 404 });
    const patch = formUpdateSchema.parse(await request.json());
    const nextKind = patch.kind ?? current.kind;
    const hasEventId = Object.prototype.hasOwnProperty.call(patch, "eventId");
    const nextEventId = nextKind === "event"
      ? (hasEventId ? patch.eventId ?? undefined : current.eventId)
      : undefined;
    if (nextKind === "event" && !nextEventId) return NextResponse.json({ message: "Choose an event for this form." }, { status: 422 });
    const targetEvent = nextEventId ? await getEventById(nextEventId) : null;
    if (nextEventId && !targetEvent) return NextResponse.json({ message: "Linked event not found." }, { status: 404 });
    const targetExistingForm = nextEventId ? await getFormByEventId(nextEventId) : null;

    const normalizedPatch: Parameters<typeof updateForm>[1] = {
      ...(patch.slug !== undefined ? { slug: patch.slug } : {}),
      ...(patch.title !== undefined ? { title: patch.title } : {}),
      ...(Object.prototype.hasOwnProperty.call(patch, "description") ? { description: patch.description ?? undefined } : {}),
      ...(patch.status !== undefined ? { status: patch.status } : {}),
      ...(patch.submitLabel !== undefined ? { submitLabel: patch.submitLabel } : {}),
      ...(Object.prototype.hasOwnProperty.call(patch, "successTitle") ? { successTitle: patch.successTitle ?? undefined } : {}),
      ...(Object.prototype.hasOwnProperty.call(patch, "successMessage") ? { successMessage: patch.successMessage ?? undefined } : {}),
      ...(Object.prototype.hasOwnProperty.call(patch, "opensAt") ? { opensAt: patch.opensAt ?? undefined } : {}),
      ...(Object.prototype.hasOwnProperty.call(patch, "closesAt") ? { closesAt: patch.closesAt ?? undefined } : {}),
      ...(Object.prototype.hasOwnProperty.call(patch, "responseLimit") ? { responseLimit: patch.responseLimit ?? undefined } : {}),
      ...(patch.fields !== undefined ? { fields: patch.fields } : {}),
      kind: nextKind,
      eventId: nextEventId,
      eventOwned: current.eventOwned === true && current.eventId === nextEventId,
    };
    const updated = await updateForm(id, normalizedPatch);

    if (current.eventId && current.eventId !== nextEventId) {
      const previousEvent = await getEventById(current.eventId);
      if (previousEvent?.registrationFormId === id) await updateEvent(previousEvent.id, { registrationFormId: undefined });
    }

    if (targetExistingForm && targetExistingForm.id !== id) {
      const responses = await countFormResponses(targetExistingForm.id);
      if (targetExistingForm.eventOwned && responses === 0) {
        await deleteForm(targetExistingForm.id);
      } else {
        await updateForm(targetExistingForm.id, { kind: "standalone", eventId: undefined, eventOwned: false, status: "draft" });
      }
    }
    if (targetEvent && targetEvent.registrationFormId !== id) await updateEvent(targetEvent.id, { registrationFormId: id });
    return NextResponse.json({ form: updated });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Invalid form." }, { status: 422 });
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await context.params;
    const form = await getFormById(id);
    if (!form) return NextResponse.json({ message: "Form not found." }, { status: 404 });
    await deleteForm(id);
    if (form.eventId) {
      const event = await getEventById(form.eventId);
      if (event?.registrationFormId === id) await updateEvent(event.id, { registrationFormId: undefined });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Could not delete form." }, { status: 409 });
  }
}
