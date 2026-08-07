import "server-only";

import { requireAdmin } from "@/lib/auth";
import { getDatabase } from "@/lib/db";
import { registrationFormSchema, registrationSchema } from "@/lib/validation/forms";
import type { Registration, RegistrationForm } from "@/types/forms";
import { createEntity, updateEntity, type EntityInput } from "./base";

export const getRegistrationForms = () =>
  getDatabase().list<RegistrationForm>("registrationForms");
export const getRegistrationFormById = (id: string) =>
  getDatabase().findById<RegistrationForm>("registrationForms", id);
export const getRegistrationFormByEventId = (eventId: string) =>
  getDatabase().findOne<RegistrationForm>("registrationForms", { eventId });

export async function createRegistrationForm(input: EntityInput<RegistrationForm>) {
  return registrationFormSchema.parse(
    await createEntity<RegistrationForm>("registrationForms", "form", input),
  );
}

export async function updateRegistrationForm(id: string, fields: RegistrationForm["fields"]) {
  const current = await getRegistrationFormById(id);
  if (!current) throw new Error("Registration form not found.");
  const parsed = registrationFormSchema.parse({ ...current, fields });
  return updateEntity<RegistrationForm>("registrationForms", id, parsed);
}

export const deleteRegistrationForm = (id: string) =>
  getDatabase().remove("registrationForms", id);

export const getRegistrations = async (eventId?: string) => {
  await requireAdmin();
  const registrations = await getDatabase().list<Registration>("registrations");
  return eventId
    ? registrations.filter((registration) => registration.eventId === eventId)
    : registrations;
};
export const getRegistrationById = async (id: string) => {
  await requireAdmin();
  return getDatabase().findById<Registration>("registrations", id);
};
export async function createRegistration(input: EntityInput<Registration>) {
  return registrationSchema.parse(
    await createEntity<Registration>(
      "registrations",
      "registration",
      registrationSchema.omit({ id: true, createdAt: true, updatedAt: true }).parse(input),
    ),
  );
}
export const deleteRegistration = (id: string) => getDatabase().remove("registrations", id);
