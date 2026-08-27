import "server-only";

import { eventAcceptsRegistrations } from "@/lib/events";
import { assertFormAvailable, parseFormSubmission } from "@/lib/forms/submission";
import { countFormResponses, createFormResponse } from "@/lib/repositories/forms";
import { getFileStorage } from "@/lib/storage";
import type { Event } from "@/types/event";
import type { FormDefinition } from "@/types/forms";

export async function submitFormData({
  form,
  data,
  event,
  metadataKeys = [],
}: {
  form: FormDefinition;
  data: FormData;
  event?: Event;
  metadataKeys?: string[];
}) {
  const responseCount = await countFormResponses(form.id);
  assertFormAvailable(form, {
    responseCount,
    eventAcceptsRegistrations: form.kind === "event" ? Boolean(event && eventAcceptsRegistrations(event)) : undefined,
  });
  const answers = await parseFormSubmission(form, data, getFileStorage(), metadataKeys);
  const submittedAt = new Date().toISOString();
  return createFormResponse({
    formId: form.id,
    formSlug: form.slug,
    eventId: event?.id,
    eventSlug: event?.slug,
    answers,
    submittedAt,
  });
}
