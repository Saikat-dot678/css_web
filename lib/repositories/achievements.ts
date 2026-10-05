import "server-only";

import { getDatabase } from "@/lib/db";
import { achievementInputSchema, achievementSchema } from "@/lib/validation/achievement";
import type { Achievement } from "@/types/achievement";
import { createEntity, updateEntity, type EntityInput } from "./base";

export const getAchievements = async () => {
  const items = await getDatabase().list<Achievement>("achievements");
  return items.sort((a, b) => b.year.localeCompare(a.year));
};
export const getAchievementById = (id: string) =>
  getDatabase().findById<Achievement>("achievements", id);
export async function createAchievement(input: EntityInput<Achievement>) {
  const parseResult = achievementInputSchema.safeParse(input);
  if (!parseResult.success) {
    const issues = parseResult.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Achievement validation failed (${issues})`);
  }
  return achievementSchema.parse(
    await createEntity<Achievement>(
      "achievements",
      "achievement",
      parseResult.data,
    ),
  );
}
export async function updateAchievement(id: string, patch: Partial<EntityInput<Achievement>>) {
  const current = await getAchievementById(id);
  if (!current) throw new Error("Achievement not found.");
  const parseResult = achievementInputSchema.safeParse({ ...current, ...patch });
  if (!parseResult.success) {
    const issues = parseResult.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Achievement validation failed (${issues})`);
  }
  return achievementSchema.parse(
    await updateEntity<Achievement>(
      "achievements",
      id,
      parseResult.data,
    ),
  );
}
export const deleteAchievement = (id: string) => getDatabase().remove("achievements", id);
