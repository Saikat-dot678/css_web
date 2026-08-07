import type { BaseEntity, LinkItem } from "./common";

export type EventStatus =
  | "draft"
  | "upcoming"
  | "registration_open"
  | "save_the_date"
  | "ongoing"
  | "closed"
  | "past"
  | "archived";

export interface EventSpeaker {
  name: string;
  position?: string;
  organisation?: string;
  linkedin?: string;
  photo?: string;
}

export interface ScheduleItem {
  time: string;
  title: string;
  description?: string;
}

export interface EventResult {
  title: string;
  description?: string;
  linkedMemberId?: string;
}

export interface Event extends BaseEntity {
  slug: string;
  title: string;
  poster: string;
  category: string;
  status: EventStatus;
  date: string;
  startTime: string;
  endTime?: string;
  venue: string;
  shortDescription: string;
  fullDescription: string;
  registrationOpen: boolean;
  registrationDeadline?: string;
  eligibility?: string;
  entryFee?: string;
  featured: boolean;
  speakers: EventSpeaker[];
  schedule: ScheduleItem[];
  registrationFormId?: string;
  recap?: string;
  attendance?: string;
  gallery: string[];
  resources: LinkItem[];
  results: EventResult[];
}
