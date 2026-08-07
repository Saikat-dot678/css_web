import "server-only";

import type { DatabaseAdapter } from "./adapter";
import { JsonDatabase } from "./json-db";
import { MongoDatabase } from "./mongodb";

declare global {
  var cssDatabase: DatabaseAdapter | undefined;
  var cssJsonFallbackLogged: boolean | undefined;
}

export function getDatabase(): DatabaseAdapter {
  if (globalThis.cssDatabase) return globalThis.cssDatabase;

  const mongoUrl = process.env.MONGO_URL?.trim();
  globalThis.cssDatabase = mongoUrl ? new MongoDatabase(mongoUrl) : new JsonDatabase();

  if (!mongoUrl && process.env.NODE_ENV === "development" && !globalThis.cssJsonFallbackLogged) {
    console.info("Using JSON database fallback: data/db.json");
    globalThis.cssJsonFallbackLogged = true;
  }

  return globalThis.cssDatabase;
}

export const databaseMode = () => (process.env.MONGO_URL?.trim() ? "mongodb" : "json");
