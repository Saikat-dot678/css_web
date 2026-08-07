import type { BaseEntity } from "./common";

export type ResourceCategory =
  | "internships"
  | "hackathons"
  | "research"
  | "placements"
  | "higher_studies"
  | "competitive_programming"
  | "technical_resources"
  | "department";

export interface Resource extends BaseEntity {
  title: string;
  description: string;
  category: ResourceCategory;
  url: string;
  deadline?: string;
  eligibility?: string;
  featured: boolean;
  expiryDate?: string;
  meta?: string;
}
