const BASE_URL = process.env.QA_BASE_URL || "http://127.0.0.1:3000";
const failures = [];
const pass = (label) => console.info(`PASS ${label}`);
const fail = (label, detail) => failures.push(`${label}: ${detail}`);
const assert = (condition, label, detail = "assertion failed") => condition ? pass(label) : fail(label, detail);
const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const targets = await fetch("http://127.0.0.1:9222/json").then((response) => response.json());
const target = targets.find((item) => item.type === "page");
if (!target) throw new Error("No Chrome page found on debugging port 9222.");
const socket = new WebSocket(target.webSocketDebuggerUrl);
let sequence = 0;
const pending = new Map();
socket.onmessage = (event) => {
  const message = JSON.parse(event.data);
  if (!message.id) return;
  const handler = pending.get(message.id);
  if (handler) handler(message);
};
await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });

function send(method, params = {}) {
  const id = ++sequence;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, (message) => {
    pending.delete(id);
    if (message.error) reject(new Error(message.error.message));
    else resolve(message.result);
  }));
}

async function evaluate(expression) {
  const result = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
  return result.result.value;
}

async function navigate(path, settle = 250) {
  await send("Page.navigate", { url: `${BASE_URL}${path}` });
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const ready = await evaluate("document.readyState").catch(() => "loading");
    if (ready === "complete") break;
    await wait(40);
  }
  await wait(settle);
}

async function poll(expression, timeout = 5000, interval = 80) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    const value = await evaluate(expression).catch(() => null);
    if (value) return value;
    await wait(interval);
  }
  return null;
}

async function submitForm(buttonText, values = {}, scopeText = null) {
  const result = await evaluate(`(() => {
    const buttonText = ${JSON.stringify(buttonText)};
    const scopeText = ${JSON.stringify(scopeText)};
    const values = ${JSON.stringify(values)};
    const forms = [...document.querySelectorAll('form')];
    const form = forms.find((candidate) => {
      const submitter = [...candidate.querySelectorAll('button')].find((button) => (button.textContent || '').trim().includes(buttonText));
      if (!submitter) return false;
      if (!scopeText) return true;
      const scope = candidate.closest('article, tr') || candidate.parentElement;
      return Boolean(scope && (scope.innerText || '').includes(scopeText));
    });
    if (!form) return { ok: false, reason: 'form not found', buttonText, scopeText };
    for (const [name, value] of Object.entries(values)) {
      const controls = [...form.querySelectorAll('[name="' + CSS.escape(name) + '"]')];
      if (!controls.length) return { ok: false, reason: 'control not found', name, buttonText, scopeText };
      for (const control of controls) {
        if (control instanceof HTMLInputElement && (control.type === 'checkbox' || control.type === 'radio')) {
          control.checked = Array.isArray(value) ? value.map(String).includes(control.value) : Boolean(value);
        } else {
          control.value = String(value ?? '');
        }
        control.dispatchEvent(new Event('input', { bubbles: true }));
        control.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
    const submitter = [...form.querySelectorAll('button')].find((button) => (button.textContent || '').trim().includes(buttonText));
    form.requestSubmit(submitter);
    return { ok: true };
  })()`);
  assert(result.ok, `locate and submit ${buttonText}${scopeText ? ` for ${scopeText}` : ""}`, JSON.stringify(result));
  if (result.ok) await wait(450);
  return result.ok;
}

const bodyContains = (text) => `document.body.innerText.includes(${JSON.stringify(text)})`;
const bodyMissing = (text) => `!document.body.innerText.includes(${JSON.stringify(text)})`;
async function fetchText(path) {
  const response = await fetch(`${BASE_URL}${path}`, { redirect: "manual" });
  return { response, text: await response.text() };
}

await send("Page.enable");
await send("Runtime.enable");
await send("Network.enable");
await navigate("/admin");
assert(await evaluate("location.pathname === '/admin' && Boolean(document.querySelector('#main'))"), "development admin is available through the real Next runtime");

const stamp = Date.now();

