import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { EventPosterCard } from "@/components/events/EventPosterCard";
import { PosterImage } from "@/components/events/PosterImage";
import { RegistrationForm } from "@/components/events/RegistrationForm";
import { PublicShell } from "@/components/public/PublicShell";
import { eventAcceptsRegistrations, eventPhase } from "@/lib/events";
import { getAnnouncements } from "@/lib/repositories/content";
import { getEventBySlug, getEvents } from "@/lib/repositories/events";
import { getRegistrationFormByEventId } from "@/lib/repositories/forms";
import { formatDate, formatStatus } from "@/lib/utils";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const event = await getEventBySlug((await params).slug);
  return { title: event?.title ?? "Event", description: event?.shortDescription };
}

export default async function EventDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [event, allEvents, announcements] = await Promise.all([getEventBySlug(slug), getEvents(), getAnnouncements(true)]);
  if (!event) notFound();
  const form = event.registrationFormId ? await getRegistrationFormByEventId(event.id) : null;
  const phase = eventPhase(event);
  const canRegister = eventAcceptsRegistrations(event) && Boolean(form);
  const related = allEvents.filter((item) => item.id !== event.id && item.category === event.category).slice(0, 3);
  const backHref = phase === "Past" ? "/archive" : "/events";
  const backLabel = phase === "Past" ? "Event archive" : "All events";

  return <PublicShell announcements={announcements}><main id="main" className="v4-page v4-event-detail-page">
    <section className="event-detail-hero wrap"><Link href={backHref} className="back-link">← {backLabel}</Link><div className="event-detail-hero-grid"><div className="event-detail-poster" data-parallax="0.035"><PosterImage src={event.poster} title={event.title} priority /></div><div className="event-detail-info"><p className="kicker">{event.category} / {formatStatus(event.status)}</p><h1>{event.title}</h1><p className="event-lead">{event.shortDescription}</p><dl><div><dt>Date</dt><dd>{formatDate(event.date)}</dd></div><div><dt>Time</dt><dd>{event.startTime}{event.endTime ? `–${event.endTime}` : ""}</dd></div><div><dt>Venue</dt><dd>{event.venue}</dd></div><div><dt>Eligibility</dt><dd>{event.eligibility || "All CSE students"}</dd></div><div><dt>Registration deadline</dt><dd>{event.registrationDeadline?.replace("T", " · ") || "—"}</dd></div><div><dt>Entry</dt><dd>{event.entryFee || "Free"}</dd></div></dl><div className="event-actions">{canRegister ? <a className="solid-link large" href="#register">Register now</a> : <span className={`event-state phase-${phase.toLowerCase()}`}>{phase === "Past" ? "Event concluded" : formatStatus(event.status)}</span>}<Link className="under-link" href={backHref}>Back to {backLabel.toLowerCase()}</Link></div></div></div></section>
    <section className="event-content-stack wrap"><article className="event-about reveal"><p className="kicker">About the event</p><h2>What this event is for.</h2><p>{event.fullDescription}</p></article>
      <section className="event-info-block reveal"><p className="kicker">Event information</p><div className="event-info-grid"><div><span>Date</span><strong>{formatDate(event.date)}</strong></div><div><span>Time</span><strong>{event.startTime}{event.endTime ? `–${event.endTime}` : ""}</strong></div><div><span>Venue</span><strong>{event.venue}</strong></div><div><span>Eligibility</span><strong>{event.eligibility || "All CSE students"}</strong></div><div><span>Entry</span><strong>{event.entryFee || "Free"}</strong></div><div><span>Status</span><strong>{formatStatus(event.status)}</strong></div></div></section>
      {!!event.speakers.length && <section className="event-extra reveal"><p className="kicker">Speakers / Guests</p><div className="speaker-grid">{event.speakers.map((speaker) => <article className="speaker-card" key={speaker.name}><div className="speaker-photo">{speaker.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2)}</div><strong>{speaker.name}</strong><span>{speaker.position || "Speaker"}</span>{speaker.organisation && <em>{speaker.organisation}</em>}{speaker.linkedin && <a href={speaker.linkedin} target="_blank" rel="noreferrer">LinkedIn ↗</a>}</article>)}</div></section>}
      {!!event.schedule.length && <section className="event-extra reveal"><p className="kicker">Schedule</p><div className="schedule-list">{event.schedule.map((item) => <div className="schedule-row" key={`${item.time}-${item.title}`}><time>{item.time}</time><strong>{item.title}</strong></div>)}</div></section>}
      {phase === "Past" ? <><section className="event-recap reveal"><p className="kicker">Event recap</p><h2>{event.recap ? "What happened." : "Event concluded."}</h2><p>{event.recap || "A recap can be published with attendance, resources, results, and photographs."}</p>{event.attendance && <strong className="attendance">{event.attendance}</strong>}</section>{!!event.gallery.length && <section className="event-extra reveal"><p className="kicker">Gallery</p><div className="event-gallery">{event.gallery.map((image, index) => <a href={image} target="_blank" rel="noreferrer" key={image}><Image src={image} alt={`${event.title} gallery image ${index + 1}`} width={900} height={600} unoptimized /></a>)}</div></section>}{(event.resources.length > 0 || event.results.length > 0) && <section className="event-extra reveal"><p className="kicker">Resources / Results</p><div className="resource-links">{event.resources.map((resource) => <a href={resource.url} target="_blank" rel="noreferrer" key={resource.label}>{resource.label} ↗</a>)}{event.results.map((result) => <span className="event-state" key={result.title}>{result.title}</span>)}</div></section>}</> : <aside className="registration-panel" id="register">{canRegister && form ? <><div className="registration-head"><span>Registration</span><strong>{form.fields.filter((field) => field.type !== "sectionHeading").length} questions</strong></div><RegistrationForm form={form} eventSlug={event.slug} /></> : <div className="registration-closed"><span>{formatStatus(event.status)}</span><h2>Registration is not open.</h2><p>The poster and event details remain available even when registrations are closed.</p></div>}</aside>}
      {!!related.length && <section className="related-events"><p className="kicker">Related events</p><div className="related-poster-grid">{related.map((item) => <EventPosterCard event={item} compact key={item.id} />)}</div></section>}
    </section>
  </main></PublicShell>;
}
