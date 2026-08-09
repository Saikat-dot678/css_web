import Link from "next/link";
import { PublicShell } from "@/components/public/PublicShell";
import { V4PageHero } from "@/components/public/V4PageHero";
import { getAnnouncements } from "@/lib/repositories/content";
import { getProjects } from "@/lib/repositories/projects";
import { formatStatus } from "@/lib/utils";

export const metadata = { title: "Projects" };

export default async function ProjectsPage() {
  const [projects, announcements] = await Promise.all([getProjects(), getAnnouncements(true)]);
  const featured = projects[0];
  const active = projects.filter((project) => project.status === "active").length;
  const open = projects.filter((project) => project.acceptingContributors).length;

  return (
    <PublicShell announcements={announcements} showTicker>
      <main id="main" className="v4-page v4-projects-page">
        <V4PageHero
          index="04"
          eyebrow="PROJECT DESK / BUILD SYSTEM"
          title="Build things the department keeps."
          copy="Projects are documented as living systems: what they solve, who owns them, what stack they use, and where another student can contribute."
          meta={[`${projects.length} PROJECTS`, `${active} ACTIVE`, `${open} OPEN TO CONTRIBUTORS`]}
        >
          <div className="v4-project-cube" aria-hidden="true">
            <div className="cube-face face-a">BUILD</div><div className="cube-face face-b">SHIP</div><div className="cube-face face-c">KEEP</div>
            <span>PROJECT / OBJECT_04</span>
          </div>
        </V4PageHero>

        {featured && <section className="project-lead wrap reveal"><div><p className="kicker">Current / {formatStatus(featured.status)}</p><h2>{featured.title}</h2><p>{featured.description}</p><dl><div><dt>Owner</dt><dd>{featured.owner}</dd></div><div><dt>Cycle</dt><dd>{featured.academicYear}</dd></div><div><dt>Contributors</dt><dd>{featured.acceptingContributors ? "Open" : "Closed"}</dd></div></dl><Link className="solid-link" href="/team#recruitment">Join a working group</Link></div><div className="project-blueprint" data-parallax="0.04"><span>01 / Working file</span><strong>{featured.title}</strong><pre>STATUS  {formatStatus(featured.status).toUpperCase()}<br />OWNER   {featured.owner.toUpperCase()}<br />STACK   {featured.technologies.join(" / ").toUpperCase()}<br />NEXT    DOCUMENT · BUILD · REVIEW</pre></div></section>}

        <section className="project-index wrap"><div className="project-index-head"><span>No.</span><span>Project</span><span>Status</span><span>Owner</span><span>Contributors</span></div>{projects.map((project, index) => <article className="project-row reveal" id={project.slug} key={project.id}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{project.title}</strong><p>{project.description}</p><em>{project.technologies.join(" · ")}</em>{(project.githubUrl || project.externalUrl) && <div className="project-row-actions">{project.githubUrl && <a href={project.githubUrl} target="_blank" rel="noreferrer">Repository ↗</a>}{project.externalUrl && <a href={project.externalUrl} target="_blank" rel="noreferrer">Visit ↗</a>}</div>}</div><b>{formatStatus(project.status)}</b><span>{project.owner}</span><span className={project.acceptingContributors ? "open" : "closed"}>{project.acceptingContributors ? "Accepting" : "Not open"}</span></article>)}</section>

        <section className="project-principles wrap"><article className="reveal"><span>A</span><h3>Useful first.</h3><p>Internal tools and guides should solve a department problem before they try to impress anyone.</p></article><article className="reveal"><span>B</span><h3>Documented.</h3><p>Decisions, contributors, setup, and handover notes remain available to the next committee.</p></article><article className="reveal"><span>C</span><h3>Open to contribution.</h3><p>Projects clearly state where a new member can help and who currently owns the work.</p></article></section>
      </main>
    </PublicShell>
  );
}
