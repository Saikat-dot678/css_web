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
  | "file"
  | "consent"
  | "sectionHeading";

export interface FormField {
  id: string;
  type: FormFieldType;
  label: string;
  placeholder?: string;
  helperText?: string;
  required: boolean;
  options?: string[];
  order: number;
}

export interface RegistrationForm extends BaseEntity {
  eventId: string;
  title: string;
  fields: FormField[];
}

export type RegistrationAnswerValue = string | string[];

export interface Registration extends BaseEntity {
  eventId: string;
  eventSlug: string;
  name: string;
  email: string;
  answers: Record<string, RegistrationAnswerValue>;
  submittedAt: string;
}
