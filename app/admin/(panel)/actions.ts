"use server";

import { promises as fs } from "node:fs";
import path from "node:path";
import { refresh, revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ZodError } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createAchievement, deleteAchievement, updateAchievement } from "@/lib/repositories/achievements";
import { createAnnouncement, deleteAnnouncement, getAnnouncementById, updateAnnouncement, updateSiteContent } from "@/lib/repositories/content";
import { createEvent, deleteEvent, getEventById, updateEvent } from "@/lib/repositories/events";
import { countFormResponses, createForm, deleteForm, deleteFormResponse, getFormByEventId, updateForm } from "@/lib/repositories/forms";
import { createMember, deleteMember, getMemberById, updateMember } from "@/lib/repositories/members";
import { createProject, deleteProject, updateProject } from "@/lib/repositories/projects";
import { createResource, deleteResource, updateResource } from "@/lib/repositories/resources";
import { announcementInputSchema, siteContentSchema } from "@/lib/validation/content";
import { csvList, lines } from "@/lib/validation/common";
import { slugify } from "@/lib/utils";
import type { EventSpeaker, ScheduleItem } from "@/types/event";
import type { AcademicGroup } from "@/types/member";
import type { ProjectStatus } from "@/types/project";
import type { ResourceCategory } from "@/types/resource";
import type { Announcement } from "@/types/content";

const value = (data: FormData, name: string) => String(data.get(name) || "").trim();
const checked = (data: FormData, name: string) => data.get(name) === "on";
const emptyToUndefined = (input: string) => input || undefined;

export type ContentActionState = {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Record<string, string[]>;
  announcement?: Announcement;
  deletedId?: string;
};

const validationState = (error: ZodError): ContentActionState => {
  const fieldErrors = error.flatten().fieldErrors as Record<string, string[] | undefined>;
  return {
    status: "error",
    message: error.issues[0]?.message ?? "Review the highlighted fields and try again.",
    fieldErrors: Object.fromEntries(
      Object.entries(fieldErrors).filter((entry): entry is [string, string[]] => Boolean(entry[1]?.length)),
    ),
  };
};

