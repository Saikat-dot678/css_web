import {
  createAchievementAction, createAnnouncementAction, createMemberAction, createProjectAction, createResourceAction,
  deleteAchievementAction, deleteAnnouncementAction, deleteMemberAction, deleteProjectAction, deleteResourceAction,
  updateAchievementAction, updateAnnouncementAction, updateMemberAction, updateProjectAction, updateResourceAction,
} from "@/app/admin/(panel)/actions";
import { academicGroupLabel, resourceCategoryLabel } from "@/lib/utils";
import type { Achievement } from "@/types/achievement";
import type { Announcement } from "@/types/content";
import type { Event } from "@/types/event";
import type { Member } from "@/types/member";
import type { Project } from "@/types/project";
import type { Resource } from "@/types/resource";

const academicGroups = ["office_bearer", "third_year", "second_year", "mtech", "phd"] as const;
const projectStatuses = ["planning", "active", "completed", "archived"] as const;
const resourceCategories = ["internships", "hackathons", "research", "placements", "higher_studies", "competitive_programming", "technical_resources", "department"] as const;

function Check({ name, label, defaultChecked }: { name: string; label: string; defaultChecked?: boolean }) {
  return <label className="inline-check"><input type="checkbox" name={name} defaultChecked={defaultChecked} /> {label}</label>;
}

export function MemberFields({ member, academicYear }: { member?: Member; academicYear: string }) {
  return <>
    <div className="two"><label>Name<input name="name" required defaultValue={member?.name} /></label><label>Role / domain<input name="role" required defaultValue={member?.role} /></label></div>
    <div className="two"><label>Academic group<select name="academicGroup" required defaultValue={member?.academicGroup ?? "second_year"}>{academicGroups.map((group) => <option value={group} key={group}>{academicGroupLabel(group)}</option>)}</select></label><label>Programme<input name="programme" defaultValue={member?.programme} placeholder="B.Tech CSE" /></label></div>
    <div className="two"><label>Working group<input name="workingGroup" required defaultValue={member?.workingGroup ?? "Editorial"} /></label><label>Academic year<input name="academicYear" required pattern="\d{4}-\d{2}" defaultValue={member?.academicYear ?? academicYear} /></label></div>
    <label>Photo URL<input name="photo" defaultValue={member?.photo} placeholder="/uploads/members/photo.jpg" /></label>
    <label>Upload photo<input name="photoFile" type="file" accept="image/*" /></label>
    <div className="two"><label>LinkedIn<input type="url" name="linkedin" defaultValue={member?.linkedin} /></label><label>Instagram<input type="url" name="instagram" defaultValue={member?.instagram} /></label></div>
    <div className="two"><label>Facebook<input type="url" name="facebook" defaultValue={member?.facebook} /></label><label>GitHub<input type="url" name="github" defaultValue={member?.github} /></label></div>
    <div className="two"><label>Email<input type="email" name="email" defaultValue={member?.email} /></label><label>Research area<input name="researchArea" defaultValue={member?.researchArea} /></label></div>
    <label>Bio<textarea name="bio" defaultValue={member?.bio} /></label>
  </>;
}

export function MemberCreateForm({ academicYear }: { academicYear: string }) {
  return <form action={createMemberAction} className="admin-inline-form"><MemberFields academicYear={academicYear} /><button className="admin-primary" type="submit">Add member</button></form>;
}

export function MemberEditForm({ member }: { member: Member }) {
  return <><details className="admin-edit-details"><summary>Edit member</summary><form action={updateMemberAction} className="admin-inline-form"><input type="hidden" name="id" value={member.id} /><MemberFields member={member} academicYear={member.academicYear} /><button className="admin-primary" type="submit">Save changes</button></form></details><form action={deleteMemberAction} className="admin-list-actions"><input type="hidden" name="id" value={member.id} /><button className="danger" type="submit">Delete</button></form></>;
}

export function ProjectFields({ project, academicYear }: { project?: Project; academicYear: string }) {
  return <>
    <div className="two"><label>Title<input name="title" required defaultValue={project?.title} /></label><label>Slug<input name="slug" defaultValue={project?.slug} /></label></div>
    <label>Description<textarea name="description" required defaultValue={project?.description} /></label>
    <div className="two"><label>Status<select name="status" defaultValue={project?.status ?? "active"}>{projectStatuses.map((status) => <option value={status} key={status}>{status}</option>)}</select></label><label>Owner<input name="owner" required defaultValue={project?.owner ?? "CSS Project Desk"} /></label></div>
    <div className="two"><label>Technologies (comma separated)<input name="technologies" defaultValue={project?.technologies.join(", ")} /></label><label>Contributors (comma separated)<input name="contributors" defaultValue={project?.contributors.join(", ")} /></label></div>
    <div className="two"><label>GitHub URL<input type="url" name="githubUrl" defaultValue={project?.githubUrl} /></label><label>External URL<input type="url" name="externalUrl" defaultValue={project?.externalUrl} /></label></div>
    <div className="two"><label>Image URL<input name="image" defaultValue={project?.image} /></label><label>Academic year<input name="academicYear" required pattern="\d{4}-\d{2}" defaultValue={project?.academicYear ?? academicYear} /></label></div>
    <Check name="acceptingContributors" label="Accepting contributors" defaultChecked={project?.acceptingContributors} />
  </>;
}

