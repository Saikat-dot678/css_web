import Link from "next/link";
import { EventExplorer } from "@/components/events/EventExplorer";
import { PosterImage } from "@/components/events/PosterImage";
import { PublicShell } from "@/components/public/PublicShell";
import { getAnnouncements } from "@/lib/repositories/content";
import { getEvents } from "@/lib/repositories/events";
import { eventPhase } from "@/lib/events";

export const metadata = { title: "Events" };

export default async function EventsPage() {
  const [events, announcements] = await Promise.all([getEvents(), getAnnouncements(true)]);
  const collage = [...events.filter((event) => eventPhase(event) !== "Past"), ...events.filter((event) => eventPhase(event) === "Past")].slice(0, 3);
  return <PublicShell announcements={announcements} showTicker><main id="main">
    <section className="events-hero wrap"><div><p className="edition">Events / CSS NIT Durgapur</p><h1>Ideas become experiences.</h1><p>Workshops, competitions, speaker sessions, career programmes, community events, and technical activities—each with its own poster and a permanent place in the archive.</p></div><div className="poster-collage">{collage.map((event) => <Link href={`/events/${event.slug}`} key={event.id}><PosterImage src={event.poster} title={event.title} priority /></Link>)}</div></section>
    <EventExplorer events={events} />
    <section className="event-idea-cta wrap"><div><p className="kicker">Student Proposals</p><h2>Have an event idea?</h2><p>Workshops, competitions, talks, and community initiatives can begin with a student proposal.</p></div><a className="solid-link large" href="/team#recruitment">Propose an event</a></section>
  </main></PublicShell>;
}
