import Link from "next/link";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { MemberCreateForm, MemberEditForm } from "@/components/admin/EntityEditors";
import { getSiteContent } from "@/lib/repositories/content";
import { getMembers } from "@/lib/repositories/members";
import { academicGroupLabel } from "@/lib/utils";

export default async function AdminTeamPage({ searchParams }: { searchParams: Promise<{ year?: string }> }) {
  const [{ year }, content, allMembers] = await Promise.all([searchParams, getSiteContent(), getMembers()]);
  const years = [...new Set([content.currentAcademicYear, ...allMembers.map((member) => member.academicYear)])].sort().reverse();
  const selectedYear = years.includes(year ?? "") ? year! : content.currentAcademicYear;
  const members = allMembers.filter((member) => member.academicYear === selectedYear);
  return <><AdminHeader title="Team" description="Manage current and previous committee rosters." actions={<div className="year-switch">{years.map((item) => <Link className={item === selectedYear ? "active" : ""} href={`/admin/team?year=${item}`} key={item}>{item}</Link>)}</div>} /><main className="admin-content"><div className="admin-columns"><section className="admin-panel"><div className="panel-head"><h2>{selectedYear} roster</h2><span>{members.length} members</span></div><div className="roster-admin">{members.map((member) => <article key={member.id}><span>{member.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}</span><div><strong>{member.name}</strong><em>{academicGroupLabel(member.academicGroup)} · {member.role}</em><MemberEditForm member={member} /></div></article>)}</div>{!members.length && <div className="empty-state"><strong>No members</strong><p>Add the first member for this committee year.</p></div>}</section><aside className="admin-panel"><div className="panel-head"><h2>Add member</h2></div><MemberCreateForm academicYear={selectedYear} /></aside></div></main></>;
}