// Student roster CRUD.
const memberName = `QA Member ${stamp}`;
await navigate("/admin/team");
const academicYear = await evaluate("document.querySelector('form button')?.closest('form')?.querySelector('[name=academicYear]')?.value || document.querySelector('[name=academicYear]')?.value");
assert(Boolean(academicYear), "team admin exposes current academic year");
if (academicYear) {
  await submitForm("Add member", { name: memberName, role: "Runtime QA", academicGroup: "second_year", programme: "B.Tech CSE", workingGroup: "Runtime QA", academicYear });
  assert(Boolean(await poll(bodyContains(memberName))), "member create persists and revalidates admin roster");
  await submitForm("Save changes", { role: "Runtime QA Updated" }, memberName);
  assert(Boolean(await poll(bodyContains("Runtime QA Updated"))), "member update persists and revalidates admin roster");
  const teamPublic = await fetchText("/team");
  assert(teamPublic.response.status === 200 && teamPublic.text.includes(memberName), "member create/update is visible on public team page", `status ${teamPublic.response.status}`);
  await submitForm("Delete", {}, memberName);
  assert(Boolean(await poll(bodyMissing(memberName))), "member delete persists and removes roster entry");
}

// Faculty CRUD.
const facultyName = `QA Faculty ${stamp}`;
await navigate("/admin/team");
await submitForm("Add faculty", { name: facultyName, role: "Faculty Advisor QA", department: "Computer Science and Engineering", email: `faculty.${stamp}@example.test`, bio: "Runtime QA faculty record." });
assert(Boolean(await poll(bodyContains(facultyName))), "faculty create persists and revalidates team admin");
await submitForm("Save faculty", { role: "Faculty Advisor QA Updated" }, facultyName);
assert(Boolean(await poll(bodyContains("Faculty Advisor QA Updated"))), "faculty update persists and revalidates team admin");
let publicPage = await fetchText("/team");
assert(publicPage.response.status === 200 && publicPage.text.includes(facultyName), "faculty CRUD is wired to the public team page", `status ${publicPage.response.status}`);
await submitForm("Delete", {}, facultyName);
assert(Boolean(await poll(bodyMissing(facultyName))), "faculty delete persists and removes public-admin source record");

// Project CRUD.
const projectTitle = `QA Project ${stamp}`;
await navigate("/admin/projects");
await submitForm("Add project", { title: projectTitle, slug: `qa-project-${stamp}`, description: "Runtime QA project description.", status: "active", owner: "CSS Runtime QA", technologies: "Next.js, TypeScript", contributors: "QA", academicYear: academicYear || "2026-27", acceptingContributors: true });
assert(Boolean(await poll(bodyContains(projectTitle))), "project create persists and revalidates admin index");
await submitForm("Save project", { description: "Runtime QA project description updated." }, projectTitle);
assert(Boolean(await poll(bodyContains("Runtime QA project description updated."))), "project update persists");
publicPage = await fetchText("/projects");
assert(publicPage.response.status === 200 && publicPage.text.includes(projectTitle), "project create/update is visible publicly", `status ${publicPage.response.status}`);
await submitForm("Delete", {}, projectTitle);
assert(Boolean(await poll(bodyMissing(projectTitle))), "project delete persists");

// Resource CRUD.
const resourceTitle = `QA Resource ${stamp}`;
await navigate("/admin/resources");
await submitForm("Add resource", { title: resourceTitle, category: "technical_resources", description: "Runtime QA resource description.", url: `https://example.com/runtime-qa-${stamp}`, featured: true });
assert(Boolean(await poll(bodyContains(resourceTitle))), "resource create persists and revalidates admin desk");
await submitForm("Save resource", { description: "Runtime QA resource description updated." }, resourceTitle);
assert(Boolean(await poll(bodyContains("Runtime QA resource description updated."))), "resource update persists");
publicPage = await fetchText("/resources");
assert(publicPage.response.status === 200 && publicPage.text.includes(resourceTitle), "resource create/update is visible publicly", `status ${publicPage.response.status}`);
await submitForm("Delete", {}, resourceTitle);
assert(Boolean(await poll(bodyMissing(resourceTitle))), "resource delete persists");

// Achievement CRUD.
const achievementTitle = `QA Achievement ${stamp}`;
await navigate("/admin/achievements");
await submitForm("Add achievement", { year: "2026", category: "Runtime QA", title: achievementTitle, description: "Runtime QA achievement description." });
assert(Boolean(await poll(bodyContains(achievementTitle))), "achievement create persists and revalidates record");
await submitForm("Save achievement", { description: "Runtime QA achievement description updated." }, achievementTitle);
assert(Boolean(await poll(bodyContains("Runtime QA achievement description updated."))), "achievement update persists");
publicPage = await fetchText("/achievements");
assert(publicPage.response.status === 200 && publicPage.text.includes(achievementTitle), "achievement create/update is visible publicly", `status ${publicPage.response.status}`);
await submitForm("Delete", {}, achievementTitle);
assert(Boolean(await poll(bodyMissing(achievementTitle))), "achievement delete persists");

