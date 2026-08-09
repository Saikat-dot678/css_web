"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

import type { Event } from "@/types/event";

function shortDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short" })
    .format(date)
    .toUpperCase();
}

export function EventsShowcase({ events }: { events: Event[] }) {
  const shown = useMemo(() => events.slice(0, 5), [events]);
  const [activeId, setActiveId] = useState(shown[0]?.id ?? "");
  const active = shown.find((event) => event.id === activeId) ?? shown[0];

  if (!active) {
    return <div className="events-empty">Events will appear here when they are published.</div>;
  }

  return (
    <div className="events-showcase">
      <div className="events-list" role="list">
        {shown.map((event, index) => (
          <Link
            href={`/events/${event.slug}`}
            className={`event-line ${active.id === event.id ? "active" : ""}`}
            key={event.id}
            onMouseEnter={() => setActiveId(event.id)}
            onFocus={() => setActiveId(event.id)}
            role="listitem"
          >
            <span className="event-line-no">{String(index + 1).padStart(2, "0")}</span>
            <time dateTime={event.date}>{shortDate(event.date)}</time>
            <strong>{event.title}</strong>
            <em>{event.category}</em>
            <b>{event.registrationOpen ? "REGISTER" : "DETAILS"} ↗</b>
          </Link>
        ))}
      </div>

      <Link className="event-preview reveal" href={`/events/${active.slug}`} aria-label={`Open ${active.title}`}>
        <div className="event-preview-image">
          {active.poster ? (
            <Image src={active.poster} alt="" fill sizes="(max-width: 900px) 100vw, 38vw" unoptimized={active.poster.endsWith(".svg") || active.poster.startsWith("/api/")} />
          ) : (
            <div className="event-preview-placeholder" aria-hidden="true">
              <span>CSS / EVENT</span>
              <strong>{active.title}</strong>
            </div>
          )}
        </div>
        <div className="event-preview-meta">
          <div>
            <span>{active.startTime}</span>
            <span>{active.venue}</span>
          </div>
          <p>{active.shortDescription}</p>
        </div>
      </Link>
    </div>
  );
}
