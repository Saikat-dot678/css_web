"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { eventPhase } from "@/lib/events";
import { formatDate, formatStatus } from "@/lib/utils";
import type { Event } from "@/types/event";
import { EventPosterCard } from "./EventPosterCard";
import { PosterImage } from "./PosterImage";

const phases = ["All", "Upcoming", "Ongoing", "Past"] as const;

export function EventExplorer({ events }: { events: Event[] }) {
  const [phase, setPhase] = useState<(typeof phases)[number]>("All");
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const categories = useMemo(() => ["All", ...new Set(events.map((event) => event.category))], [events]);
  const featured = events.find((event) => event.featured && eventPhase(event) !== "Past") ?? events.find((event) => eventPhase(event) !== "Past") ?? events[0];
  const visible = useMemo(() => events.filter((event) => {
    const text = `${event.title} ${event.category} ${event.status} ${event.shortDescription}`.toLowerCase();
    return (phase === "All" || eventPhase(event) === phase) && (category === "All" || event.category === category) && text.includes(search.trim().toLowerCase());
  }), [category, events, phase, search]);
  const group = (value: "Upcoming" | "Ongoing" | "Past") => visible.filter((event) => eventPhase(event) === value);
  const upcoming = group("Upcoming");
  const ongoing = group("Ongoing");
  const past = group("Past").slice().sort((left, right) => right.date.localeCompare(left.date)).slice(0, 3);
  const totalPast = events.filter((event) => eventPhase(event) === "Past").length;

  return <>
    <section className="event-controls-new wrap v4-event-controls" aria-label="Event filters">
      <div className="event-filter-row">{phases.map((item) => <button className={`filter-button ${phase === item ? "active" : ""}`} type="button" onClick={() => setPhase(item)} aria-pressed={phase === item} key={item}>{item}</button>)}</div>
      <div className="event-filter-row categories">{categories.map((item) => <button className={`filter-button ${category === item ? "active" : ""}`} type="button" onClick={() => setCategory(item)} aria-pressed={category === item} key={item}>{item}</button>)}</div>
      <label className="event-search"><span>Search</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Event title or category" /></label>
    </section>

    {featured && <section className="featured-event-new wrap reveal"><div className="featured-poster" data-parallax="0.045"><PosterImage src={featured.poster} title={featured.title} priority /></div><div className="featured-event-copy"><p className="kicker">Featured Event / {featured.category}</p><h2>{featured.title}</h2><p>{featured.fullDescription}</p><dl><div><dt>Date</dt><dd>{formatDate(featured.date)}</dd></div><div><dt>Time</dt><dd>{featured.startTime}{featured.endTime ? `–${featured.endTime}` : ""}</dd></div><div><dt>Venue</dt><dd>{featured.venue}</dd></div><div><dt>Status</dt><dd>{formatStatus(featured.status)}</dd></div></dl><div className="event-actions"><Link className="under-link" href={`/events/${featured.slug}`}>View details</Link>{featured.registrationOpen && <Link className="solid-link" href={`/events/${featured.slug}#register`}>Register now</Link>}</div></div></section>}

    {(phase === "All" || phase === "Upcoming") && <EventSection kicker="Upcoming events" title="Next on the calendar." countLabel={`${upcoming.length} events`} events={upcoming} />}
    {(phase === "All" || phase === "Ongoing") && ongoing.length > 0 && <EventSection kicker="Happening now" title="Currently in progress." countLabel={`${ongoing.length} live`} events={ongoing} className="happening" />}
    {(phase === "All" || phase === "Past") && <EventSection kicker="Past events" title="Latest from the archive." countLabel={`${Math.min(totalPast, 3)} shown`} events={past} className="past-events" intro="The Events page keeps only the latest three completed events. Every older event remains available date-wise in the permanent archive." archiveLink />}
    {!visible.length && <section className="poster-event-section wrap"><div className="empty-state"><strong>No matching events</strong><p>Try another phase, category, or search term.</p></div></section>}
  </>;
}

function EventSection({ kicker, title, countLabel, events, className = "", intro, archiveLink = false }: { kicker: string; title: string; countLabel: string; events: Event[]; className?: string; intro?: string; archiveLink?: boolean }) {
  if (!events.length && !archiveLink) return null;
  return <section className={`poster-event-section wrap ${className}`}><div className="event-section-head"><p className="kicker">{kicker}</p><h2>{title}</h2><span>{countLabel}</span></div>{intro && <p className="archive-intro">{intro}</p>}{events.length > 0 && <div className="poster-card-grid">{events.map((event) => <EventPosterCard event={event} key={event.id} />)}</div>}{archiveLink && <div className="v4-archive-jump"><div><span>PERMANENT RECORD</span><strong>Browse every past event by date.</strong></div><Link href="/archive">Open event archive ↗</Link></div>}</section>;
}
