"use client";

import { DynamicForm } from "@/components/forms/DynamicForm";
import type { FormDefinition } from "@/types/forms";

export function RegistrationForm({ form, eventSlug }: { form: FormDefinition; eventSlug: string }) {
  return <DynamicForm form={form} submitUrl="/api/registrations" hiddenFields={{ eventSlug }} />;
}
