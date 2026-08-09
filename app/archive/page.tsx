import { ArchiveTimeline } from "@/components/archive/ArchiveTimeline";
import { PublicShell } from "@/components/public/PublicShell";
import { V4PageHero } from "@/components/public/V4PageHero";
import { eventPhase } from "@/lib/events";
import { getAnnouncements } from "@/lib/repositories/content";
import { getEvents } from "@/lib/repositories/events";

export const metadata = {
  title: "Event Archive",
  description: "Past CSS NIT Durgapur events organised date-wise with posters, recaps and photographs.",
};

export default async function ArchivePage() {
  const [events, announcements] = await Promise.all([getEvents(), getAnnouncements(true)]);
  const past = events
    .filter((event) => eventPhase(event) === "Past")
    .slice()
    .sort((left, right) => right.date.localeCompare(left.date));
  const years = new Set(past.map((event) => event.date.slice(0, 4))).size;
  const photoCount = past.reduce((total, event) => total + event.gallery.length, 0);

  return (
    <PublicShell announcements={announcements} showTicker>
      <main id="main" className="v4-page v4-archive-page">
        <V4PageHero
          index="03"
          eyebrow="ARCHIVE / EVENT MEMORY"
          title="Nothing useful should disappear after the poster comes down."
          copy="Every completed event lives here in reverse chronological order. The poster is permanent, photographs are optional, and the event description remains part of the record."
          meta={[`${past.length} PAST EVENTS`, `${years} YEARS`, `${photoCount} PHOTOS STORED`]}
        >
          <div className="v4-archive-hero-artifact">
            <div className="archive-disc"><i /><i /><strong>CSS</strong></div>
            <div className="archive-ticks">{Array.from({ length: 7 }, (_, index) => <span key={index} />)}</div>
            <b>PAST / PRESENT / RECORD</b>
          </div>
        </V4PageHero>
        <ArchiveTimeline events={past} />
      </main>
    </PublicShell>
  );
}
