import "server-only";

import { MongoClient, type Document } from "mongodb";
import type { DatabaseAdapter, EntityQuery } from "./adapter";
import type { CollectionEntity, CollectionName } from "@/types/database";
import type { SiteContent } from "@/types/content";
import { JsonDatabase } from "./json-db";

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
  private readonly fallbackJson: JsonDatabase;
  private useFallback = false;
  private fallbackLogged = false;

  constructor(url: string, databaseName = process.env.MONGO_DB_NAME || "css_society") {
    this.client = new MongoClient(url, {
      serverSelectionTimeoutMS: 3000,
      connectTimeoutMS: 3000,
    });
    this.databaseName = databaseName;
    this.fallbackJson = new JsonDatabase();
  }

  private async collection(name: CollectionName) {
    if (this.useFallback) return null;
    try {
      const connectPromise = this.client.connect();
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("MongoDB connection timeout")), 2000),
      );
      await Promise.race([connectPromise, timeoutPromise]);
      return this.client.db(this.databaseName).collection<Document>(name);
    } catch (error) {
      if (!this.fallbackLogged) {
        console.warn(
          "MongoDB connection failed or timed out. Falling back to local JSON database (data/db.json). Error:",
          (error as Error).message,
        );
        this.fallbackLogged = true;
      }
      this.useFallback = true;
      try {
        await this.client.close(true);
      } catch {}
      return null;
    }
  }

  async list<T extends CollectionEntity>(collection: CollectionName): Promise<T[]> {
    const col = await this.collection(collection);
    if (!col) return this.fallbackJson.list<T>(collection);
    try {
      const documents = await col.find({}, { projection: { _id: 0 } }).toArray();
      return documents as unknown as T[];
    } catch {
      this.useFallback = true;
      return this.fallbackJson.list<T>(collection);
    }
  }

  async findById<T extends CollectionEntity>(collection: CollectionName, id: string): Promise<T | null> {
    return this.findOne<T>(collection, { id });
  }

  async findOne<T extends CollectionEntity>(collection: CollectionName, query: EntityQuery): Promise<T | null> {
    const col = await this.collection(collection);
    if (!col) return this.fallbackJson.findOne<T>(collection, query);
    try {
      const document = await col.findOne(query as Document, {
        projection: { _id: 0 },
      });
      return (document as unknown as T | null) ?? null;
    } catch {
      this.useFallback = true;
      return this.fallbackJson.findOne<T>(collection, query);
    }
  }

  async insert<T extends CollectionEntity>(collection: CollectionName, entity: T): Promise<T> {
    const col = await this.collection(collection);
    if (!col) return this.fallbackJson.insert<T>(collection, entity);
    try {
      await col.insertOne(entity as unknown as Document);
      return structuredClone(entity);
    } catch {
      this.useFallback = true;
      return this.fallbackJson.insert<T>(collection, entity);
    }
  }

  async update<T extends CollectionEntity>(collection: CollectionName, id: string, entity: T): Promise<T> {
    const col = await this.collection(collection);
    if (!col) return this.fallbackJson.update<T>(collection, id, entity);
    try {
      const result = await col.replaceOne(
        { id },
        entity as unknown as Document,
      );
      if (!result.matchedCount) throw new Error(`${collection} entity ${id} was not found.`);
      return structuredClone(entity);
    } catch (error) {
      if ((error as Error).message?.includes("was not found")) throw error;
      this.useFallback = true;
      return this.fallbackJson.update<T>(collection, id, entity);
    }
  }

  async remove(collection: CollectionName, id: string): Promise<boolean> {
    const col = await this.collection(collection);
    if (!col) return this.fallbackJson.remove(collection, id);
    try {
      const result = await col.deleteOne({ id });
      return result.deletedCount > 0;
    } catch {
      this.useFallback = true;
      return this.fallbackJson.remove(collection, id);
    }
  }

  async getSiteContent(): Promise<SiteContent> {
    if (this.useFallback) return this.fallbackJson.getSiteContent();
    try {
      await this.client.connect();
      const document = await this.client
        .db(this.databaseName)
        .collection<Document>("siteContent")
        .findOne({ id: "site" }, { projection: { _id: 0, id: 0 } });
      return { ...DEFAULT_SITE_CONTENT, ...(document as Partial<SiteContent> | null) };
    } catch {
      this.useFallback = true;
      return this.fallbackJson.getSiteContent();
    }
  }

  async updateSiteContent(content: SiteContent): Promise<SiteContent> {
    if (this.useFallback) return this.fallbackJson.updateSiteContent(content);
    try {
      await this.client.connect();
      await this.client
        .db(this.databaseName)
        .collection<Document>("siteContent")
        .replaceOne({ id: "site" }, { id: "site", ...content }, { upsert: true });
      return structuredClone(content);
    } catch {
      this.useFallback = true;
      return this.fallbackJson.updateSiteContent(content);
    }
  }
}
