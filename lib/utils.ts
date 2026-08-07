export const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export const createId = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}_${crypto.randomUUID().slice(0, 8)}`;

export const nowIso = () => new Date().toISOString();

export const formatDate = (date: string) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${date}T12:00:00`));

export const formatStatus = (status: string) =>
  status.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());

export const academicGroupLabel = (group: string) =>
  ({
    office_bearer: "Office Bearer — Final Year",
    third_year: "Third Year",
    second_year: "Second Year",
    mtech: "M.Tech",
    phd: "PhD",
  })[group] ?? group;

export const resourceCategoryLabel = (category: string) =>
  category
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
