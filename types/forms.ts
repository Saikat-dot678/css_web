import type { BaseEntity } from "./common";

export type FormFieldType =
  | "shortText"
  | "longText"
  | "email"
  | "phone"
  | "number"
  | "dropdown"
  | "multipleChoice"
  | "checkbox"
  | "date"
  | "time"
  | "dateTime"
  | "url"
  | "file"
  | "consent"
  | "sectionHeading"
  | "information"
  | "divider";

export interface FormField {
  id: string;
  type: FormFieldType;
  label: string;
  placeholder?: string;
  helperText?: string;
  required: boolean;
  options?: string[];
  order: number;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  step?: number;
  allowedFileTypes?: string[];
  maxFileSizeMb?: number;
  allowMultipleFiles?: boolean;
}

export type FormKind = "standalone" | "event";
export type FormStatus = "draft" | "published" | "closed";

export interface FormDefinition extends BaseEntity {
  slug: string;
  title: string;
  description?: string;
  kind: FormKind;
  eventId?: string;
  /** True only for the automatically-created default form owned by an event. */
  eventOwned?: boolean;
  status: FormStatus;
  submitLabel: string;
  successTitle?: string;
  successMessage?: string;
  opensAt?: string;
  closesAt?: string;
  responseLimit?: number;
  fields: FormField[];
}

export type FormAnswerValue = string | string[];

export interface FormResponse extends BaseEntity {
  formId: string;
  formSlug: string;
  eventId?: string;
  eventSlug?: string;
  answers: Record<string, FormAnswerValue>;
  submittedAt: string;
  /** Read-only compatibility with legacy registration records. */
  name?: string;
  /** Read-only compatibility with legacy registration records. */
  email?: string;
}

// Backwards-compatible aliases for seed data and old documents. Runtime reads are
// normalized into FormDefinition/FormResponse by the repository service.
export interface LegacyRegistrationForm extends BaseEntity {
  eventId: string;
  title: string;
  fields: FormField[];
}

export interface LegacyRegistration extends BaseEntity {
  eventId: string;
  eventSlug: string;
  name: string;
  email: string;
  answers: Record<string, FormAnswerValue>;
  submittedAt: string;
}

export type RegistrationForm = FormDefinition | LegacyRegistrationForm;
export type RegistrationAnswerValue = FormAnswerValue;
export type Registration = FormResponse | LegacyRegistration;
