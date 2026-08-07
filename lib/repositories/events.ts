import "server-only";

import { getDatabase } from "@/lib/db";
import { eventInputSchema, eventSchema } from "@/lib/validation/event";
import type { Event } from "@/types/event";
import { createEntity, updateEntity, type EntityInput } from "./base";

export const getEvents = async () => {
  const events = await getDatabase().list<Event>("events");
  return events.sort((a, b) => a.date.localeCompare(b.date));
};

export const getEventById = (id: string) => getDatabase().findById<Event>("events", id);
export const getEventBySlug = (slug: string) =>
  getDatabase().findOne<Event>("events", { slug });

export async function createEvent(input: EntityInput<Event>) {
  const parsed = eventInputSchema.parse(input);
  const existing = await getEventBySlug(parsed.slug);
  if (existing) throw new Error("An event already uses this slug.");
  return eventSchema.parse(await createEntity<Event>("events", "event", parsed));
}

export async function updateEvent(id: string, patch: Partial<EntityInput<Event>>) {
  const current = await getEventById(id);
  if (!current) throw new Error("Event not found.");
  const parsed = eventInputSchema.parse({ ...current, ...patch });
  const slugMatch = await getEventBySlug(parsed.slug);
  if (slugMatch && slugMatch.id !== id) throw new Error("An event already uses this slug.");
  return eventSchema.parse(await updateEntity<Event>("events", id, parsed));
}

export const deleteEvent = (id: string) => getDatabase().remove("events", id);
