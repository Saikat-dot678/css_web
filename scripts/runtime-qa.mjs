const BASE_URL = process.env.QA_BASE_URL || "http://127.0.0.1:3000";
const ADMIN_EMAIL = process.env.QA_ADMIN_EMAIL || "qa-admin@example.test";
const ADMIN_PASSWORD = process.env.QA_ADMIN_PASSWORD || "qa-only-password";
const THEME_KEY = "css-theme";
const INTRO_KEY = "css-nitdgp:laptop-intro-seen:v2";

const viewports = [
  [1920, 1080],
  [1440, 900],
  [1280, 800],
  [1024, 768],
  [768, 1024],
  [430, 932],
  [390, 844],
  [360, 800],
  [320, 700],
];

const failures = [];
const runtimeErrors = [];
const resourceErrors = [];
const pass = (label) => console.info(`PASS ${label}`);
const fail = (label, detail) => failures.push(`${label}: ${detail}`);
const assert = (condition, label, detail = "assertion failed") => condition ? pass(label) : fail(label, detail);
const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function expectStatus(path, expected, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, { redirect: "manual", ...options });
  assert(response.status === expected, `${options.method || "GET"} ${path} -> ${expected}`, `received ${response.status}`);
  return response;
}

await expectStatus("/admin", 307);
await expectStatus("/api/admin/forms", 401, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ title: "Unauthorized QA form" }),
});
await expectStatus("/api/admin/responses/export", 401);

const targets = await fetch("http://127.0.0.1:9222/json").then((response) => response.json());
const target = targets.find((item) => item.type === "page");
if (!target) throw new Error("No Chrome page found on debugging port 9222.");

const socket = new WebSocket(target.webSocketDebuggerUrl);
let sequence = 0;
const pending = new Map();
socket.onmessage = (event) => {
  const message = JSON.parse(event.data);
  if (message.id) {
    const handler = pending.get(message.id);
    if (handler) handler(message);
    return;
  }
  if (message.method === "Runtime.exceptionThrown") {
    runtimeErrors.push(message.params?.exceptionDetails?.exception?.description || message.params?.exceptionDetails?.text || "Uncaught browser exception");
  }
  if (message.method === "Runtime.consoleAPICalled" && message.params?.type === "error") {
    const text = (message.params.args || []).map((item) => item.value ?? item.description ?? "").join(" ");
    runtimeErrors.push(`console.error: ${text}`);
  }
  if (message.method === "Network.responseReceived") {
    const { response, type } = message.params;
    if (response?.status >= 400 && ["Document", "Script", "Stylesheet", "Image", "Font"].includes(type)) {
      resourceErrors.push(`${response.status} ${type} ${response.url}`);
    }
  }
};
await new Promise((resolve, reject) => {
  socket.onopen = resolve;
  socket.onerror = reject;
});

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

async function setViewport(width, height) {
  await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width < 700 });
}

async function navigate(path, settle = 220) {
  await send("Page.navigate", { url: `${BASE_URL}${path}` });
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const ready = await evaluate("document.readyState").catch(() => "loading");
    if (ready === "complete") break;
    await wait(50);
  }
  await wait(settle);
}

async function poll(expression, timeout = 2500, interval = 50) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    const value = await evaluate(expression).catch(() => null);
    if (value) return value;
    await wait(interval);
  }
  return null;
}

async function browserJson(path, method, body) {
  return evaluate(`(async () => {
    const response = await fetch(${JSON.stringify(path)}, {
      method: ${JSON.stringify(method)},
      headers: { "Content-Type": "application/json" },
      body: ${body === undefined ? "undefined" : JSON.stringify(JSON.stringify(body))},
    });
    const text = await response.text();
    let payload = null;
    try { payload = JSON.parse(text); } catch { payload = text; }
    return { status: response.status, payload };
  })()`);
}

