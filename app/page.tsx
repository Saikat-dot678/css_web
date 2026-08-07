import Link from "next/link";
import { EventPosterCard } from "@/components/events/EventPosterCard";
import { PublicShell } from "@/components/public/PublicShell";
import { SectionHeader } from "@/components/public/SectionHeader";
import { getAchievements } from "@/lib/repositories/achievements";
import { getAnnouncements, getSiteContent } from "@/lib/repositories/content";
import { getEvents } from "@/lib/repositories/events";
import { getMembers } from "@/lib/repositories/members";
import { getProjects } from "@/lib/repositories/projects";
import { getResources } from "@/lib/repositories/resources";
import { formatDate, resourceCategoryLabel } from "@/lib/utils";

const departments = [
  ["Office bearers", 6, "#E84A27"],
  ["Technical", 8, "#D2A233"],
  ["Design", 6, "#C76A4B"],
  ["Events", 6, "#6C5A8C"],
  ["PR & Content", 5, "#B9842F"],
  ["Operations", 5, "#7B7368"],
] as const;

export default async function HomePage() {
  const [events, projects, resources, achievements, announcements, content] = await Promise.all([
    getEvents(), getProjects(), getResources(), getAchievements(), getAnnouncements(true), getSiteContent(),
  ]);
  const members = await getMembers(content.currentAcademicYear);
  const featured = events.find((item) => item.featured) ?? events[0];
  const upcoming = events.filter((item) => !["past", "archived"].includes(item.status));

  return (
    <PublicShell announcements={announcements} showTicker>
      <main id="main">
        <section className="home-hero wrap">
          <div className="hero-copy">
            <p className="edition">CSS / Department Dispatch / {content.currentAcademicYear}</p>
            <h1>{content.heroHeadline}</h1>
            <p className="hero-deck">{content.heroDescription}</p>
            <div className="hero-actions"><Link className="solid-link large" href="/events">See what’s on</Link><Link className="under-link" href="/team">Meet {members.length} members</Link></div>
            <dl className="hero-facts"><div><dt>Founded</dt><dd>2023</dd></div><div><dt>Current team</dt><dd>{members.length}</dd></div><div><dt>Next event</dt><dd>{featured ? formatDate(featured.date) : "To be announced"}</dd></div></dl>
          </div>
          {featured && <div className="hero-art" aria-label="Featured event poster"><div className="poster-stack back-one" /><div className="poster-stack back-two" /><Link className="feature-poster" href={`/events/${featured.slug}`}><div className="feature-number">04</div><div className="feature-meta">Upcoming / {featured.category}<br />{featured.date.replaceAll("-", ".")}</div><div className="feature-title">{featured.title.split(" ").map((word, index) => <span className={index === 1 ? "outline" : ""} key={`${word}-${index}`}>{word}</span>)}</div><p>{featured.shortDescription}</p><div className="feature-bottom"><span>{featured.startTime}</span><span>{featured.venue}</span><b>{featured.registrationOpen ? "Register" : "Details"} ↗</b></div></Link></div>}
        </section>

        <section className="weekly wrap"><div className="weekly-label"><span>Now / Next</span><strong>Department calendar</strong></div><div className="weekly-list">{upcoming.slice(0, 4).map((item) => <Link href={`/events/${item.slug}`} className="week-item" key={item.id}><span>{formatDate(item.date).replace(/ \d{4}$/, "")}</span><strong>{item.title}</strong><em>{item.category}</em><b>↗</b></Link>)}</div></section>

        <section className="editorial-section wrap" id="about">
          <SectionHeader index="01" kicker="What CSS is" title="Not a brand statement. A working arrangement." copy="The society exists to make the department easier to enter, navigate, and contribute to." />
          <div className="principles"><article><span>A</span><h3>Useful before impressive.</h3><p>We prioritise sessions, tools, and resources students can actually use the next day.</p></article><article><span>B</span><h3>Open across batches.</h3><p>First-years, seniors, faculty, and alumni should be able to meet without the usual distance.</p></article><article><span>C</span><h3>Document the work.</h3><p>Events, projects, previous committees, and lessons learned stay available instead of disappearing every year.</p></article></div>
        </section>

        <section className="editorial-section wrap" id="events">
          <SectionHeader index="02" kicker="Events" title="A poster wall, not a row of product cards." copy="Upcoming events are given distinct identities while the calendar remains easy to scan." />
          <div className="poster-wall">{events.slice(0, 4).map((item) => <EventPosterCard event={item} key={item.id} />)}</div>
          <div className="section-cta"><Link href="/events">Open the full event calendar <span>↗</span></Link></div>
        </section>

        <section className="split-section wrap" id="projects">
          <div className="project-feature reveal"><p className="kicker">Project Desk / 01</p><h2>Build things the department keeps.</h2><p>Small internal tools, open-source contributions, guides, visual systems, and experiments that outlive one event.</p><Link href="/projects" className="under-link">Open the project desk</Link><div className="project-window"><div className="window-bar"><i /><i /><i /><span>css-lab / current</span></div><pre>{projects.slice(0, 4).map((item, index) => `${String(index + 1).padStart(2, "0")}  ${item.title.toLowerCase()}`).join("\n")}</pre></div></div>
          <div className="resources-panel reveal" id="resources"><p className="kicker">Student Desk / Week 32</p><h2>Things worth knowing now.</h2><div className="resource-list">{resources.slice(0, 4).map((item) => <Link href="/resources" key={item.id}><span>{resourceCategoryLabel(item.category)}</span><strong>{item.title}</strong><em>{item.meta}</em></Link>)}</div></div>
        </section>

        <section className="editorial-section wrap" id="team">
          <SectionHeader index="03" kicker="People" title="A roster with structure—and memory." copy="The current committee is organised by responsibility, while former teams stay searchable by year." />
          <div className="people-layout"><div className="people-summary"><strong>{members.length}</strong><span>current members</span><p>Six working groups. One shared calendar. Clear ownership without hiding the people doing the work.</p><Link className="solid-link" href="/team">Open the directory</Link></div><div className="group-directory">{departments.map(([name, count, color], index) => <Link className="group-row reveal" href="/team" style={{ "--group": color } as React.CSSProperties} key={name}><span>{String(index + 1).padStart(2, "0")}</span><strong>{name}</strong><em>{count} people</em><b>↗</b></Link>)}</div></div>
          <div className="archive-strip"><div><span>2025-26</span><strong>32 members</strong></div><div><span>2024-25</span><strong>28 members</strong></div><div><span>2023-24</span><strong>Founding committee</strong></div><Link href="/team?year=2025-26">Previous teams ↗</Link></div>
        </section>

        <section className="faculty-home wrap"><div><p className="kicker">Faculty / Continuity</p><h2>The department remains visible in the society.</h2><p>Faculty coordinators support continuity, academic alignment, and the institutional memory student teams cannot carry alone.</p><Link className="under-link" href="/team#faculty">See faculty guidance</Link></div><div className="faculty-cards"><article><span>01</span><strong>Faculty Coordinator</strong><p>Department of Computer Science and Engineering</p></article><article><span>02</span><strong>Faculty Mentor</strong><p>Department of Computer Science and Engineering</p></article></div></section>

        <section className="editorial-section wrap" id="achievements"><SectionHeader index="04" kicker="Record" title="Work worth remembering—and finding later." copy="Milestones, student support, technical learning, and community work stay in a public timeline." /><div className="achievement-preview">{achievements.slice(0, 3).map((item, index) => <Link href="/achievements" className="reveal" key={item.id}><span>{item.year}</span><b>{String(index + 1).padStart(2, "0")}</b><strong>{item.title}</strong><em>{item.category}</em></Link>)}</div><div className="section-cta"><Link href="/achievements">Open the complete record <span>↗</span></Link></div></section>

        <section className="editorial-section wrap" id="gallery"><SectionHeader index="05" kicker="Contact sheet" title="The department, as it actually happens." copy="Replace these graphic placeholders with real event photographs—the layout is designed around candid documentation, not stock imagery." /><div className="contact-sheet">{["Workshop / 01", "Build Night / 02", "Faculty Talk / 03", "CSE Labs / 04", "Community / 05", "After Event / 06"].map((label, index) => <figure className={`photo-slot slot-${index + 1} reveal`} key={label}><div><span>{String(index + 1).padStart(2, "0")}</span><b>{index % 2 ? "CSE / NITDGP" : "CSS / 2026"}</b></div><figcaption>{label}</figcaption></figure>)}</div></section>

        <section className="join-block wrap" id="contact"><div><p className="kicker">{content.recruitmentOpen ? "Open call" : "Contact"}</p><h2>{content.recruitmentOpen ? "There is room for one more useful idea." : "Bring the next useful idea."}</h2><p>{content.recruitmentText}</p></div><div><Link className="solid-link large" href="/team#recruitment">{content.recruitmentOpen ? "Join CSS" : "Meet the team"}</Link><a className="under-link" href="https://cssnitdgp.in" target="_blank" rel="noreferrer">cssnitdgp.in</a></div></section>
      </main>
    </PublicShell>
  );
}
