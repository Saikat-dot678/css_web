import Link from "next/link";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { FacultyCreateForm, FacultyEditForm, MemberCreateForm, MemberEditForm } from "@/components/admin/EntityEditors";
import { getSiteContent } from "@/lib/repositories/content";
import { getFaculty, getMembers } from "@/lib/repositories/members";
import { academicGroupLabel } from "@/lib/utils";

const initials = (name: string) => name.split(" ").map((part) => part[0]).join("").slice(0, 2);

export default async function AdminTeamPage({ searchParams }: { searchParams: Promise<{ year?: string }> }) {
  const [{ year }, content, allMembers, faculty] = await Promise.all([searchParams, getSiteContent(), getMembers(), getFaculty()]);
  const years = [...new Set([content.currentAcademicYear, ...allMembers.map((member) => member.academicYear)])].sort().reverse();
  const selectedYear = years.includes(year ?? "") ? year! : content.currentAcademicYear;
  const members = allMembers.filter((member) => member.academicYear === selectedYear);

  return <>
    <AdminHeader title="Team" description="Manage student committee rosters and faculty advisors." actions={<div className="year-switch">{years.map((item) => <Link className={item === selectedYear ? "active" : ""} href={`/admin/team?year=${item}`} key={item}>{item}</Link>)}</div>} />
    <main className="admin-content">
      <div className="admin-columns">
        <section className="admin-panel">
          <div className="panel-head"><h2>{selectedYear} roster</h2><span>{members.length} members</span></div>
          <div className="roster-admin">{members.map((member) => <article key={member.id}><span>{initials(member.name)}</span><div><strong>{member.name}</strong><em>{academicGroupLabel(member.academicGroup)} · {member.role}</em><MemberEditForm member={member} /></div></article>)}</div>
          {!members.length && <div className="empty-state"><strong>No members</strong><p>Add the first member for this committee year.</p></div>}
        </section>
        <aside className="admin-panel"><div className="panel-head"><h2>Add member</h2></div><MemberCreateForm academicYear={selectedYear} /></aside>
      </div>

      <div className="admin-columns">
        <section className="admin-panel">
          <div className="panel-head"><h2>Faculty advisors</h2><span>{faculty.length} faculty</span></div>
          <div className="roster-admin">{faculty.map((advisor) => <article key={advisor.id}><span>{initials(advisor.name)}</span><div><strong>{advisor.name}</strong><em>{advisor.role} · {advisor.department}</em><FacultyEditForm faculty={advisor} /></div></article>)}</div>
          {!faculty.length && <div className="empty-state"><strong>No faculty advisors</strong><p>Add the first faculty advisor shown on the public site.</p></div>}
        </section>
        <aside className="admin-panel"><div className="panel-head"><h2>Add faculty</h2></div><FacultyCreateForm /></aside>
      </div>
    </main>
  </>;
}
