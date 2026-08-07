import "server-only";

import { getDatabase } from "@/lib/db";
import { createId, nowIso } from "@/lib/utils";
import type { CollectionEntity, CollectionName } from "@/types/database";

export type EntityInput<T extends CollectionEntity> = Omit<T, "id" | "createdAt" | "updatedAt">;

export async function createEntity<T extends CollectionEntity>(
  collection: CollectionName,
  prefix: string,
  input: EntityInput<T>,
): Promise<T> {
  const timestamp = nowIso();
  const entity = {
    ...input,
    id: createId(prefix),
    createdAt: timestamp,
    updatedAt: timestamp,
  } as T;
  return getDatabase().insert(collection, entity);
}

export async function updateEntity<T extends CollectionEntity>(
  collection: CollectionName,
  id: string,
  patch: Partial<EntityInput<T>>,
): Promise<T> {
  const current = await getDatabase().findById<T>(collection, id);
  if (!current) throw new Error(`${collection} entity ${id} was not found.`);
  const entity = { ...current, ...patch, id, updatedAt: nowIso() } as T;
  return getDatabase().update(collection, id, entity);
}
