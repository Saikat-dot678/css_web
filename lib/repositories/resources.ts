import "server-only";

import { getDatabase } from "@/lib/db";
import { resourceInputSchema, resourceSchema } from "@/lib/validation/resource";
import type { Resource } from "@/types/resource";
import { createEntity, updateEntity, type EntityInput } from "./base";

export const getResources = () => getDatabase().list<Resource>("resources");
export const getResourceById = (id: string) => getDatabase().findById<Resource>("resources", id);
export async function createResource(input: EntityInput<Resource>) {
  return resourceSchema.parse(
    await createEntity<Resource>("resources", "resource", resourceInputSchema.parse(input)),
  );
}
export async function updateResource(id: string, patch: Partial<EntityInput<Resource>>) {
  const current = await getResourceById(id);
  if (!current) throw new Error("Resource not found.");
  return resourceSchema.parse(
    await updateEntity<Resource>("resources", id, resourceInputSchema.parse({ ...current, ...patch })),
  );
}
export const deleteResource = (id: string) => getDatabase().remove("resources", id);
