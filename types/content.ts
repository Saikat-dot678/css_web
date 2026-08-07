import type { BaseEntity } from "./common";

export interface Announcement extends BaseEntity {
  title: string;
  content: string;
  pinned: boolean;
  published: boolean;
}

export interface SiteContent {
  heroHeadline: string;
  heroDescription: string;
  recruitmentText: string;
  recruitmentOpen: boolean;
  currentAcademicYear: string;
}
