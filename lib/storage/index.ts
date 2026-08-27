import "server-only";
import type { FileStorage } from "./types";
import { LocalFileStorage } from "./local";

let storage: FileStorage | undefined;

/**
 * Storage boundary for form uploads.
 *
 * Local disk is a development/test fallback only. Serverless/local production
 * filesystems are not durable, so production must provide a real object-storage
 * adapter before file-upload fields are enabled.
 */
export function getFileStorage(): FileStorage {
  if (storage) return storage;
  const configured = process.env.FORM_STORAGE?.trim().toLowerCase();
  const mode = configured || (process.env.NODE_ENV === "production" ? "unconfigured" : "local");
  if (mode === "local" && process.env.NODE_ENV !== "production") {
    storage = new LocalFileStorage();
    return storage;
  }
  if (mode === "local") {
    throw new Error("FORM_STORAGE=local is development-only. Configure durable object storage for production form uploads.");
  }
  throw new Error(`No durable form-upload storage adapter is configured${configured ? ` for FORM_STORAGE=“${configured}”` : ""}.`);
}
