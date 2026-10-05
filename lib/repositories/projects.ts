import "server-only";

import { getDatabase } from "@/lib/db";
import { projectInputSchema, projectSchema } from "@/lib/validation/project";
import type { Project } from "@/types/project";
import { createEntity, updateEntity, type EntityInput } from "./base";
import { normalizeProjectRecord } from "@/lib/project-record";

export const getProjects = async () => (await getDatabase().list<Project>("projects")).map(normalizeProjectRecord);
export const getProjectById = async (id: string) => {
  const project = await getDatabase().findById<Project>("projects", id);
  return project ? normalizeProjectRecord(project) : null;
};
export const getProjectBySlug = async (slug: string) => {
  const project = await getDatabase().findOne<Project>("projects", { slug });
  return project ? normalizeProjectRecord(project) : null;
};
export async function createProject(input: EntityInput<Project>) {
  const parsed = projectInputSchema.parse(input);
  if (await getProjectBySlug(parsed.slug)) throw new Error("A project already uses this slug.");
  return projectSchema.parse(await createEntity<Project>("projects", "project", parsed));
}
export async function updateProject(id: string, patch: Partial<EntityInput<Project>>) {
  const current = await getProjectById(id);
  if (!current) throw new Error("Project not found.");
  const parsed = projectInputSchema.parse({ ...current, ...patch });
  const slugMatch = await getProjectBySlug(parsed.slug);
  if (slugMatch && slugMatch.id !== id) throw new Error("A project already uses this slug.");
  return projectSchema.parse(await updateEntity<Project>("projects", id, parsed));
}
export const deleteProject = (id: string) => getDatabase().remove("projects", id);
