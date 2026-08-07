import Link from "next/link";
import Image from "next/image";
import { FacultyCard } from "@/components/team/FacultyCard";
import { MemberSection } from "@/components/team/MemberSection";
import { PublicShell } from "@/components/public/PublicShell";
import { getSiteContent } from "@/lib/repositories/content";
import { getFaculty, getMembers, getPreviousCommittees } from "@/lib/repositories/members";
import type { AcademicGroup } from "@/types/member";

export const metadata = { title: "Team" };

const years = ["2026-27", "2025-26", "2024-25", "2023-24"];

export default async function TeamPage({ searchParams }: { searchParams: Promise<{ year?: string }> }) {
  const requestedYear = (await searchParams).year;
  const [content, faculty, committees] = await Promise.all([getSiteContent(), getFaculty(), getPreviousCommittees()]);
  const selectedYear = requestedYear && years.includes(requestedYear) ? requestedYear : content.currentAcademicYear;
  const people = await getMembers(selectedYear);
  const byGroup = (group: AcademicGroup) => people.filter((member) => member.academicGroup === group);
  const office = byGroup("office_bearer");
  const third = byGroup("third_year");
  const second = byGroup("second_year");
  const mtech = byGroup("mtech");
  const phd = byGroup("phd");
  const archive = committees.find((item) => item.academicYear === selectedYear);

  return <PublicShell><main id="main">
    <section className="team-hero-new wrap"><div><p className="edition">{selectedYear === content.currentAcademicYear ? "Our Team" : "Committee Archive"} / {selectedYear}</p><h1>The people behind CSS.</h1><p>The society is run by students across B.Tech, M.Tech, and PhD programmes of the CSE Department. Final-year B.Tech students form the office-bearer committee.</p><div className="team-hero-stats"><span><b>{office.length}</b> office bearers</span><span><b>{third.length}</b> third year</span><span><b>{second.length}</b> second year</span><span><b>{mtech.length + phd.length}</b> M.Tech / PhD</span></div></div><div className="team-photo-collage">{people.slice(0, 9).map((member) => <div key={member.id}><Image src={member.photo} alt={member.name} width={420} height={420} unoptimized={member.photo.startsWith("/api/")} /></div>)}</div></section>
    <section className="team-year-bar wrap"><span>Committee year</span><nav>{years.map((year) => <Link className={year === selectedYear ? "active" : ""} href={`/team?year=${year}`} key={year}>{year}</Link>)}</nav></section>
    {archive && <section className="archive-context wrap"><p className="kicker">Contribution highlights / {archive.academicYear}</p><ul>{archive.contributionHighlights.map((highlight) => <li key={highlight}>{highlight}</li>)}</ul></section>}
    <section className="faculty-section-new wrap" id="faculty"><div className="faculty-section-head"><p className="kicker">Faculty Coordinators</p><h2>Guidance behind a student-led society.</h2></div><div className="faculty-card-grid">{faculty.map((item) => <FacultyCard faculty={item} key={item.id} />)}</div></section>
    <MemberSection kicker="Office Bearers" title="Final Year · B.Tech CSE" copy="The final-year committee responsible for overall leadership, planning, and coordination of CSS." members={office} office />
    <MemberSection kicker="Third Year" title="Third-year members" copy="Technical, design, event, outreach, content, and operational teams." members={third} />
    <MemberSection kicker="Second Year" title="Second-year members" copy="Emerging contributors working across society activities and initiatives." members={second} />
    <MemberSection kicker="Postgraduate & Research" title="M.Tech members" copy="Postgraduate members contributing technical depth, continuity, and mentorship." members={mtech} />
    <MemberSection kicker="Postgraduate & Research" title="PhD scholars" copy="Research members bringing specialist perspective and longer-term continuity." members={phd} />
    <section className="team-distribution-new wrap"><div><p className="kicker">Team distribution</p><h2>{people.length} people, clearly organised.</h2></div><div className="distribution-grid"><div><span>Office Bearers</span><strong>{office.length}</strong></div><div><span>Third Year</span><strong>{third.length}</strong></div><div><span>Second Year</span><strong>{second.length}</strong></div><div><span>M.Tech / PhD</span><strong>{mtech.length + phd.length}</strong></div><div className="total"><span>Total</span><strong>{people.length}</strong></div></div></section>
    <section className="cohort-archive wrap"><div><p className="kicker">Previous Committees</p><h2>The people who helped build CSS before us.</h2><p>Every committee remains browsable by year with the same card structure and social links.</p></div><div className="cohort-grid">{committees.map((committee, index) => <article key={committee.id}><span>{committee.academicYear}</span><strong>{committee.memberIds.length}</strong><p>{index === committees.length - 1 ? "Founding committee" : "Previous committee"}</p><Link href={`/team?year=${committee.academicYear}`}>Explore cohort ↗</Link></article>)}</div></section>
    <section className="join-block wrap" id="recruitment"><div><p className="kicker">{content.recruitmentOpen ? "Recruitment open" : "Recruitment"}</p><h2>{content.recruitmentOpen ? "See yourself in the next cohort?" : "Recruitment is currently closed."}</h2><p>{content.recruitmentText}</p></div><div><Link className="solid-link large" href="/#contact">{content.recruitmentOpen ? "Apply to CSS" : "Back to home"}</Link></div></section>
  </main></PublicShell>;
}