async function uploadedImage(data: FormData, name: string, folder: string) {
  const file = data.get(name);
  if (!(file instanceof File) || !file.size) return undefined;
  if (process.env.NODE_ENV === "production") {
    throw new Error("Direct image uploads are disabled in production until durable object storage is configured. Use a durable public image URL instead.");
  }
  const imageExtensions: Record<string, string> = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/gif": ".gif" };
  const extension = imageExtensions[file.type];
  if (!extension) throw new Error("Only JPEG, PNG, WebP, or GIF images are accepted.");
  if (file.size > 6 * 1024 * 1024) throw new Error("Images must be smaller than 6 MB.");
  const filename = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}${extension}`;
  const directory = path.join(process.cwd(), "public", "uploads", folder);
  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(path.join(directory, filename), Buffer.from(await file.arrayBuffer()));
  return `/uploads/${folder}/${filename}`;
}

const parseSpeakers = (data: FormData): EventSpeaker[] => lines(data.get("speakers")).map((line) => {
  const [name, position, organisation, linkedin] = line.split("|").map((item) => item.trim());
  return { name, position: emptyToUndefined(position), organisation: emptyToUndefined(organisation), linkedin: emptyToUndefined(linkedin) };
});

const parseSchedule = (data: FormData): ScheduleItem[] => lines(data.get("schedule")).map((line) => {
  const [time, title, description] = line.split("|").map((item) => item.trim());
  return { time, title, description: emptyToUndefined(description) };
});

async function eventInput(data: FormData, existingPoster?: string) {
  const slug = slugify(value(data, "slug") || value(data, "title"));
  const upload = await uploadedImage(data, "posterFile", "posters");
  const poster = upload || value(data, "poster") || existingPoster || `/api/posters/${slug}`;
  return {
    slug,
    title: value(data, "title"),
    poster,
    category: value(data, "category"),
    status: value(data, "status") as "draft" | "upcoming" | "registration_open" | "save_the_date" | "ongoing" | "closed" | "past" | "archived",
    date: value(data, "date"),
    startTime: value(data, "startTime"),
    endTime: emptyToUndefined(value(data, "endTime")),
    venue: value(data, "venue"),
    shortDescription: value(data, "shortDescription"),
    fullDescription: value(data, "fullDescription"),
    registrationOpen: checked(data, "registrationOpen"),
    registrationDeadline: emptyToUndefined(value(data, "registrationDeadline")),
    eligibility: emptyToUndefined(value(data, "eligibility")),
    entryFee: emptyToUndefined(value(data, "entryFee")),
    featured: checked(data, "featured"),
    speakers: parseSpeakers(data),
    schedule: parseSchedule(data),
    registrationFormId: emptyToUndefined(value(data, "registrationFormId")),
    recap: emptyToUndefined(value(data, "recap")),
    attendance: emptyToUndefined(value(data, "attendance")),
    gallery: lines(data.get("gallery")),
    resources: lines(data.get("resources")).map((line) => { const [label, url] = line.split("|").map((item) => item.trim()); return { label, url: url || "#" }; }),
    results: lines(data.get("results")).map((line) => { const [title, description] = line.split("|").map((item) => item.trim()); return { title, description: emptyToUndefined(description) }; }),
  };
}

export async function createEventAction(data: FormData) {
  await requireAdmin();
  const input = await eventInput(data);
  const created = await createEvent(input);
  try {
    const form = await createForm({
      slug: `${created.slug}-registration-${crypto.randomUUID().slice(0, 6).toLowerCase()}`,
      title: `${created.title} registration`,
      kind: "event",
      eventId: created.id,
      eventOwned: true,
      status: "published",
      submitLabel: "Submit registration",
      successTitle: "Registration received.",
      successMessage: "Your registration has been recorded.",
      fields: [],
    });
    await updateEvent(created.id, { registrationFormId: form.id });
  } catch (error) {
    await deleteEvent(created.id);
    throw error;
  }
  revalidatePath("/events");
  revalidatePath("/admin/events");
  revalidatePath("/admin/form-builder");
  redirect(`/admin/events/${created.id}/edit`);
}

export async function updateEventAction(data: FormData) {
  await requireAdmin();
  const id = value(data, "id");
  const existing = await getEventById(id);
  if (!existing) throw new Error("Event not found.");
  const input = await eventInput(data, existing.poster);
  await updateEvent(id, { ...input, registrationFormId: existing.registrationFormId });
  revalidatePath("/events");
  revalidatePath(`/events/${input.slug}`);
  revalidatePath("/admin/events");
  redirect("/admin/events");
}

export async function deleteEventAction(data: FormData) {
  await requireAdmin();
  const id = value(data, "id");
  const form = await getFormByEventId(id);
  if (form) {
    const responseCount = await countFormResponses(form.id);
    if (form.eventOwned && responseCount === 0) {
      await deleteForm(form.id);
    } else {
      await updateForm(form.id, { kind: "standalone", eventId: undefined, eventOwned: false, status: "draft" });
    }
  }
  await deleteEvent(id);
  revalidatePath("/events");
  revalidatePath("/admin/events");
  revalidatePath("/admin/form-builder");
  revalidatePath("/admin/responses");
}

const memberValues = async (data: FormData, existingPhoto?: string) => {
  const academicGroup = value(data, "academicGroup") as AcademicGroup;
  const programme = value(data, "programme") || (["office_bearer", "third_year", "second_year"].includes(academicGroup) ? "B.Tech CSE" : academicGroup === "mtech" ? "M.Tech CSE" : "PhD CSE");
  const upload = await uploadedImage(data, "photoFile", "members");
  return {
    name: value(data, "name"), photo: upload || value(data, "photo") || existingPhoto || `/api/avatars/member-${Date.now()}`,
    role: value(data, "role"), programme, academicGroup,
    workingGroup: academicGroup === "office_bearer" ? "Office bearers" : value(data, "workingGroup"),
    academicYear: value(data, "academicYear"), linkedin: emptyToUndefined(value(data, "linkedin")), instagram: emptyToUndefined(value(data, "instagram")),
    facebook: emptyToUndefined(value(data, "facebook")), github: emptyToUndefined(value(data, "github")), email: emptyToUndefined(value(data, "email")),
    researchArea: emptyToUndefined(value(data, "researchArea")), bio: emptyToUndefined(value(data, "bio")),
  };
};

export async function createMemberAction(data: FormData) { await requireAdmin(); await createMember(await memberValues(data)); revalidatePath("/team"); revalidatePath("/admin/team"); }
export async function updateMemberAction(data: FormData) { await requireAdmin(); const id = value(data, "id"); const current = await getMemberById(id); if (!current) throw new Error("Member not found."); await updateMember(id, await memberValues(data, current.photo)); revalidatePath("/team"); revalidatePath("/admin/team"); }
export async function deleteMemberAction(data: FormData) { await requireAdmin(); await deleteMember(value(data, "id")); revalidatePath("/team"); revalidatePath("/admin/team"); }

const projectValues = (data: FormData) => ({
  slug: slugify(value(data, "slug") || value(data, "title")), title: value(data, "title"), description: value(data, "description"), status: value(data, "status") as ProjectStatus,
  technologies: csvList(data.get("technologies")), contributors: csvList(data.get("contributors")), githubUrl: emptyToUndefined(value(data, "githubUrl")), externalUrl: emptyToUndefined(value(data, "externalUrl")), image: emptyToUndefined(value(data, "image")), acceptingContributors: checked(data, "acceptingContributors"), owner: value(data, "owner"), academicYear: value(data, "academicYear"),
});
export async function createProjectAction(data: FormData) { await requireAdmin(); await createProject(projectValues(data)); revalidatePath("/projects"); revalidatePath("/admin/projects"); }
export async function updateProjectAction(data: FormData) { await requireAdmin(); await updateProject(value(data, "id"), projectValues(data)); revalidatePath("/projects"); revalidatePath("/admin/projects"); }
export async function deleteProjectAction(data: FormData) { await requireAdmin(); await deleteProject(value(data, "id")); revalidatePath("/projects"); revalidatePath("/admin/projects"); }

const resourceValues = (data: FormData) => ({
  title: value(data, "title"), description: value(data, "description"), category: value(data, "category") as ResourceCategory, url: value(data, "url") || "#", deadline: emptyToUndefined(value(data, "deadline")), eligibility: emptyToUndefined(value(data, "eligibility")), featured: checked(data, "featured"), expiryDate: emptyToUndefined(value(data, "expiryDate")), meta: emptyToUndefined(value(data, "meta")),
});
export async function createResourceAction(data: FormData) { await requireAdmin(); await createResource(resourceValues(data)); revalidatePath("/resources"); revalidatePath("/admin/resources"); }
export async function updateResourceAction(data: FormData) { await requireAdmin(); await updateResource(value(data, "id"), resourceValues(data)); revalidatePath("/resources"); revalidatePath("/admin/resources"); }
export async function deleteResourceAction(data: FormData) { await requireAdmin(); await deleteResource(value(data, "id")); revalidatePath("/resources"); revalidatePath("/admin/resources"); }

const achievementValues = (data: FormData) => ({
  year: value(data, "year"), title: value(data, "title"), description: value(data, "description"), category: value(data, "category"), linkedMemberId: emptyToUndefined(value(data, "linkedMemberId")), linkedProjectId: emptyToUndefined(value(data, "linkedProjectId")), linkedEventId: emptyToUndefined(value(data, "linkedEventId")), image: emptyToUndefined(value(data, "image")), externalUrl: emptyToUndefined(value(data, "externalUrl")),
});
export async function createAchievementAction(data: FormData) { await requireAdmin(); await createAchievement(achievementValues(data)); revalidatePath("/achievements"); revalidatePath("/admin/achievements"); }
export async function updateAchievementAction(data: FormData) { await requireAdmin(); await updateAchievement(value(data, "id"), achievementValues(data)); revalidatePath("/achievements"); revalidatePath("/admin/achievements"); }
export async function deleteAchievementAction(data: FormData) { await requireAdmin(); await deleteAchievement(value(data, "id")); revalidatePath("/achievements"); revalidatePath("/admin/achievements"); }

function revalidateSiteContentSurfaces() {
  for (const path of ["/", "/team", "/admin", "/admin/content", "/admin/team", "/admin/projects"]) {
    revalidatePath(path);
  }
}

function revalidateAnnouncementSurfaces() {
  for (const path of ["/", "/events", "/archive", "/projects", "/resources", "/admin/content"]) {
    revalidatePath(path);
  }
  revalidatePath("/events/[slug]", "page");
  revalidatePath("/forms/[slug]", "page");
}

export async function updateSiteContentAction(
  _previousState: ContentActionState,
  data: FormData,
): Promise<ContentActionState> {
  await requireAdmin();
  const parsed = siteContentSchema.safeParse({
    heroHeadline: value(data, "heroHeadline"),
    heroDescription: value(data, "heroDescription"),
    recruitmentText: value(data, "recruitmentText"),
    recruitmentOpen: checked(data, "recruitmentOpen"),
    currentAcademicYear: value(data, "currentAcademicYear"),
  });
  if (!parsed.success) return validationState(parsed.error);
  await updateSiteContent(parsed.data);
  revalidateSiteContentSurfaces();
  refresh();
  return { status: "success", message: "Homepage content saved." };
}

export async function createAnnouncementAction(
  _previousState: ContentActionState,
  data: FormData,
): Promise<ContentActionState> {
  await requireAdmin();
  const parsed = announcementInputSchema.safeParse({
    title: value(data, "title"),
    content: value(data, "content"),
    pinned: checked(data, "pinned"),
    published: checked(data, "published"),
  });
  if (!parsed.success) return validationState(parsed.error);
  const announcement = await createAnnouncement(parsed.data);
  revalidateAnnouncementSurfaces();
  return { status: "success", message: "Announcement created.", announcement };
}

export async function updateAnnouncementAction(
  _previousState: ContentActionState,
  data: FormData,
): Promise<ContentActionState> {
  await requireAdmin();
  const id = value(data, "id");
  if (!id || !(await getAnnouncementById(id))) {
    return { status: "error", message: "This announcement no longer exists. Refresh the page and try again." };
  }
  const parsed = announcementInputSchema.safeParse({
    title: value(data, "title"),
    content: value(data, "content"),
    pinned: checked(data, "pinned"),
    published: checked(data, "published"),
  });
  if (!parsed.success) return validationState(parsed.error);
  const announcement = await updateAnnouncement(id, parsed.data);
  revalidateAnnouncementSurfaces();
  return { status: "success", message: "Announcement saved.", announcement };
}

export async function deleteAnnouncementAction(
  _previousState: ContentActionState,
  data: FormData,
): Promise<ContentActionState> {
  await requireAdmin();
  const removed = await deleteAnnouncement(value(data, "id"));
  if (!removed) return { status: "error", message: "This announcement was already removed." };
  revalidateAnnouncementSurfaces();
  return { status: "success", message: "Announcement deleted.", deletedId: value(data, "id") };
}
export async function deleteRegistrationAction(data: FormData) { await requireAdmin(); await deleteFormResponse(value(data, "id")); revalidatePath("/admin/responses"); }
