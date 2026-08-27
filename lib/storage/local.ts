import { promises as fs } from "node:fs";
import path from "node:path";
import type { FileStorage, SaveFormFileOptions, StoredFile } from "./types";

const safeMimeTypes: Record<string, string> = {
  "application/pdf": ".pdf",
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "text/plain": ".txt",
  "text/csv": ".csv",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
  "application/vnd.ms-excel": ".xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
};

const safeSegment = (value: string) => value.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 120) || "unknown";

export class LocalFileStorage implements FileStorage {
  async saveFormFile(file: File, options: SaveFormFileOptions): Promise<StoredFile> {
    if (file.size <= 0) throw new Error("Empty files are not accepted.");
    if (file.size > options.maxBytes) throw Object.assign(new Error(`File must be smaller than ${Math.ceil(options.maxBytes / 1024 / 1024)} MB.`), { status: 413 });
    const extension = safeMimeTypes[file.type];
    if (!extension) throw Object.assign(new Error("This file type is not allowed."), { status: 415 });
    if (options.allowedTypes?.length && !options.allowedTypes.includes(file.type)) throw Object.assign(new Error("This file type is not allowed for this field."), { status: 415 });

    const formId = safeSegment(options.formId);
    const fieldId = safeSegment(options.fieldId);
    const directory = path.join(process.cwd(), "public", "uploads", "forms", formId);
    await fs.mkdir(directory, { recursive: true });
    const filename = `${fieldId}-${Date.now()}-${crypto.randomUUID().slice(0, 10)}${extension}`;
    await fs.writeFile(path.join(directory, filename), Buffer.from(await file.arrayBuffer()));
    return { url: `/uploads/forms/${formId}/${filename}`, mimeType: file.type, size: file.size };
  }
}
