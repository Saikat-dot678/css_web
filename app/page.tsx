import Link from "next/link";

import { AchievementTimeline } from "@/components/home/AchievementTimeline";
import { CampusIntro } from "@/components/home/CampusIntro";
import { EventsShowcase } from "@/components/home/EventsShowcase";
import { GallerySection } from "@/components/home/GallerySection";
import { PeopleSection } from "@/components/home/PeopleSection";
import { ProjectsShowcase } from "@/components/home/ProjectsShowcase";
import { ResourceRail } from "@/components/home/ResourceRail";
import { SignalStrip } from "@/components/home/SignalStrip";
import { V4SectionHeader } from "@/components/home/V4SectionHeader";
import { PublicShell } from "@/components/public/PublicShell";
import { getAchievements } from "@/lib/repositories/achievements";
import { getAnnouncements, getSiteContent } from "@/lib/repositories/content";
import { getEvents } from "@/lib/repositories/events";
import { getFaculty, getMembers } from "@/lib/repositories/members";
import { getProjects } from "@/lib/repositories/projects";
import { getResources } from "@/lib/repositories/resources";

function nextEventLabel(events: Awaited<ReturnType<typeof getEvents>>) {
  const event = events.find((item) => !["past", "archived", "draft"].includes(item.status));
  return event?.title;
}

export default async function HomePage() {
  const [events, projects, resources, achievements, announcements, content, faculty] = await Promise.all([
    getEvents(),
    getProjects(),
    getResources(),
    getAchievements(),
    getAnnouncements(true),
    getSiteContent(),
    getFaculty(),
  ]);

  const members = await getMembers(content.currentAcademicYear);
  const upcoming = events.filter((event) => !["past", "archived", "draft"].includes(event.status));

  return (
    <PublicShell announcements={announcements}>
      <main id="main" className="v4-home">
        <CampusIntro
          academicYear={content.currentAcademicYear}
          memberCount={members.length}
          nextEvent={nextEventLabel(events)}
        />

        <SignalStrip announcements={announcements} />

        <div className="home-field-object" aria-hidden="true">
          <span className="home-field-ring ring-a" />
          <span className="home-field-ring ring-b" />
          <span className="home-field-axis axis-a" />
          <span className="home-field-axis axis-b" />
          <i />
          <b>CSS / SIGNAL OBJECT</b>
        </div>

        <section className="v4-section v4-section-paper v4-section-poster v4-wrap" id="about">
          <V4SectionHeader
            index="01"
            eyebrow="ABOUT / THE SOCIETY"
            title="A technical community, not another club page."
            copy="CSS connects students, faculty, projects and opportunities around the CSE department. The website should make that work visible instead of hiding it inside generic cards."
          />

          <div className="about-v4-layout">
            <div className="about-v4-statement reveal">
              <p>WE BUILD THE DEPARTMENT’S STUDENT LAYER.</p>
              <h3>
                Useful things.
                <br />
                Shared knowledge.
                <br />
                <span>Real people.</span>
              </h3>
            </div>
            <div className="about-v4-principles">
              <article className="reveal">
                <span>01</span>
                <h4>Build before branding.</h4>
                <p>Projects, tools, notes and systems should continue to be useful after an event ends.</p>
              </article>
              <article className="reveal">
                <span>02</span>
                <h4>Open across batches.</h4>
                <p>Make it easy for juniors, seniors, researchers and faculty to find each other.</p>
              </article>
              <article className="reveal">
                <span>03</span>
                <h4>Keep the memory.</h4>
                <p>Events, committees, outcomes and resources should not disappear every academic year.</p>
              </article>
            </div>
          </div>
        </section>

        <section className="v4-section v4-section-dark v4-section-night" id="events">
          <div className="v4-wrap">
            <V4SectionHeader
              index="02"
              eyebrow="EVENTS / CURRENT SIGNAL"
              title="What is happening next."
              copy="Scan the calendar quickly. Hover or focus an event to surface its poster and essential details."
            />
            <EventsShowcase events={upcoming.length ? upcoming : events} />
            <div className="v4-section-end">
              <Link className="v4-button v4-button-light" href="/events">Full event calendar ↗</Link>
            </div>
          </div>
        </section>

        <section className="v4-section v4-section-paper v4-section-poster v4-wrap" id="projects">
          <V4SectionHeader
            index="03"
            eyebrow="PROJECTS / WHAT WE BUILD"
            title="Work the department can keep."
            copy="Give projects visual weight. A CSE society should show what its members actually make, maintain and contribute to."
          />
          <ProjectsShowcase projects={projects} />
        </section>

        <section className="v4-section v4-section-grid v4-section-yellow-grid" id="resources">
          <div className="v4-wrap">
            <V4SectionHeader
              index="04"
              eyebrow="STUDENT DESK / RESOURCES"
              title="Things worth knowing now."
              copy="Opportunities and references should feel like a useful department terminal: current, scannable and direct."
            />
            <ResourceRail resources={resources} />
          </div>
        </section>

        <section className="v4-section v4-section-people v4-section-night" id="team">
          <div className="v4-wrap">
            <V4SectionHeader
              index="05"
              eyebrow="PEOPLE / STRUCTURE"
              title="The society is the people doing the work."
              copy="Keep roles and batches easy to navigate, while faculty provides continuity beyond a single committee."
            />
            <PeopleSection members={members} faculty={faculty} />
          </div>
        </section>

        <section className="v4-section v4-section-paper v4-wrap" id="achievements">
          <V4SectionHeader
            index="06"
            eyebrow="RECORD / ACHIEVEMENTS"
            title="A public memory of useful work."
            copy="Milestones should read like a record, not a trophy shelf."
          />
          <AchievementTimeline achievements={achievements} />
        </section>

        <section className="v4-section v4-section-gallery v4-section-collage" id="gallery">
          <div className="v4-wrap">
            <V4SectionHeader
              index="07"
              eyebrow="FIELD NOTES / GALLERY"
              title="Make the website impossible to confuse with a template."
              copy="Replace these placeholders with real campus, event, lab and team photography before the final launch."
            />
            <GallerySection />
          </div>
        </section>

        <section className="v4-join" id="contact">
          <div className="v4-wrap v4-join-inner">
            <p>CSS / NIT DURGAPUR / {content.currentAcademicYear}</p>
            <h2>
              BUILD
              <span>SOMETHING</span>
              WITH US.
            </h2>
            <div className="v4-join-bottom">
              <p>{content.recruitmentText}</p>
              <div>
                <Link className="v4-button v4-button-primary" href="/team#recruitment">
                  {content.recruitmentOpen ? "Join CSS ↗" : "Meet the team ↗"}
                </Link>
                <a className="v4-text-link" href="https://cssnitdgp.in" target="_blank" rel="noreferrer">
                  cssnitdgp.in ↗
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
    </PublicShell>
  );
}
