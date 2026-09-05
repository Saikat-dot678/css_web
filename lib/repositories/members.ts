import "server-only";

import { getDatabase } from "@/lib/db";
import { facultyInputSchema, facultySchema, memberInputSchema, memberSchema } from "@/lib/validation/member";
import type { Faculty, Member, PreviousCommittee } from "@/types/member";
import { createEntity, updateEntity, type EntityInput } from "./base";

export const getMembers = async (academicYear?: string) => {
  const members = await getDatabase().list<Member>("members");
  return academicYear ? members.filter((member) => member.academicYear === academicYear) : members;
};
export const getMemberById = (id: string) => getDatabase().findById<Member>("members", id);
export const getFaculty = () => getDatabase().list<Faculty>("faculty");
export const getFacultyById = (id: string) => getDatabase().findById<Faculty>("faculty", id);
export const getPreviousCommittees = () =>
  getDatabase().list<PreviousCommittee>("previousCommittees");

export async function createMember(input: EntityInput<Member>) {
  return memberSchema.parse(
    await createEntity<Member>("members", "member", memberInputSchema.parse(input)),
  );
}

export async function updateMember(id: string, patch: Partial<EntityInput<Member>>) {
  const current = await getMemberById(id);
  if (!current) throw new Error("Member not found.");
  const parsed = memberInputSchema.parse({ ...current, ...patch });
  return memberSchema.parse(await updateEntity<Member>("members", id, parsed));
}

export const deleteMember = (id: string) => getDatabase().remove("members", id);

export async function createFaculty(input: EntityInput<Faculty>) {
  return facultySchema.parse(
    await createEntity<Faculty>("faculty", "faculty", facultyInputSchema.parse(input)),
  );
}

export async function updateFaculty(id: string, patch: Partial<EntityInput<Faculty>>) {
  const current = await getFacultyById(id);
  if (!current) throw new Error("Faculty member not found.");
  const parsed = facultyInputSchema.parse({ ...current, ...patch });
  return facultySchema.parse(await updateEntity<Faculty>("faculty", id, parsed));
}

export const deleteFaculty = (id: string) => getDatabase().remove("faculty", id);