await send("Page.enable");
await send("Runtime.enable");
await send("Network.enable");
await send("Log.enable");
await send("Page.addScriptToEvaluateOnNewDocument", { source: `
  window.__qaThemeAtFirstPaint = null;
  try {
    new PerformanceObserver((list) => {
      if (list.getEntries().some((entry) => entry.name === "first-paint")) {
        window.__qaThemeAtFirstPaint = document.documentElement.dataset.theme || null;
      }
    }).observe({ type: "paint", buffered: true });
  } catch {}
` });

await setViewport(1440, 900);
await navigate("/admin/login", 150);
const loginFormPresent = await evaluate("Boolean(document.querySelector('form input[name=\"email\"]') && document.querySelector('form input[name=\"password\"]'))");
assert(loginFormPresent, "configured production admin login is available");
await evaluate(`(() => {
  const form = document.querySelector("form");
  const email = document.querySelector('input[name="email"]');
  const password = document.querySelector('input[name="password"]');
  email.value = ${JSON.stringify(ADMIN_EMAIL)};
  password.value = ${JSON.stringify(ADMIN_PASSWORD)};
  form.requestSubmit();
  return true;
})()`);
const loggedIn = await poll("location.pathname === '/admin'", 4000);
assert(Boolean(loggedIn), "admin login succeeds with configured credentials", await evaluate("location.pathname"));

const created = await browserJson("/api/admin/forms", "POST", { title: "Runtime QA Form" });
assert(created.status === 201 && created.payload?.form?.id, "admin can create a form", `status ${created.status}`);
const formId = created.payload?.form?.id;
if (!formId) throw new Error("Runtime form creation failed; cannot continue form E2E checks.");
const formSlug = `runtime-qa-${Date.now()}`;
const fields = [
  { id: "name", type: "shortText", label: "Name", required: true, order: 0, minLength: 2, maxLength: 80 },
  { id: "email", type: "email", label: "Email", required: true, order: 1 },
  { id: "score", type: "number", label: "Score", required: true, order: 2, min: 1, max: 5, step: 1 },
  { id: "track", type: "dropdown", label: "Track", required: true, order: 3, options: ["Web", "App"] },
  { id: "skills", type: "checkbox", label: "Skills", required: false, order: 4, options: ["React", "Next.js"] },
  { id: "date", type: "date", label: "Date", required: true, order: 5 },
  { id: "time", type: "time", label: "Time", required: true, order: 6 },
  { id: "datetime", type: "dateTime", label: "Date and time", required: true, order: 7 },
  { id: "portfolio", type: "url", label: "Portfolio", required: false, order: 8 },
  { id: "resume", type: "file", label: "Resume", required: false, order: 9, allowedFileTypes: ["application/pdf"], maxFileSizeMb: 1 },
  { id: "consent", type: "consent", label: "Consent", required: true, order: 10 },
  { id: "section", type: "sectionHeading", label: "Additional information", required: false, order: 11 },
  { id: "info", type: "information", label: "Information", helperText: "Runtime QA information block", required: false, order: 12 },
  { id: "divider", type: "divider", label: "Divider", required: false, order: 13 },
];
const published = await browserJson(`/api/admin/forms/${formId}`, "PUT", {
  slug: formSlug,
  title: "Runtime QA Form",
  description: "Temporary CI-only public form used for end-to-end validation.",
  kind: "standalone",
  status: "published",
  submitLabel: "Send QA response",
  successTitle: "QA response received",
  successMessage: "Temporary response saved.",
  responseLimit: 10,
  fields,
});
assert(published.status === 200 && published.payload?.form?.slug === formSlug, "admin can edit and publish a standalone form", `status ${published.status}`);

const duplicate = await browserJson("/api/admin/forms", "POST", { title: "Runtime QA Duplicate" });
assert(duplicate.status === 201 && duplicate.payload?.form?.id, "admin can create second draft form");
if (duplicate.payload?.form?.id) {
  const duplicateSlug = await browserJson(`/api/admin/forms/${duplicate.payload.form.id}`, "PUT", { slug: formSlug });
  assert(duplicateSlug.status === 422, "duplicate form slug is rejected server-side", `status ${duplicateSlug.status}`);
  const duplicateDelete = await browserJson(`/api/admin/forms/${duplicate.payload.form.id}`, "DELETE");
  assert(duplicateDelete.status === 200, "response-free draft form can be deleted", `status ${duplicateDelete.status}`);
}

