import type { BaseEntity } from "./common";

export interface Achievement extends BaseEntity {
  year: string;
  title: string;
  description: string;
  category: string;
  linkedMemberId?: string;
  linkedProjectId?: string;
  linkedEventId?: string;
  image?: string;
  externalUrl?: string;
}
