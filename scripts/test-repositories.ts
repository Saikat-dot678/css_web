import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { DatabaseAdapter } from "../lib/db/adapter";
import { JsonDatabase } from "../lib/db/json-db";
import { createAchievement, deleteAchievement, getAchievementById, updateAchievement } from "../lib/repositories/achievements";
import { createAnnouncement, deleteAnnouncement, getAnnouncementById, getSiteContent, updateAnnouncement, updateSiteContent } from "../lib/repositories/content";
import { createEvent, deleteEvent, getEventById, updateEvent } from "../lib/repositories/events";
import { createFaculty, createMember, deleteFaculty, deleteMember, getFacultyById, getMemberById, updateFaculty, updateMember } from "../lib/repositories/members";
import { createProject, deleteProject, getProjectById, updateProject } from "../lib/repositories/projects";
import { createResource, deleteResource, getResourceById, updateResource } from "../lib/repositories/resources";
import type { DatabaseShape } from "../types/database";

type EntityMeta = { id: string; createdAt: string; updatedAt: string };

function withoutMeta<T extends EntityMeta>(value: T): Omit<T, keyof EntityMeta> {
  const copy = structuredClone(value) as Partial<T>;
  delete copy.id;
  delete copy.createdAt;
  delete copy.updatedAt;
  return copy as Omit<T, keyof EntityMeta>;
}

async function main() {
  const sourcePath = path.join(process.cwd(), "data", "db.json");
  const testPath = path.join(process.cwd(), "data", ".repositories-test.json");
  await fs.copyFile(sourcePath, testPath);
  const source = JSON.parse(await fs.readFile(sourcePath, "utf8")) as DatabaseShape;
  const database = new JsonDatabase(testPath);
  const globals = globalThis as typeof globalThis & { cssDatabase?: DatabaseAdapter };
  globals.cssDatabase = database;

  try {
    const eventSeed = source.events[0];
    const memberSeed = source.members[0];
    const facultySeed = source.faculty[0];
    const projectSeed = source.projects[0];
    const resourceSeed = source.resources[0];
    const achievementSeed = source.achievements[0];
    const announcementSeed = source.announcements[0];
    assert.ok(eventSeed && memberSeed && facultySeed && projectSeed && resourceSeed && achievementSeed && announcementSeed, "seed database must contain fixtures for repository CRUD tests");

    const suffix = crypto.randomUUID().slice(0, 6).toLowerCase();

    const event = await createEvent({ ...withoutMeta(eventSeed), slug: `qa-${eventSeed.slug}-${suffix}`, title: `QA ${eventSeed.title}` });
    assert.equal((await getEventById(event.id))?.title, event.title);
    const updatedEvent = await updateEvent(event.id, { title: `${event.title} updated` });
    assert.match(updatedEvent.title, /updated$/);
    await assert.rejects(() => createEvent({ ...withoutMeta(eventSeed), slug: event.slug, title: "Duplicate event slug" }), /already uses this slug/i);

    const member = await createMember({ ...withoutMeta(memberSeed), name: `QA ${memberSeed.name}` });
    assert.equal((await getMemberById(member.id))?.name, member.name);
    const updatedMember = await updateMember(member.id, { role: `${member.role} QA` });
    assert.match(updatedMember.role, /QA$/);

    const faculty = await createFaculty({ ...withoutMeta(facultySeed), name: `QA ${facultySeed.name}` });
    assert.equal((await getFacultyById(faculty.id))?.name, faculty.name);
    const updatedFaculty = await updateFaculty(faculty.id, { role: `${faculty.role} QA` });
    assert.match(updatedFaculty.role, /QA$/);

    const project = await createProject({ ...withoutMeta(projectSeed), slug: `qa-${projectSeed.slug}-${suffix}`, title: `QA ${projectSeed.title}` });
    assert.equal((await getProjectById(project.id))?.title, project.title);
    const updatedProject = await updateProject(project.id, { description: `${project.description} Repository QA update.` });
    assert.match(updatedProject.description, /Repository QA update\.$/);
    await assert.rejects(() => createProject({ ...withoutMeta(projectSeed), slug: project.slug, title: "Duplicate project slug" }), /already uses this slug/i);

    const resource = await createResource({ ...withoutMeta(resourceSeed), title: `QA ${resourceSeed.title}` });
    assert.equal((await getResourceById(resource.id))?.title, resource.title);
    const updatedResource = await updateResource(resource.id, { description: `${resource.description} Repository QA update.` });
    assert.match(updatedResource.description, /Repository QA update\.$/);

    const achievement = await createAchievement({ ...withoutMeta(achievementSeed), title: `QA ${achievementSeed.title}` });
    assert.equal((await getAchievementById(achievement.id))?.title, achievement.title);
    const updatedAchievement = await updateAchievement(achievement.id, { description: `${achievement.description} Repository QA update.` });
    assert.match(updatedAchievement.description, /Repository QA update\.$/);

    const announcement = await createAnnouncement({ ...withoutMeta(announcementSeed), title: `QA ${announcementSeed.title}` });
    assert.equal((await getAnnouncementById(announcement.id))?.title, announcement.title);
    const updatedAnnouncement = await updateAnnouncement(announcement.id, { content: `${announcement.content} Repository QA update.` });
    assert.match(updatedAnnouncement.content, /Repository QA update\.$/);

    const siteContent = await getSiteContent();
    const updatedContent = await updateSiteContent({ ...siteContent, heroHeadline: "QA repository integration headline" });
    assert.equal((await getSiteContent()).heroHeadline, updatedContent.heroHeadline);

    for (const [remove, id] of [
      [deleteAnnouncement, announcement.id],
      [deleteAchievement, achievement.id],
      [deleteResource, resource.id],
      [deleteProject, project.id],
      [deleteFaculty, faculty.id],
      [deleteMember, member.id],
      [deleteEvent, event.id],
    ] as const) {
      assert.equal(await remove(id), true);
    }

    assert.equal(await getAnnouncementById(announcement.id), null);
    assert.equal(await getAchievementById(achievement.id), null);
    assert.equal(await getResourceById(resource.id), null);
    assert.equal(await getProjectById(project.id), null);
    assert.equal(await getFacultyById(faculty.id), null);
    assert.equal(await getMemberById(member.id), null);
    assert.equal(await getEventById(event.id), null);

    const restarted = new JsonDatabase(testPath);
    assert.equal((await restarted.getSiteContent()).heroHeadline, "QA repository integration headline");
    assert.equal(await restarted.findById("faculty", faculty.id), null);

    console.info("Repository validation, CRUD, duplicate-slug protection, faculty administration, site-content persistence, and restart reads passed.");
  } finally {
    globals.cssDatabase = undefined;
    await fs.rm(testPath, { force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
