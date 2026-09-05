import Link from "next/link";
import { EventExplorer } from "@/components/events/EventExplorer";
import { PosterImage } from "@/components/events/PosterImage";
import { PublicShell } from "@/components/public/PublicShell";
import { V4PageHero } from "@/components/public/V4PageHero";
import { getAnnouncements } from "@/lib/repositories/content";
import { getEvents } from "@/lib/repositories/events";
import { eventPhase } from "@/lib/events";

export const metadata = { title: "Events" };

export default async function EventsPage() {
  const [events, announcements] = await Promise.all([getEvents(), getAnnouncements(true)]);
  const activeEvents = events.filter((event) => eventPhase(event) !== "Past");
  const recentPast = events.filter((event) => eventPhase(event) === "Past").slice().sort((a, b) => b.date.localeCompare(a.date));
  const collage = [...activeEvents, ...recentPast].slice(0, 3);

  return (
    <PublicShell announcements={announcements} showTicker>
      <main id="main" className="v4-page v4-events-page">
        <V4PageHero
          index="02"
          eyebrow="EVENTS / LIVE CALENDAR"
          title="Ideas become experiences."
          copy="Workshops, competitions, talks, career programmes and technical sessions stay easy to scan while every completed event moves into a permanent date-wise archive."
          meta={[`${activeEvents.length} ACTIVE / UPCOMING`, `${recentPast.length} ARCHIVED`, "POSTER + RECAP + PHOTOS"]}
        >
          <div className="v4-event-poster-stack">
            {collage.map((event, index) => (
              <Link href={`/events/${event.slug}`} key={event.id} className={`stack-poster stack-poster-${index + 1}`}>
                <PosterImage src={event.poster} title={event.title} priority />
              </Link>
            ))}
            <span>EVENT STREAM / CSS</span>
          </div>
        </V4PageHero>

        <EventExplorer events={events} />

        <section className="v4-page-cta v4-wrap reveal">
          <div><span>ARCHIVE / PERMANENT RECORD</span><h2>Looking for an older event?</h2><p>Browse all completed CSS events date-wise with their poster, description, optional photographs, recap, resources and results.</p></div>
          <Link href="/archive">Open archive ↗</Link>
        </section>

        <section className="event-idea-cta wrap reveal"><div><p className="kicker">Student Proposals</p><h2>Have an event idea?</h2><p>Workshops, competitions, talks, and community initiatives can begin with a student proposal.</p></div><a className="solid-link large" href="/team#recruitment">Propose an event</a></section>
      </main>
    </PublicShell>
  );
}
