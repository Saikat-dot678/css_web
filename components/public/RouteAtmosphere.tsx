"use client";

import { usePathname } from "next/navigation";

function routeKind(pathname: string) {
  if (pathname.startsWith("/events")) return "events";
  if (pathname.startsWith("/archive")) return "archive";
  if (pathname.startsWith("/projects")) return "projects";
  if (pathname.startsWith("/team")) return "team";
  if (pathname.startsWith("/resources")) return "resources";
  if (pathname.startsWith("/achievements")) return "achievements";
  return "home";
}

const labels: Record<string, [string, string, string]> = {
  events: ["EVENTS", "LIVE / CALENDAR", "EV"],
  archive: ["ARCHIVE", "DATE / RECORD", "AR"],
  projects: ["PROJECTS", "BUILD / KEEP", "PR"],
  team: ["TEAM", "PEOPLE / NETWORK", "TM"],
  resources: ["RESOURCES", "STUDENT / DESK", "RS"],
  achievements: ["RECORD", "MILESTONES", "AC"],
};

export function RouteAtmosphere() {
  const pathname = usePathname();
  const kind = routeKind(pathname);
  if (kind === "home") return null;
  const [title, sub, code] = labels[kind];

  return (
    <div className={`route-atmosphere route-atmosphere-${kind}`} aria-hidden="true">
      <div className="route-trace">
        <span className="route-trace-base" />
        <i className="route-trace-progress" />
        <span className="route-trace-tick tick-a" />
        <span className="route-trace-tick tick-b" />
        <span className="route-trace-tick tick-c" />
        <div className="route-trace-cursor">
          <b>CSS</b>
          <i />
        </div>
      </div>

      <div className="route-index-card">
        <span>DEPARTMENT DISPATCH</span>
        <strong>{title}</strong>
        <small>{sub}</small>
      </div>

      <div className="route-glyph">
        <span className="glyph-box box-a" />
        <span className="glyph-box box-b" />
        <span className="glyph-line line-a" />
        <span className="glyph-line line-b" />
        <i />
        <b>{code}</b>
      </div>

      <div className="route-floating-note note-one">{title}</div>
      <div className="route-floating-note note-two">23.549 / 87.291</div>
      <span className="route-coordinate">NIT DURGAPUR / CSS</span>
    </div>
  );
}
