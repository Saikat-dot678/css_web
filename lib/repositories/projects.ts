import "server-only";

import { getDatabase } from "@/lib/db";
import { projectInputSchema, projectSchema } from "@/lib/validation/project";
import type { Project } from "@/types/project";
import { createEntity, updateEntity, type EntityInput } from "./base";

export const getProjects = () => getDatabase().list<Project>("projects");
export const getProjectById = (id: string) => getDatabase().findById<Project>("projects", id);
export async function createProject(input: EntityInput<Project>) {
  return projectSchema.parse(
    await createEntity<Project>("projects", "project", projectInputSchema.parse(input)),
  );
}
export async function updateProject(id: string, patch: Partial<EntityInput<Project>>) {
  const current = await getProjectById(id);
  if (!current) throw new Error("Project not found.");
  return projectSchema.parse(
    await updateEntity<Project>("projects", id, projectInputSchema.parse({ ...current, ...patch })),
  );
}
export const deleteProject = (id: string) => getDatabase().remove("projects", id);