const publicFormPage = await fetch(`${BASE_URL}/forms/${formSlug}`);
const publicFormHtml = await publicFormPage.text();
assert(publicFormPage.status === 200 && publicFormHtml.includes("Runtime QA Form"), "published standalone form renders publicly", `status ${publicFormPage.status}`);

function validSubmission() {
  const data = new FormData();
  data.set("name", "QA Student");
  data.set("email", "qa.student@example.test");
  data.set("score", "3");
  data.set("track", "Web");
  data.append("skills", "React");
  data.append("skills", "Next.js");
  data.set("date", "2026-09-05");
  data.set("time", "11:30");
  data.set("datetime", "2026-09-05T11:30");
  data.set("portfolio", "https://example.com/portfolio");
  data.set("consent", "Yes");
  return data;
}

const missing = new FormData();
missing.set("email", "qa.student@example.test");
let submission = await fetch(`${BASE_URL}/api/forms/${formSlug}/responses`, { method: "POST", body: missing });
assert(submission.status === 422, "required fields are rejected server-side", `status ${submission.status}`);

const invalidEmail = validSubmission();
invalidEmail.set("email", "not-an-email");
submission = await fetch(`${BASE_URL}/api/forms/${formSlug}/responses`, { method: "POST", body: invalidEmail });
assert(submission.status === 422, "invalid email is rejected server-side", `status ${submission.status}`);

const invalidChoice = validSubmission();
invalidChoice.set("track", "Secret track");
submission = await fetch(`${BASE_URL}/api/forms/${formSlug}/responses`, { method: "POST", body: invalidChoice });
assert(submission.status === 422, "invalid option value is rejected server-side", `status ${submission.status}`);

const uploadAttempt = validSubmission();
uploadAttempt.set("resume", new File(["runtime qa"], "resume.pdf", { type: "application/pdf" }));
submission = await fetch(`${BASE_URL}/api/forms/${formSlug}/responses`, { method: "POST", body: uploadAttempt });
assert(submission.status === 503, "production file form reports unavailable durable storage cleanly", `status ${submission.status}`);

submission = await fetch(`${BASE_URL}/api/forms/${formSlug}/responses`, { method: "POST", body: validSubmission() });
assert(submission.status === 201, "valid standalone form submission persists", `status ${submission.status}`);

const exportResult = await evaluate(`(async () => {
  const response = await fetch(${JSON.stringify(`/api/admin/responses/export?form=${formId}`)});
  return { status: response.status, text: await response.text() };
})()`);
assert(exportResult.status === 200, "authenticated response CSV export succeeds", `status ${exportResult.status}`);
assert(exportResult.text.includes('"Name"') && exportResult.text.includes('"Email"') && !exportResult.text.split("\r\n")[0].includes('"name"'), "CSV export uses human field labels");

const protectedDelete = await browserJson(`/api/admin/forms/${formId}`, "DELETE");
assert(protectedDelete.status === 409, "form with responses cannot be deleted accidentally", `status ${protectedDelete.status}`);

// Theme first-paint, persistence, and OS-preference cases.
await navigate("/events", 120);
const themeCases = [
  ["saved-light", "light", "dark"],
  ["saved-dark", "dark", "light"],
  ["system-light", null, "light"],
  ["system-dark", null, "dark"],
];
for (const [label, saved, system] of themeCases) {
  await send("Emulation.setEmulatedMedia", { features: [
    { name: "prefers-color-scheme", value: system },
    { name: "prefers-reduced-motion", value: "no-preference" },
  ] });
  await evaluate(saved ? `localStorage.setItem(${JSON.stringify(THEME_KEY)}, ${JSON.stringify(saved)})` : `localStorage.removeItem(${JSON.stringify(THEME_KEY)})`);
  await navigate(`/events?qa-theme=${label}`, 300);
  const observed = await evaluate("({ current: document.documentElement.dataset.theme, first: window.__qaThemeAtFirstPaint })");
  const expected = saved || system;
  assert(observed.current === expected, `${label} theme resolves correctly`, JSON.stringify(observed));
  assert(observed.first === expected, `${label} has correct theme at first paint`, JSON.stringify(observed));
}

