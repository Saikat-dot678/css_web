import { AdminHeader } from "@/components/admin/AdminHeader";
import { AchievementCreateForm, AchievementEditForm } from "@/components/admin/EntityEditors";
import { getAchievements } from "@/lib/repositories/achievements";
import { getEvents } from "@/lib/repositories/events";
import { getMembers } from "@/lib/repositories/members";
import { getProjects } from "@/lib/repositories/projects";

export default async function AdminAchievementsPage() {
  const [achievements, events, members, projects] = await Promise.all([getAchievements(), getEvents(), getMembers(), getProjects()]);
  const relations = { events, members, projects };
  return <><AdminHeader title="Achievements" description="Edit the society record and connect entries to people, projects and events." /><main className="admin-content"><div className="admin-columns"><section className="admin-panel"><div className="panel-head"><h2>Recorded achievements</h2><span>{achievements.length} entries</span></div><div className="management-list">{achievements.map((achievement, index) => <article key={achievement.id}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{achievement.title}</strong><em>{achievement.year} · {achievement.category}</em><p>{achievement.description}</p><AchievementEditForm achievement={achievement} {...relations} /></div></article>)}</div></section><aside className="admin-panel"><div className="panel-head"><h2>Add achievement</h2></div><AchievementCreateForm {...relations} /></aside></div></main></>;
}
