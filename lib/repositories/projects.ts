import "server-only";

import { getDatabase } from "@/lib/db";
import { projectInputSchema, projectSchema } from "@/lib/validation/project";
import type { Project } from "@/types/project";
import { createEntity, updateEntity, type EntityInput } from "./base";

export const getProjects = () => getDatabase().list<Project>("projects");
export const getProjectById = (id: string) => getDatabase().findById<Project>("projects", id);
export const getProjectBySlug = (slug: string) => getDatabase().findOne<Project>("projects", { slug });
export async function createProject(input: EntityInput<Project>) {
  const parseResult = projectInputSchema.safeParse(input);
  if (!parseResult.success) {
    const issues = parseResult.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Project validation failed (${issues})`);
  }
  const parsed = parseResult.data;
  if (await getProjectBySlug(parsed.slug)) throw new Error("A project already uses this slug.");
  return projectSchema.parse(await createEntity<Project>("projects", "project", parsed));
}
export async function updateProject(id: string, patch: Partial<EntityInput<Project>>) {
  const current = await getProjectById(id);
  if (!current) throw new Error("Project not found.");
  const parseResult = projectInputSchema.safeParse({ ...current, ...patch });
  if (!parseResult.success) {
    const issues = parseResult.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Project validation failed (${issues})`);
  }
  const parsed = parseResult.data;
  const slugMatch = await getProjectBySlug(parsed.slug);
  if (slugMatch && slugMatch.id !== id) throw new Error("A project already uses this slug.");
  return projectSchema.parse(await updateEntity<Project>("projects", id, parsed));
}
export const deleteProject = (id: string) => getDatabase().remove("projects", id);
