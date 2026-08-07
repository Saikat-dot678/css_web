import type { BaseEntity } from "./common";

export type AcademicGroup =
  | "office_bearer"
  | "third_year"
  | "second_year"
  | "mtech"
  | "phd";

export interface Member extends BaseEntity {
  name: string;
  photo: string;
  role: string;
  programme: string;
  academicGroup: AcademicGroup;
  workingGroup: string;
  academicYear: string;
  linkedin?: string;
  instagram?: string;
  facebook?: string;
  github?: string;
  email?: string;
  researchArea?: string;
  bio?: string;
}

export interface Faculty extends BaseEntity {
  name: string;
  photo: string;
  role: string;
  department: string;
  email?: string;
  profileUrl?: string;
  bio?: string;
}

export interface PreviousCommittee extends BaseEntity {
  academicYear: string;
  memberIds: string[];
  contributionHighlights: string[];
}
