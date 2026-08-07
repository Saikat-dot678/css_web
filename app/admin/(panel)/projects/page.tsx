import { AdminHeader } from "@/components/admin/AdminHeader";
import { ProjectCreateForm, ProjectEditForm } from "@/components/admin/EntityEditors";
import { getSiteContent } from "@/lib/repositories/content";
import { getProjects } from "@/lib/repositories/projects";

export default async function AdminProjectsPage() {
  const [projects, content] = await Promise.all([getProjects(), getSiteContent()]);
  return <><AdminHeader title="Projects" description="Publish the society project desk and contributor status." /><main className="admin-content"><div className="admin-columns"><section className="admin-panel"><div className="panel-head"><h2>Project index</h2><span>{projects.length} entries</span></div><div className="management-list">{projects.map((project, index) => <article key={project.id}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{project.title}</strong><em>{project.status} · {project.technologies.join(" / ")}</em><p>{project.description}</p><ProjectEditForm project={project} /></div></article>)}</div></section><aside className="admin-panel"><div className="panel-head"><h2>Add project</h2></div><ProjectCreateForm academicYear={content.currentAcademicYear} /></aside></div></main></>;
}
