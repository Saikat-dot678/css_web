"use server";

import { promises as fs } from "node:fs";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createFaculty, deleteFaculty, getFacultyById, updateFaculty } from "@/lib/repositories/members";

const value = (data: FormData, name: string) => String(data.get(name) || "").trim();
const emptyToUndefined = (input: string) => input || undefined;

async function uploadedFacultyImage(data: FormData) {
  const file = data.get("photoFile");
  if (!(file instanceof File) || !file.size) return undefined;
  if (process.env.NODE_ENV === "production") {
    throw new Error("Direct image uploads are disabled in production until durable object storage is configured. Use a durable public image URL instead.");
  }
  const imageExtensions: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
  };
  const extension = imageExtensions[file.type];
  if (!extension) throw new Error("Only JPEG, PNG, WebP, or GIF images are accepted.");
  if (file.size > 6 * 1024 * 1024) throw new Error("Images must be smaller than 6 MB.");
  const directory = path.join(process.cwd(), "public", "uploads", "faculty");
  await fs.mkdir(directory, { recursive: true });
  const filename = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}${extension}`;
  await fs.writeFile(path.join(directory, filename), Buffer.from(await file.arrayBuffer()));
  return `/uploads/faculty/${filename}`;
}

async function facultyValues(data: FormData, existingPhoto?: string) {
  const upload = await uploadedFacultyImage(data);
  return {
    name: value(data, "name"),
    photo: upload || value(data, "photo") || existingPhoto || `/api/avatars/faculty-${Date.now()}`,
    role: value(data, "role"),
    department: value(data, "department"),
    email: emptyToUndefined(value(data, "email")),
    profileUrl: emptyToUndefined(value(data, "profileUrl")),
    bio: emptyToUndefined(value(data, "bio")),
  };
}

function revalidateFacultySurfaces() {
  revalidatePath("/");
  revalidatePath("/team");
  revalidatePath("/admin/team");
}

export async function createFacultyAction(data: FormData) {
  await requireAdmin();
  await createFaculty(await facultyValues(data));
  revalidateFacultySurfaces();
}

export async function updateFacultyAction(data: FormData) {
  await requireAdmin();
  const id = value(data, "id");
  const current = await getFacultyById(id);
  if (!current) throw new Error("Faculty member not found.");
  await updateFaculty(id, await facultyValues(data, current.photo));
  revalidateFacultySurfaces();
}

export async function deleteFacultyAction(data: FormData) {
  await requireAdmin();
  await deleteFaculty(value(data, "id"));
  revalidateFacultySurfaces();
}
