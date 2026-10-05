import "server-only";

import { getDatabase } from "@/lib/db";
import { resourceInputSchema, resourceSchema } from "@/lib/validation/resource";
import type { Resource } from "@/types/resource";
import { createEntity, updateEntity, type EntityInput } from "./base";

export const getResources = () => getDatabase().list<Resource>("resources");
export const getResourceById = (id: string) => getDatabase().findById<Resource>("resources", id);
export async function createResource(input: EntityInput<Resource>) {
  const parseResult = resourceInputSchema.safeParse(input);
  if (!parseResult.success) {
    const issues = parseResult.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Resource validation failed (${issues})`);
  }
  return resourceSchema.parse(
    await createEntity<Resource>("resources", "resource", parseResult.data),
  );
}
export async function updateResource(id: string, patch: Partial<EntityInput<Resource>>) {
  const current = await getResourceById(id);
  if (!current) throw new Error("Resource not found.");
  const parseResult = resourceInputSchema.safeParse({ ...current, ...patch });
  if (!parseResult.success) {
    const issues = parseResult.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Resource validation failed (${issues})`);
  }
  return resourceSchema.parse(
    await updateEntity<Resource>("resources", id, parseResult.data),
  );
}
export const deleteResource = (id: string) => getDatabase().remove("resources", id);
