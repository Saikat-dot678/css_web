import Link from "next/link";
import { eventPhase } from "@/lib/events";
import { formatDate, formatStatus } from "@/lib/utils";
import type { Event } from "@/types/event";
import { PosterImage } from "./PosterImage";

export function EventPosterCard({ event, compact = false }: { event: Event; compact?: boolean }) {
  const phase = eventPhase(event);
  return (
    <article className={`poster-card reveal ${compact ? "compact" : ""}`} data-phase={phase} data-category={event.category}>
      <Link className="poster-card-media" href={`/events/${event.slug}`}><PosterImage src={event.poster} title={event.title} /></Link>
      <div className="poster-card-copy">
        <div className="poster-card-meta"><span>{formatDate(event.date)}</span><span>{event.category}</span></div>
        <h3>{event.title}</h3><p>{event.shortDescription}</p>
        <div className="poster-card-foot"><span className={`event-state phase-${phase.toLowerCase()}`}>{formatStatus(event.status)}</span><Link href={`/events/${event.slug}`}>{phase === "Past" ? "View recap" : "View details"} ↗</Link></div>
      </div>
    </article>
  );
}
