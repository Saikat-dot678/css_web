import "server-only";

import { requireAdmin } from "@/lib/auth";
import { getDatabase } from "@/lib/db";
import { FormService, type FormInput, type FormResponseInput } from "@/lib/forms/service";
import type { FormDefinition, FormResponse } from "@/types/forms";

const service = () => new FormService(getDatabase());

export const getForms = () => service().listForms();
export const getFormById = (id: string) => service().getFormById(id);
export const getFormBySlug = (slug: string) => service().getFormBySlug(slug);
export const getFormByEventId = (eventId: string) => service().getFormByEventId(eventId);
export const createForm = (input: FormInput) => service().createForm(input);
export const updateForm = (id: string, patch: Partial<FormInput>) => service().updateForm(id, patch);
export const duplicateForm = (id: string) => service().duplicateForm(id);
export const countFormResponses = (formId: string) => service().countResponses(formId);
export const createFormResponse = (input: FormResponseInput) => service().createResponse(input);

export async function getFormResponses(filters: { formId?: string; eventId?: string } = {}) {
  await requireAdmin();
  return service().listResponses(filters);
}

export async function getFormResponseById(id: string) {
  await requireAdmin();
  return service().getResponseById(id);
}

export async function deleteFormResponse(id: string) {
  await requireAdmin();
  return service().deleteResponse(id);
}

export async function deleteForm(id: string) {
  await requireAdmin();
  return service().deleteForm(id);
}

// Compatibility exports for the existing event registration code while it uses the generic engine.
export const getRegistrationForms = getForms;
export const getRegistrationFormById = getFormById;
export const getRegistrationFormByEventId = getFormByEventId;
export const createRegistrationForm = createForm;
export const updateRegistrationForm = async (id: string, fields: FormDefinition["fields"]) => updateForm(id, { fields });
export const deleteRegistrationForm = deleteForm;
export const getRegistrations = async (eventId?: string): Promise<FormResponse[]> => getFormResponses({ eventId });
export const getRegistrationById = getFormResponseById;
export const createRegistration = createFormResponse;
export const deleteRegistration = deleteFormResponse;
