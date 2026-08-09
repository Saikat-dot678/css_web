import Image from "next/image";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import type { Event } from "@/types/event";
import { PosterImage } from "@/components/events/PosterImage";

function eventYear(date: string) {
  return date.slice(0, 4) || "Undated";
}

export function ArchiveTimeline({ events }: { events: Event[] }) {
  const years = [...new Set(events.map((event) => eventYear(event.date)))].sort((a, b) => b.localeCompare(a));

  if (!events.length) {
    return <section className="v4-archive-empty v4-wrap"><strong>No archived events yet.</strong><p>Completed events will automatically appear here.</p></section>;
  }

  return (
    <section className="v4-archive-timeline v4-wrap">
      {years.map((year) => {
        const yearEvents = events.filter((event) => eventYear(event.date) === year);
        return (
          <div className="v4-archive-year" key={year}>
            <aside className="v4-archive-year-label">
              <span>ARCHIVE / YEAR</span>
              <strong>{year}</strong>
              <b>{yearEvents.length} EVENTS</b>
            </aside>

            <div className="v4-archive-events">
              {yearEvents.map((event, index) => (
                <article className="v4-archive-event reveal" key={event.id}>
                  <div className="v4-archive-date">
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <time dateTime={event.date}>{formatDate(event.date)}</time>
                    <em>{event.category}</em>
                  </div>

                  <Link className="v4-archive-poster" href={`/events/${event.slug}`} data-parallax="0.025">
                    <PosterImage src={event.poster} title={event.title} />
                  </Link>

                  <div className="v4-archive-copy">
                    <h2><Link href={`/events/${event.slug}`}>{event.title}</Link></h2>
                    <p>{event.fullDescription || event.shortDescription}</p>
                    <div className="v4-archive-meta">
                      <span>{event.venue}</span>
                      {event.attendance && <span>{event.attendance}</span>}
                    </div>
                    {!!event.gallery.length && (
                      <div className="v4-archive-gallery" aria-label={`Photos from ${event.title}`}>
                        {event.gallery.slice(0, 3).map((image, imageIndex) => (
                          <a href={image} target="_blank" rel="noreferrer" key={`${image}-${imageIndex}`}>
                            <Image src={image} alt={`${event.title} photo ${imageIndex + 1}`} width={420} height={280} unoptimized />
                          </a>
                        ))}
                        {event.gallery.length > 3 && <Link href={`/events/${event.slug}`}>+{event.gallery.length - 3}<br />MORE</Link>}
                      </div>
                    )}
                    <Link className="v4-record-link" href={`/events/${event.slug}`}>Poster, description &amp; recap ↗</Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        );
      })}
    </section>
  );
}
