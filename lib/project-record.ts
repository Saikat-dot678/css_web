import type { Project } from "@/types/project";

// Older persisted projects predate the array fields in the current editor.
export function normalizeProjectRecord(project: Project): Project {
  const list = (value: unknown): string[] => Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : typeof value === "string" ? value.split(",").map((item) => item.trim()).filter(Boolean) : [];
  return { ...project, technologies: list(project.technologies), contributors: list(project.contributors) };
}
