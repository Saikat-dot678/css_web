import "server-only";

import { MongoClient, type Document } from "mongodb";
import type { DatabaseAdapter, EntityQuery } from "./adapter";
import type { CollectionEntity, CollectionName } from "@/types/database";
import type { SiteContent } from "@/types/content";

const DEFAULT_SITE_CONTENT: SiteContent = {
  heroHeadline: "A department society for people who make things happen.",
  heroDescription:
    "The CSE Students’ Society connects students with useful work: workshops, projects, representation, opportunities, and each other.",
  recruitmentText:
    "Join a working group, volunteer for an event, or propose something the department should have.",
  recruitmentOpen: true,
  currentAcademicYear: "2026-27",
};

export class MongoDatabase implements DatabaseAdapter {
  private readonly client: MongoClient;
  private readonly databaseName: string;

  constructor(url: string, databaseName = process.env.MONGO_DB_NAME || "css_society") {
    this.client = new MongoClient(url);
    this.databaseName = databaseName;
  }

  private async collection(name: CollectionName) {
    await this.client.connect();
    return this.client.db(this.databaseName).collection<Document>(name);
  }

  async list<T extends CollectionEntity>(collection: CollectionName): Promise<T[]> {
    const documents = await (await this.collection(collection)).find({}, { projection: { _id: 0 } }).toArray();
    return documents as unknown as T[];
  }

  async findById<T extends CollectionEntity>(collection: CollectionName, id: string): Promise<T | null> {
    return this.findOne<T>(collection, { id });
  }

  async findOne<T extends CollectionEntity>(collection: CollectionName, query: EntityQuery): Promise<T | null> {
    const document = await (await this.collection(collection)).findOne(query as Document, {
      projection: { _id: 0 },
    });
    return (document as unknown as T | null) ?? null;
  }

  async insert<T extends CollectionEntity>(collection: CollectionName, entity: T): Promise<T> {
    await (await this.collection(collection)).insertOne(entity as unknown as Document);
    return structuredClone(entity);
  }

  async update<T extends CollectionEntity>(collection: CollectionName, id: string, entity: T): Promise<T> {
    const result = await (await this.collection(collection)).replaceOne(
      { id },
      entity as unknown as Document,
    );
    if (!result.matchedCount) throw new Error(`${collection} entity ${id} was not found.`);
    return structuredClone(entity);
  }

  async remove(collection: CollectionName, id: string): Promise<boolean> {
    const result = await (await this.collection(collection)).deleteOne({ id });
    return result.deletedCount > 0;
  }

  async getSiteContent(): Promise<SiteContent> {
    await this.client.connect();
    const document = await this.client
      .db(this.databaseName)
      .collection<Document>("siteContent")
      .findOne({ id: "site" }, { projection: { _id: 0, id: 0 } });
    return { ...DEFAULT_SITE_CONTENT, ...(document as Partial<SiteContent> | null) };
  }

  async updateSiteContent(content: SiteContent): Promise<SiteContent> {
    await this.client.connect();
    await this.client
      .db(this.databaseName)
      .collection<Document>("siteContent")
      .replaceOne({ id: "site" }, { id: "site", ...content }, { upsert: true });
    return structuredClone(content);
  }
}
