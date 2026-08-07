import "server-only";

import { getDatabase } from "@/lib/db";
import { memberInputSchema, memberSchema } from "@/lib/validation/member";
import type { Faculty, Member, PreviousCommittee } from "@/types/member";
import { createEntity, updateEntity, type EntityInput } from "./base";

export const getMembers = async (academicYear?: string) => {
  const members = await getDatabase().list<Member>("members");
  return academicYear ? members.filter((member) => member.academicYear === academicYear) : members;
};
export const getMemberById = (id: string) => getDatabase().findById<Member>("members", id);
export const getFaculty = () => getDatabase().list<Faculty>("faculty");
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
