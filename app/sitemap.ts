import type { MetadataRoute } from "next";
import { getEvents } from "@/lib/repositories/events";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const routes = ["", "/events", "/projects", "/team", "/resources", "/achievements"];
  const events = await getEvents();
  return [...routes.map((route) => ({ url: `${base}${route}`, lastModified: new Date() })), ...events.map((event) => ({ url: `${base}/events/${event.slug}`, lastModified: new Date(event.updatedAt) }))];
}