export function ProjectCreateForm({ academicYear }: { academicYear: string }) { return <form action={createProjectAction} className="admin-inline-form"><ProjectFields academicYear={academicYear} /><button className="admin-primary">Add project</button></form>; }
export function ProjectEditForm({ project }: { project: Project }) { return <><details className="admin-edit-details"><summary>Edit project</summary><form action={updateProjectAction} className="admin-inline-form"><input type="hidden" name="id" value={project.id} /><ProjectFields project={project} academicYear={project.academicYear} /><button className="admin-primary">Save project</button></form></details><form action={deleteProjectAction} className="admin-list-actions"><input type="hidden" name="id" value={project.id} /><button className="danger">Delete</button></form></>; }

export function ResourceFields({ resource }: { resource?: Resource }) {
  return <>
    <div className="two"><label>Title<input name="title" required defaultValue={resource?.title} /></label><label>Category<select name="category" defaultValue={resource?.category ?? "technical_resources"}>{resourceCategories.map((category) => <option value={category} key={category}>{resourceCategoryLabel(category)}</option>)}</select></label></div>
    <label>Description<textarea name="description" required defaultValue={resource?.description} /></label>
    <label>URL<input type="url" name="url" required defaultValue={resource?.url} /></label>
    <div className="two"><label>Deadline<input type="date" name="deadline" defaultValue={resource?.deadline} /></label><label>Expiry date<input type="date" name="expiryDate" defaultValue={resource?.expiryDate} /></label></div>
    <div className="two"><label>Eligibility<input name="eligibility" defaultValue={resource?.eligibility} /></label><label>Meta / source<input name="meta" defaultValue={resource?.meta} /></label></div>
    <Check name="featured" label="Featured resource" defaultChecked={resource?.featured} />
  </>;
}
export function ResourceCreateForm() { return <form action={createResourceAction} className="admin-inline-form"><ResourceFields /><button className="admin-primary">Add resource</button></form>; }
export function ResourceEditForm({ resource }: { resource: Resource }) { return <><details className="admin-edit-details"><summary>Edit resource</summary><form action={updateResourceAction} className="admin-inline-form"><input type="hidden" name="id" value={resource.id} /><ResourceFields resource={resource} /><button className="admin-primary">Save resource</button></form></details><form action={deleteResourceAction} className="admin-list-actions"><input type="hidden" name="id" value={resource.id} /><button className="danger">Delete</button></form></>; }

export function AchievementFields({ achievement, events, members, projects }: { achievement?: Achievement; events: Event[]; members: Member[]; projects: Project[] }) {
  return <>
    <div className="two"><label>Year<input name="year" required defaultValue={achievement?.year ?? new Date().getFullYear()} /></label><label>Category<input name="category" required defaultValue={achievement?.category ?? "Competition"} /></label></div>
    <label>Title<input name="title" required defaultValue={achievement?.title} /></label><label>Description<textarea name="description" required defaultValue={achievement?.description} /></label>
    <div className="two"><label>Linked member<select name="linkedMemberId" defaultValue={achievement?.linkedMemberId ?? ""}><option value="">None</option>{members.map((member) => <option value={member.id} key={member.id}>{member.name}</option>)}</select></label><label>Linked project<select name="linkedProjectId" defaultValue={achievement?.linkedProjectId ?? ""}><option value="">None</option>{projects.map((project) => <option value={project.id} key={project.id}>{project.title}</option>)}</select></label></div>
    <label>Linked event<select name="linkedEventId" defaultValue={achievement?.linkedEventId ?? ""}><option value="">None</option>{events.map((event) => <option value={event.id} key={event.id}>{event.title}</option>)}</select></label>
    <div className="two"><label>Image URL<input name="image" defaultValue={achievement?.image} /></label><label>External URL<input type="url" name="externalUrl" defaultValue={achievement?.externalUrl} /></label></div>
  </>;
}
export function AchievementCreateForm(props: { events: Event[]; members: Member[]; projects: Project[] }) { return <form action={createAchievementAction} className="admin-inline-form"><AchievementFields {...props} /><button className="admin-primary">Add achievement</button></form>; }
export function AchievementEditForm({ achievement, ...props }: { achievement: Achievement; events: Event[]; members: Member[]; projects: Project[] }) { return <><details className="admin-edit-details"><summary>Edit achievement</summary><form action={updateAchievementAction} className="admin-inline-form"><input type="hidden" name="id" value={achievement.id} /><AchievementFields achievement={achievement} {...props} /><button className="admin-primary">Save achievement</button></form></details><form action={deleteAchievementAction} className="admin-list-actions"><input type="hidden" name="id" value={achievement.id} /><button className="danger">Delete</button></form></>; }

export function AnnouncementCreateForm() { return <form action={createAnnouncementAction} className="admin-inline-form"><label>Title<input name="title" required /></label><label>Content<textarea name="content" required /></label><div className="two"><Check name="pinned" label="Pin announcement" /><Check name="published" label="Publish now" defaultChecked /></div><button className="admin-primary">Add announcement</button></form>; }
export function AnnouncementEditForm({ announcement }: { announcement: Announcement }) { return <><details className="admin-edit-details"><summary>Edit announcement</summary><form action={updateAnnouncementAction} className="admin-inline-form"><input type="hidden" name="id" value={announcement.id} /><label>Title<input name="title" required defaultValue={announcement.title} /></label><label>Content<textarea name="content" required defaultValue={announcement.content} /></label><div className="two"><Check name="pinned" label="Pinned" defaultChecked={announcement.pinned} /><Check name="published" label="Published" defaultChecked={announcement.published} /></div><button className="admin-primary">Save announcement</button></form></details><form action={deleteAnnouncementAction} className="admin-list-actions"><input type="hidden" name="id" value={announcement.id} /><button className="danger">Delete</button></form></>; }
