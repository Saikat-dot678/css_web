import type { CollectionEntity, CollectionName } from "@/types/database";
import type { SiteContent } from "@/types/content";

export type QueryValue = string | number | boolean | null | undefined;
export type EntityQuery = Record<string, QueryValue>;

export interface DatabaseAdapter {
  list<T extends CollectionEntity>(collection: CollectionName): Promise<T[]>;
  findById<T extends CollectionEntity>(collection: CollectionName, id: string): Promise<T | null>;
  findOne<T extends CollectionEntity>(collection: CollectionName, query: EntityQuery): Promise<T | null>;
  insert<T extends CollectionEntity>(collection: CollectionName, entity: T): Promise<T>;
  update<T extends CollectionEntity>(collection: CollectionName, id: string, entity: T): Promise<T>;
  remove(collection: CollectionName, id: string): Promise<boolean>;
  getSiteContent(): Promise<SiteContent>;
  updateSiteContent(content: SiteContent): Promise<SiteContent>;
}
