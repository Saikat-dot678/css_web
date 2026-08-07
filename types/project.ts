import type { BaseEntity } from "./common";

export type ProjectStatus = "planning" | "active" | "completed" | "archived";

export interface Project extends BaseEntity {
  slug: string;
  title: string;
  description: string;
  status: ProjectStatus;
  technologies: string[];
  contributors: string[];
  githubUrl?: string;
  externalUrl?: string;
  image?: string;
  acceptingContributors: boolean;
  owner: string;
  academicYear: string;
}