// Homepage content update + restore, and announcement CRUD.
await navigate("/admin/content");
const originalHeadline = await evaluate("document.querySelector('[name=heroHeadline]')?.value");
assert(Boolean(originalHeadline), "homepage content editor exposes current headline");
const qaHeadline = `Runtime QA headline ${stamp}`;
if (originalHeadline) {
  await submitForm("Save homepage content", { heroHeadline: qaHeadline });
  assert(Boolean(await poll(`document.querySelector('[name=heroHeadline]')?.value === ${JSON.stringify(qaHeadline)}`)), "homepage content update persists and revalidates editor");
  publicPage = await fetchText("/");
  assert(publicPage.response.status === 200 && publicPage.text.includes(qaHeadline), "homepage content update is visible publicly", `status ${publicPage.response.status}`);
  await submitForm("Save homepage content", { heroHeadline: originalHeadline });
  assert(Boolean(await poll(`document.querySelector('[name=heroHeadline]')?.value === ${JSON.stringify(originalHeadline)}`)), "homepage content can be restored after update");
}

const announcementTitle = `QA Announcement ${stamp}`;
await submitForm("Add announcement", { title: announcementTitle, content: "Runtime QA announcement content.", published: true, pinned: true });
assert(Boolean(await poll(bodyContains(announcementTitle))), "announcement create persists and revalidates content admin");
await submitForm("Save announcement", { content: "Runtime QA announcement content updated." }, announcementTitle);
assert(Boolean(await poll(bodyContains("Runtime QA announcement content updated."))), "announcement update persists");
publicPage = await fetchText("/");
assert(publicPage.response.status === 200 && publicPage.text.includes(announcementTitle), "published announcement is visible on public home data", `status ${publicPage.response.status}`);
await submitForm("Delete", {}, announcementTitle);
assert(Boolean(await poll(bodyMissing(announcementTitle))), "announcement delete persists");

// Event CRUD + event-owned form lifecycle.
const eventTitle = `QA Event ${stamp}`;
const eventUpdatedTitle = `${eventTitle} Updated`;
const eventSlug = `qa-event-${stamp}`;
await navigate("/admin/events/new");
await submitForm("Save event", {
  title: eventTitle,
  slug: eventSlug,
  status: "upcoming",
  date: "2026-10-01",
  category: "Workshop",
  startTime: "18:00",
  venue: "CSE Seminar Hall",
  shortDescription: "Runtime QA event summary.",
  fullDescription: "Runtime QA event full description for CRUD testing.",
  entryFee: "Free",
});
assert(Boolean(await poll("location.pathname.startsWith('/admin/events/') && location.pathname.endsWith('/edit')", 6000)), "event create persists and redirects to edit page");
assert(Boolean(await poll(bodyContains(eventTitle))), "created event renders in editor");
await submitForm("Save event", { title: eventUpdatedTitle, shortDescription: "Runtime QA event summary updated." });
assert(Boolean(await poll(bodyContains(eventUpdatedTitle))), "event update persists in editor");
publicPage = await fetchText(`/events/${eventSlug}`);
assert(publicPage.response.status === 200 && publicPage.text.includes(eventUpdatedTitle), "event create/update is visible on public detail route", `status ${publicPage.response.status}`);
await navigate("/admin/events");
assert(Boolean(await poll(bodyContains(eventUpdatedTitle))), "event index reads updated event");
await submitForm("Delete", {}, eventUpdatedTitle);
assert(Boolean(await poll(bodyMissing(eventUpdatedTitle))), "event delete persists and removes admin row");
publicPage = await fetchText(`/events/${eventSlug}`);
assert(publicPage.response.status === 404, "deleted event public detail becomes 404", `status ${publicPage.response.status}`);

socket.close();
if (failures.length) {
  console.error("\nAdmin CRUD runtime QA failures:");
  for (const issue of failures) console.error(`- ${issue}`);
  process.exitCode = 1;
} else {
  console.info("\nAdmin CRUD runtime QA passed for members, faculty, projects, resources, achievements, homepage content, announcements, and events.");
}
