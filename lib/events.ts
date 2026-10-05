import type { Event } from "@/types/event";

export type EventPhase = "Upcoming" | "Ongoing" | "Past";

export const eventIsPublic = (event: Event) => event.status !== "draft";

export const eventPhase = (event: Event): EventPhase => {
  if (event.status === "ongoing") return "Ongoing";
  if (event.status === "past" || event.status === "archived") return "Past";
  return "Upcoming";
};

export const eventAcceptsRegistrations = (event: Event) => {
  if (!eventIsPublic(event) || !event.registrationOpen || !["registration_open", "upcoming", "ongoing"].includes(event.status)) return false;
  if (!event.registrationDeadline) return true;
  return new Date(event.registrationDeadline).getTime() >= Date.now();
};
