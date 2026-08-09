
import Link from "next/link";

import { CampusMap } from "./CampusMap";
import { TechBackdrop } from "./TechBackdrop";

export function CampusIntro({
  academicYear,
  memberCount,
  nextEvent,
}: {
  academicYear: string;
  memberCount: number;
  nextEvent?: string;
}) {
  return (
    <section className="campus-story" aria-label="CSS campus introduction">
      <div className="campus-sticky">
        <TechBackdrop />

        <div className="campus-meta campus-meta-left">
          <span>CSS / NIT DURGAPUR</span>
          <span>{academicYear}</span>
        </div>
        <div className="campus-meta campus-meta-right">
          <span>23.55° N</span>
          <span>87.29° E</span>
        </div>

        <div className="campus-opening">
          <div className="campus-opening-copy">
            <p className="system-label">DEPARTMENT INTERFACE / ISSUE 04</p>
            <h1>
              Find the department.
              <br />
              Enter the community.
            </h1>
            <p>
              Computer Science Students’ Society, NIT Durgapur — events, projects,
              people, resources and the department record in one place.
            </p>
          </div>

          <div className="campus-opening-status opening-status" aria-hidden="true">
            <span><i />{memberCount} ACTIVE MEMBERS</span>
            <span><i />CSE / DEPARTMENT NETWORK</span>
            <span><i />{nextEvent ? `NEXT / ${nextEvent}` : "NEXT / TBA"}</span>
          </div>
        </div>

        <article className="campus-poster-sheet" aria-hidden="true">
          <div className="poster-sheet-top">
            <span>CSE STUDENTS’ SOCIETY</span>
            <b>DEPT / 23</b>
          </div>
          <div className="poster-sheet-number">04</div>
          <div className="poster-sheet-main">
            <small>DEPARTMENT DISPATCH</small>
            <strong>CSS</strong>
            <em>ENGAGE<br />EDUCATE<br />INSPIRE</em>
          </div>
          <div className="poster-sheet-bottom">
            <span>{memberCount} MEMBERS</span>
            <span>{nextEvent ? `NEXT / ${nextEvent}` : "NEXT / TBA"}</span>
          </div>
        </article>

        <div className="ambient-chip chip-a" aria-hidden="true">
          <span>SCAN / CAMPUS</span>
          <b>LOCATE CSE</b>
        </div>
        <div className="ambient-chip chip-b" aria-hidden="true">
          <span>DISPATCH / 04</span>
          <b>FIELD NOTE</b>
        </div>
        <div className="ambient-chip chip-c" aria-hidden="true">
          <span>NETWORK</span>
          <b>ONLINE</b>
        </div>

        <div className="campus-map-board">
          <div className="map-board-shadow" aria-hidden="true" />
          <CampusMap />
          <div className="campus-map-hud" aria-hidden="true">
            <span className="hud-scan" />
            <div className="hud-top"><span>LOCATE / CAMPUS</span><b>TRACE_04</b></div>
            <div className="hud-bottom"><span>TARGET</span><b>COMPUTER SCIENCE &amp; ENGINEERING</b></div>
          </div>
        </div>

        <div className="campus-scene-label scene-label-map" aria-hidden="true">
          <span>02</span><b>NIGHT MAP / TRACE ROUTE</b>
        </div>
        <div className="campus-scene-label scene-label-lock" aria-hidden="true">
          <span>03</span><b>LOCK / CSE FOUND</b>
        </div>

        <article className="cse-focus-card" aria-hidden="true">
          <span>04 / TARGET CARD</span>
          <strong>CSE</strong>
          <small>COMPUTER SCIENCE &amp; ENGINEERING</small>
          <i>DEPARTMENT / LIVE RECORD</i>
        </article>

        <div className="society-reveal">
          <div className="society-issue-tab" aria-hidden="true">
            <span>CSS / DEPARTMENT DISPATCH</span>
            <strong>04</strong>
          </div>
          <p className="system-label">DEPARTMENT / COMMUNITY / 004</p>
          <h2>
            <span className="society-word word-computer">COMPUTER</span>
            <span className="society-word word-science">SCIENCE</span>
            <span className="society-word word-students">STUDENTS’</span>
            <span className="society-word word-society">SOCIETY</span>
          </h2>
          <div className="society-reveal-bottom">
            <p>National Institute of Technology Durgapur<br />Engage · Educate · Inspire</p>
            <div>
              <Link className="v4-button v4-button-primary" href="#about">Explore CSS <span>↓</span></Link>
              <Link className="v4-text-link" href="/events">View events ↗</Link>
            </div>
          </div>
        </div>

        <div className="scroll-cue" aria-hidden="true">
          <span>SCROLL / OPEN THE MAP</span>
          <i />
        </div>
      </div>
    </section>
  );
}
