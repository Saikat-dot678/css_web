import type { Event } from "@/types/event";

export type EventPhase = "Upcoming" | "Ongoing" | "Past";

export const eventPhase = (event: Event): EventPhase => {
  if (event.status === "ongoing") return "Ongoing";
  if (event.status === "past" || event.status === "archived") return "Past";
  return "Upcoming";
};

export const eventAcceptsRegistrations = (event: Event) => {
  if (!event.registrationOpen || eventPhase(event) === "Past") return false;
  if (!event.registrationDeadline) return true;
  return new Date(event.registrationDeadline).getTime() >= Date.now();
};