await evaluate(`localStorage.setItem(${JSON.stringify(THEME_KEY)}, "light")`);
await navigate("/projects?qa-theme-persist=1", 150);
assert(await evaluate("document.documentElement.dataset.theme === 'light'"), "theme persists across routes");
const scrollBefore = await evaluate("window.scrollTo(0, Math.min(300, document.documentElement.scrollHeight - innerHeight)); window.scrollY");
await evaluate("document.querySelector('.site-theme-toggle')?.click(); true");
await wait(220);
const themeToggleState = await evaluate("({ theme: document.documentElement.dataset.theme, y: window.scrollY })");
assert(themeToggleState.theme === "dark", "theme toggle changes active theme");
assert(Math.abs(themeToggleState.y - scrollBefore) <= 2, "theme toggle preserves scroll position", JSON.stringify({ scrollBefore, themeToggleState }));

// Fresh intro, arrival completion, no replay on upward scroll, session return, and reduced motion.
await setViewport(1440, 900);
await send("Emulation.setEmulatedMedia", { features: [
  { name: "prefers-color-scheme", value: "dark" },
  { name: "prefers-reduced-motion", value: "no-preference" },
] });
await evaluate(`sessionStorage.removeItem(${JSON.stringify(INTRO_KEY)}); localStorage.setItem(${JSON.stringify(THEME_KEY)}, "dark")`);
await navigate("/?qa-intro=fresh", 100);
const introStarted = await poll("['POINT','ASSEMBLE','OPEN','BOOT','MAP_READY'].includes(document.querySelector('section[aria-label=\"CSS laptop campus introduction\"]')?.dataset.phase)", 1200);
assert(Boolean(introStarted), "fresh session starts cinematic intro");
const mapReady = await poll("document.querySelector('section[aria-label=\"CSS laptop campus introduction\"]')?.dataset.phase === 'MAP_READY'", 6500);
assert(Boolean(mapReady), "intro reaches campus map state automatically");
await evaluate(`(() => {
  const intro = document.querySelector('section[aria-label="CSS laptop campus introduction"]');
  window.scrollTo({ top: Math.max(1, intro.offsetHeight - innerHeight), behavior: "auto" });
  return true;
})()`);
const introComplete = await poll("document.querySelector('section[aria-label=\"CSS laptop campus introduction\"]')?.dataset.phase === 'COMPLETE'", 2500);
assert(Boolean(introComplete), "intro completes after route/takeover/arrival scroll");
const completionState = await evaluate(`(() => {
  const intro = document.querySelector('section[aria-label="CSS laptop campus introduction"]');
  return { phase: intro?.dataset.phase, bypassed: intro?.dataset.bypassed, seen: sessionStorage.getItem(${JSON.stringify(INTRO_KEY)}) };
})()`);
assert(completionState.bypassed === "true" && completionState.seen === "1", "completed intro retires cinematic scroll story and records session", JSON.stringify(completionState));
await evaluate("window.scrollTo({ top: 0, behavior: 'auto' }); true");
await wait(400);
const upScrollPhase = await evaluate("document.querySelector('section[aria-label=\"CSS laptop campus introduction\"]')?.dataset.phase");
assert(upScrollPhase === "COMPLETE", "scrolling upward after completion does not replay campus journey", String(upScrollPhase));
await navigate("/events?qa-after-intro=1", 120);
await navigate("/?qa-intro=return", 120);
const returnComplete = await poll("document.querySelector('section[aria-label=\"CSS laptop campus introduction\"]')?.dataset.phase === 'COMPLETE'", 1200);
assert(Boolean(returnComplete), "returning home in same session does not replay intro");
const beforeThemeIntro = await evaluate("document.querySelector('section[aria-label=\"CSS laptop campus introduction\"]')?.dataset.phase");
await evaluate("document.querySelector('.site-theme-toggle')?.click(); true");
await wait(180);
const afterThemeIntro = await evaluate("document.querySelector('section[aria-label=\"CSS laptop campus introduction\"]')?.dataset.phase");
assert(beforeThemeIntro === "COMPLETE" && afterThemeIntro === "COMPLETE", "theme switching does not restart intro");

