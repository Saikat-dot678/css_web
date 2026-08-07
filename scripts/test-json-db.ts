import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import path from "node:path";
import { JsonDatabase } from "../lib/db/json-db";
import type { Achievement } from "../types/achievement";
import type { DatabaseShape } from "../types/database";
import type { Event } from "../types/event";
import type { Registration } from "../types/forms";
import type { Member } from "../types/member";
import type { Project } from "../types/project";
import type { Resource } from "../types/resource";

const sourcePath = path.join(process.cwd(), "data", "db.json");
const testPath = path.join(process.cwd(), "data", ".db-persistence-test.json");

async function main() {
  const source = JSON.parse(await fs.readFile(sourcePath, "utf8")) as DatabaseShape;
  await fs.copyFile(sourcePath, testPath);
  const database = new JsonDatabase(testPath);
  const timestamp = new Date().toISOString();
  const fixtures = [
    ["events", { ...source.events[0], id: "test-event", slug: "test-event", title: "Persistence test", createdAt: timestamp, updatedAt: timestamp } satisfies Event],
    ["members", { ...source.members[0], id: "test-member", name: "Persistence Member", createdAt: timestamp, updatedAt: timestamp } satisfies Member],
    ["projects", { ...source.projects[0], id: "test-project", slug: "test-project", title: "Persistence Project", createdAt: timestamp, updatedAt: timestamp } satisfies Project],
    ["resources", { ...source.resources[0], id: "test-resource", title: "Persistence Resource", createdAt: timestamp, updatedAt: timestamp } satisfies Resource],
    ["achievements", { ...source.achievements[0], id: "test-achievement", title: "Persistence Achievement", createdAt: timestamp, updatedAt: timestamp } satisfies Achievement],
    ["registrations", { ...source.registrations[0], id: "test-registration", name: "Persistence Registrant", createdAt: timestamp, updatedAt: timestamp, submittedAt: timestamp } satisfies Registration],
  ] as const;

  await Promise.all(fixtures.map(([collection, entity]) => database.insert(collection, entity)));
  for (const [collection, entity] of fixtures) {
    await database.update(collection, entity.id, { ...entity, updatedAt: new Date().toISOString() });
  }
  const event = fixtures[0][1];
  const member = fixtures[1][1];
  const project = fixtures[2][1];
  const resource = fixtures[3][1];
  const achievement = fixtures[4][1];
  await Promise.all([
    database.update("events", event.id, { ...event, title: "Persistence test updated", updatedAt: new Date().toISOString() }),
    database.update("members", member.id, { ...member, name: "Persistence Member updated", updatedAt: new Date().toISOString() }),
    database.update("projects", project.id, { ...project, title: "Persistence Project updated", updatedAt: new Date().toISOString() }),
    database.update("resources", resource.id, { ...resource, title: "Persistence Resource updated", updatedAt: new Date().toISOString() }),
    database.update("achievements", achievement.id, { ...achievement, title: "Persistence Achievement updated", updatedAt: new Date().toISOString() }),
  ]);

  // A fresh adapter simulates a Node server restart and must see the disk state.
  const restarted = new JsonDatabase(testPath);
  assert.equal((await restarted.findById<Event>("events", event.id))?.title, "Persistence test updated");
  assert.equal((await restarted.findById<Member>("members", member.id))?.name, "Persistence Member updated");
  assert.equal((await restarted.findById<Project>("projects", project.id))?.title, "Persistence Project updated");
  assert.equal((await restarted.findById<Resource>("resources", resource.id))?.title, "Persistence Resource updated");
  assert.equal((await restarted.findById<Achievement>("achievements", achievement.id))?.title, "Persistence Achievement updated");
  assert.ok(await restarted.findById<Registration>("registrations", fixtures[5][1].id));

  await Promise.all(fixtures.map(([collection, entity]) => restarted.remove(collection, entity.id)));
  const finalDatabase = new JsonDatabase(testPath);
  for (const [collection, entity] of fixtures) assert.equal(await finalDatabase.findById(collection, entity.id), null);
  console.info("JSON CRUD, serialized writes, registration persistence, restart reads, and deletes passed.");
}

main()
  .finally(() => fs.rm(testPath, { force: true }))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
