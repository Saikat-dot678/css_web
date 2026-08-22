import Link from "next/link";

import type { Resource } from "@/types/resource";

const labels: Record<string, string> = {
  internships: "INTERNSHIP",
  hackathons: "HACKATHON",
  research: "RESEARCH",
  placements: "PLACEMENT",
  higher_studies: "HIGHER STUDIES",
  competitive_programming: "CP",
  technical_resources: "TECHNICAL",
  department: "DEPARTMENT",
};

export function ResourceRail({ resources }: { resources: Resource[] }) {
  return (
    <div className="resource-rail">
      {resources.slice(0, 5).map((resource, index) => (
        <a className="resource-rail-row" href={resource.url} target="_blank" rel="noreferrer" key={resource.id}>
          <span>{String(index + 1).padStart(2, "0")}</span>
          <em>{labels[resource.category] ?? resource.category}</em>
          <strong>{resource.title}</strong>
          <small>{resource.meta || resource.deadline || "RESOURCE"}</small>
          <b>↗</b>
        </a>
      ))}
      <div className="resource-rail-footer">
        <p>Curated opportunities, references and department information worth keeping close.</p>
        <Link className="v4-text-link" href="/resources">Open student resources ↗</Link>
      </div>
    </div>
  );
}
