import type { Achievement } from "./achievement";
import type { Announcement, SiteContent } from "./content";
import type { Event } from "./event";
import type { Registration, RegistrationForm } from "./forms";
import type { Faculty, Member, PreviousCommittee } from "./member";
import type { Project } from "./project";
import type { Resource } from "./resource";

export interface DatabaseShape {
  events: Event[];
  members: Member[];
  faculty: Faculty[];
  projects: Project[];
  resources: Resource[];
  achievements: Achievement[];
  announcements: Announcement[];
  registrationForms: RegistrationForm[];
  registrations: Registration[];
  previousCommittees: PreviousCommittee[];
  siteContent: SiteContent;
}

export type CollectionName = Exclude<keyof DatabaseShape, "siteContent">;
export type CollectionEntity = DatabaseShape[CollectionName][number];