await send("Emulation.setEmulatedMedia", { features: [
  { name: "prefers-color-scheme", value: "dark" },
  { name: "prefers-reduced-motion", value: "reduce" },
] });
await evaluate(`sessionStorage.removeItem(${JSON.stringify(INTRO_KEY)})`);
await navigate("/?qa-intro=reduced", 120);
const reducedComplete = await poll("document.querySelector('section[aria-label=\"CSS laptop campus introduction\"]')?.dataset.phase === 'COMPLETE'", 1200);
const reducedState = await evaluate("document.querySelector('section[aria-label=\"CSS laptop campus introduction\"]')?.dataset.reduced");
assert(Boolean(reducedComplete) && reducedState === "true", "prefers-reduced-motion bypasses cinematic motion");
await send("Emulation.setEmulatedMedia", { features: [
  { name: "prefers-color-scheme", value: "dark" },
  { name: "prefers-reduced-motion", value: "no-preference" },
] });
await evaluate(`sessionStorage.setItem(${JSON.stringify(INTRO_KEY)}, "1")`);

// Mobile menu keyboard and route-close behavior.
await setViewport(390, 844);
await navigate("/events?qa-mobile-nav=1", 180);
await evaluate("document.querySelector('.v4-menu-toggle')?.click(); true");
await wait(100);
let menuState = await evaluate("({ expanded: document.querySelector('.v4-menu-toggle')?.getAttribute('aria-expanded'), bodyOpen: document.body.classList.contains('menu-open') })");
assert(menuState.expanded === "true" && menuState.bodyOpen, "mobile menu opens and locks body state", JSON.stringify(menuState));
await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape" });
await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape" });
await wait(120);
menuState = await evaluate("({ expanded: document.querySelector('.v4-menu-toggle')?.getAttribute('aria-expanded'), bodyOpen: document.body.classList.contains('menu-open') })");
assert(menuState.expanded === "false" && !menuState.bodyOpen, "Escape closes mobile menu", JSON.stringify(menuState));
await evaluate("document.querySelector('.v4-menu-toggle')?.click(); true");
await wait(80);
await evaluate("document.querySelector('.v4-mobile-nav a[href=\"/projects\"]')?.click(); true");
await poll("location.pathname === '/projects'", 2000);
menuState = await evaluate("({ path: location.pathname, bodyOpen: document.body.classList.contains('menu-open') })");
assert(menuState.path === "/projects" && !menuState.bodyOpen, "mobile navigation link closes menu and navigates", JSON.stringify(menuState));

const publicRoutes = [
  "/",
  "/events",
  "/archive",
  "/projects",
  "/team",
  "/resources",
  "/achievements",
  "/events/resume-rewired",
  "/events/open-source-kickoff",
  `/forms/${formSlug}`,
];
const adminRoutes = [
  "/admin",
  "/admin/events",
  "/admin/projects",
  "/admin/resources",
  "/admin/team",
  "/admin/achievements",
  "/admin/content",
  `/admin/form-builder?form=${formId}`,
  "/admin/responses",
];

