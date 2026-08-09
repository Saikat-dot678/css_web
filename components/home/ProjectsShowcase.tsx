import Image from "next/image";
import Link from "next/link";

import type { Project } from "@/types/project";

export function ProjectsShowcase({ projects }: { projects: Project[] }) {
  const shown = projects.slice(0, 3);

  return (
    <div className="projects-showcase">
      {shown.map((project, index) => (
        <article className="project-showcase-row reveal" key={project.id}>
          <div className="project-index">{String(index + 1).padStart(2, "0")}</div>
          <div className="project-copy">
            <p>{project.status.toUpperCase()} / {project.academicYear}</p>
            <h3>{project.title}</h3>
            <p>{project.description}</p>
            <div className="project-tags">
              {project.technologies.slice(0, 5).map((technology) => (
                <span key={technology}>{technology}</span>
              ))}
            </div>
            <div className="project-links">
              <Link href={`/projects#${project.slug}`}>Project desk ↗</Link>
              {project.githubUrl && <a href={project.githubUrl} target="_blank" rel="noreferrer">GitHub ↗</a>}
            </div>
          </div>
          <div className="project-visual">
            {project.image ? (
              <Image src={project.image} alt="" fill sizes="(max-width: 800px) 100vw, 42vw" unoptimized={project.image.endsWith(".svg") || project.image.startsWith("/api/")} />
            ) : (
              <div className="project-code-card" aria-hidden="true">
                <div><i /><i /><i /><span>css-lab / {String(index + 1).padStart(2, "0")}</span></div>
                <pre>{`const project = {
  title: "${project.title}",
  status: "${project.status}",
  contributors: ${project.contributors.length},
};

export default project;`}</pre>
              </div>
            )}
          </div>
        </article>
      ))}
      {!shown.length && <p className="v4-empty">Projects will appear here after they are published.</p>}
    </div>
  );
}
