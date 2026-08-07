import Link from "next/link";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { eventPhase } from "@/lib/events";
import { getAchievements } from "@/lib/repositories/achievements";
import { getEvents } from "@/lib/repositories/events";
import { getRegistrations } from "@/lib/repositories/forms";
import { getMembers } from "@/lib/repositories/members";
import { getProjects } from "@/lib/repositories/projects";
import { getResources } from "@/lib/repositories/resources";
import { getSiteContent } from "@/lib/repositories/content";
import { formatDate, formatStatus } from "@/lib/utils";

export default async function AdminDashboardPage() {
  const [events, registrations, projects, resources, achievements, content] = await Promise.all([getEvents(), getRegistrations(), getProjects(), getResources(), getAchievements(), getSiteContent()]);
  const members = await getMembers(content.currentAcademicYear);
  const next = events.find((event) => eventPhase(event) !== "Past");
  const stats = [
    ["Events", events.length, `${events.filter((event) => event.registrationOpen).length} collecting registrations`],
    ["Responses", registrations.length, "across published events"],
    ["Projects", projects.length, `${projects.filter((project) => project.acceptingContributors).length} accepting contributors`],
    ["Resources", resources.length, "student desk entries"],
    ["Current team", members.length, "six working groups"],
    ["Achievements", achievements.length, "recorded items"],
  ] as const;
  return <><AdminHeader title="Dashboard" description="A practical control room for the society website." /><main className="admin-content"><div className="admin-stats six">{stats.map(([label, count, detail]) => <article key={label}><span>{label}</span><strong>{count}</strong><em>{detail}</em></article>)}</div><div className="admin-columns"><section className="admin-panel"><div className="panel-head"><h2>Publishing queue</h2><Link href="/admin/events">Manage events</Link></div>{events.filter((event) => eventPhase(event) !== "Past").slice(0, 5).map((event) => <div className="queue-row" key={event.id}><div><strong>{event.title}</strong><span>{formatDate(event.date)} · {event.venue}</span></div><span className="admin-status">{formatStatus(event.status)}</span></div>)}</section><section className="admin-panel"><div className="panel-head"><h2>Quick actions</h2></div><Link className="admin-action" href="/admin/events/new">Create an event <b>↗</b></Link><Link className="admin-action" href={`/admin/form-builder${next ? `?event=${next.id}` : ""}`}>Edit registration form <b>↗</b></Link><Link className="admin-action" href="/admin/projects">Update projects <b>↗</b></Link><Link className="admin-action" href="/admin/resources">Publish a resource <b>↗</b></Link><Link className="admin-action" href="/admin/team">Update team roster <b>↗</b></Link><Link className="admin-action" href="/admin/content">Edit noticeboard <b>↗</b></Link></section></div></main></>;
}