async function inspectPage(route, theme, width, height, admin = false) {
  await setViewport(width, height);
  if (!admin) await evaluate(`localStorage.setItem(${JSON.stringify(THEME_KEY)}, ${JSON.stringify(theme)}); sessionStorage.setItem(${JSON.stringify(INTRO_KEY)}, "1")`);
  await navigate(`${route}${route.includes("?") ? "&" : "?"}qa-layout=${theme}-${width}`, 100);
  const state = await evaluate(`(() => {
    const root = document.documentElement;
    const skip = document.querySelector('.skip-link');
    const main = document.querySelector('#main');
    const missingAlt = [...document.querySelectorAll('img')].filter((image) => !image.hasAttribute('alt')).length;
    const unsafeBlank = [...document.querySelectorAll('a[target="_blank"]')].filter((link) => !(link.getAttribute('rel') || '').split(/\\s+/).includes('noreferrer')).length;
    const unlabeledControls = [...document.querySelectorAll('input:not([type="hidden"]), select, textarea')].filter((control) => {
      if (control.disabled) return false;
      if (control.getAttribute('aria-label') || control.getAttribute('aria-labelledby')) return false;
      if (control.closest('label')) return false;
      return !(control.id && document.querySelector('label[for="' + CSS.escape(control.id) + '"]'));
    }).length;
    const namelessButtons = [...document.querySelectorAll('button')].filter((button) => {
      if (button.disabled) return false;
      return !(button.textContent || '').trim() && !button.getAttribute('aria-label') && !button.getAttribute('aria-labelledby') && !button.getAttribute('title');
    }).length;
    const menu = document.querySelector('.v4-menu-toggle');
    const menuStyle = menu ? getComputedStyle(menu) : null;
    const menuRect = menu?.getBoundingClientRect();
    return {
      viewport: root.clientWidth,
      scrollWidth: root.scrollWidth,
      theme: root.dataset.theme,
      hasSkip: Boolean(skip),
      hasMain: Boolean(main),
      missingAlt,
      unsafeBlank,
      unlabeledControls,
      namelessButtons,
      menuDisplay: menuStyle?.display || null,
      menuRight: menuRect ? Math.round(menuRect.right) : null,
      bodyText: document.body.innerText.slice(0, 500),
    };
  })()`);
  if (state.scrollWidth > state.viewport + 1) fail(`${route} ${width}x${height} ${theme} overflow`, JSON.stringify(state));
  if (!admin && state.theme !== theme) fail(`${route} ${width}x${height} ${theme} theme`, JSON.stringify(state));
  if (!state.hasSkip || !state.hasMain) fail(`${route} skip/main accessibility`, JSON.stringify(state));
  if (state.missingAlt || state.unsafeBlank || state.unlabeledControls || state.namelessButtons) fail(`${route} basic accessibility`, JSON.stringify(state));
  if (/Application error|Internal Server Error|This page could not be found/i.test(state.bodyText)) fail(`${route} runtime render`, state.bodyText);
  if (!admin && width <= 430 && state.menuDisplay === "none") fail(`${route} mobile menu visibility`, JSON.stringify(state));
  if (!admin && width <= 430 && state.menuRight !== null && state.menuRight > state.viewport + 1) fail(`${route} mobile menu clipping`, JSON.stringify(state));
}

for (const theme of ["dark", "light"]) {
  for (const [width, height] of viewports) {
    for (const route of publicRoutes) await inspectPage(route, theme, width, height, false);
  }
}
pass(`public layout/theme checks across ${publicRoutes.length} routes × ${viewports.length} viewports × 2 themes`);

for (const [width, height] of viewports) {
  for (const route of adminRoutes) await inspectPage(route, "admin", width, height, true);
}
pass(`admin layout checks across ${adminRoutes.length} routes × ${viewports.length} viewports`);

if (runtimeErrors.length) fail("browser runtime console/exceptions", [...new Set(runtimeErrors)].join(" | "));
if (resourceErrors.length) fail("browser document/static resource responses", [...new Set(resourceErrors)].join(" | "));

socket.close();

if (failures.length) {
  console.error("\nRuntime QA failures:");
  for (const issue of failures) console.error(`- ${issue}`);
  process.exitCode = 1;
} else {
  console.info("\nProduction runtime QA passed with no detected browser exceptions, broken document/static resources, or page-level overflow.");
}
