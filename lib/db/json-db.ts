import { promises as fs } from "node:fs";
import path from "node:path";
import type { DatabaseAdapter, EntityQuery } from "./adapter";
import type { CollectionEntity, CollectionName, DatabaseShape } from "@/types/database";
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

const COLLECTIONS: CollectionName[] = [
  "events",
  "members",
  "faculty",
  "projects",
  "resources",
  "achievements",
  "announcements",
  "registrationForms",
  "registrations",
  "previousCommittees",
];

const emptyDatabase = (): DatabaseShape => ({
  events: [],
  members: [],
  faculty: [],
  projects: [],
  resources: [],
  achievements: [],
  announcements: [],
  registrationForms: [],
  registrations: [],
  previousCommittees: [],
  siteContent: DEFAULT_SITE_CONTENT,
});

let writeQueue: Promise<void> = Promise.resolve();

export class JsonDatabase implements DatabaseAdapter {
  constructor(
    private readonly filePath = path.join(process.cwd(), "data", "db.json"),
  ) {}

  private async read(): Promise<DatabaseShape> {
    try {
      const raw = await fs.readFile(this.filePath, "utf8");
      const parsed = JSON.parse(raw) as Partial<DatabaseShape>;
      const base = emptyDatabase();
      for (const collection of COLLECTIONS) {
        const value = parsed[collection];
        if (Array.isArray(value)) {
          (base[collection] as CollectionEntity[]) = value as CollectionEntity[];
        }
      }
      base.siteContent = { ...DEFAULT_SITE_CONTENT, ...(parsed.siteContent ?? {}) };
      return base;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        await this.write(emptyDatabase());
        return emptyDatabase();
      }
      throw error;
    }
  }

  private async write(database: DatabaseShape): Promise<void> {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    const temporaryPath = `${this.filePath}.${process.pid}.tmp`;
    await fs.writeFile(temporaryPath, `${JSON.stringify(database, null, 2)}\n`, "utf8");
    await fs.rename(temporaryPath, this.filePath);
  }

  private mutate<T>(operation: (database: DatabaseShape) => T | Promise<T>): Promise<T> {
    let result: T;
    const task = writeQueue.then(async () => {
      const database = await this.read();
      result = await operation(database);
      await this.write(database);
    });
    writeQueue = task.catch(() => undefined);
    return task.then(() => result!);
  }

  async list<T extends CollectionEntity>(collection: CollectionName): Promise<T[]> {
    await writeQueue;
    const database = await this.read();
    return structuredClone(database[collection]) as T[];
  }

  async findById<T extends CollectionEntity>(collection: CollectionName, id: string): Promise<T | null> {
    const entities = await this.list<T>(collection);
    return entities.find((entity) => entity.id === id) ?? null;
  }

  async findOne<T extends CollectionEntity>(collection: CollectionName, query: EntityQuery): Promise<T | null> {
    const entities = await this.list<T>(collection);
    return (
      entities.find((entity) =>
        Object.entries(query).every(
          ([key, value]) => (entity as unknown as Record<string, unknown>)[key] === value,
        ),
      ) ?? null
    );
  }

  insert<T extends CollectionEntity>(collection: CollectionName, entity: T): Promise<T> {
    return this.mutate((database) => {
      const entities = database[collection] as CollectionEntity[];
      if (entities.some((item) => item.id === entity.id)) {
        throw new Error(`Duplicate id ${entity.id} in ${collection}.`);
      }
      entities.push(structuredClone(entity));
      return structuredClone(entity);
    });
  }

  update<T extends CollectionEntity>(collection: CollectionName, id: string, entity: T): Promise<T> {
    return this.mutate((database) => {
      const entities = database[collection] as CollectionEntity[];
      const index = entities.findIndex((item) => item.id === id);
      if (index < 0) throw new Error(`${collection} entity ${id} was not found.`);
      entities[index] = structuredClone(entity);
      return structuredClone(entity);
    });
  }

  remove(collection: CollectionName, id: string): Promise<boolean> {
    return this.mutate((database) => {
      const entities = database[collection] as CollectionEntity[];
      const index = entities.findIndex((item) => item.id === id);
      if (index < 0) return false;
      entities.splice(index, 1);
      return true;
    });
  }

  async getSiteContent(): Promise<SiteContent> {
    await writeQueue;
    return structuredClone((await this.read()).siteContent);
  }

  updateSiteContent(content: SiteContent): Promise<SiteContent> {
    return this.mutate((database) => {
      database.siteContent = structuredClone(content);
      return structuredClone(content);
    });
  }
}
