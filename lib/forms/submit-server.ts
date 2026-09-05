import "server-only";

import { eventAcceptsRegistrations } from "@/lib/events";
import { assertFormAvailable, FormSubmissionError, parseFormSubmission } from "@/lib/forms/submission";
import { countFormResponses, createFormResponse } from "@/lib/repositories/forms";
import { getFileStorage } from "@/lib/storage";
import type { FileStorage } from "@/lib/storage/types";
import type { Event } from "@/types/event";
import type { FormDefinition } from "@/types/forms";

const containsSubmittedFile = (form: FormDefinition, data: FormData) => form.fields.some((field) =>
  field.type === "file" && data.getAll(field.id).some((value) => value instanceof File && value.size > 0),
);

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

  let storage: FileStorage | undefined;
  if (containsSubmittedFile(form, data)) {
    try {
      storage = getFileStorage();
    } catch (error) {
      console.error("Form upload storage is unavailable", error);
      throw new FormSubmissionError("File uploads are not available on this deployment.", 503);
    }
  }

  const answers = await parseFormSubmission(form, data, storage, metadataKeys);
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
