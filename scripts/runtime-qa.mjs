const BASE_URL = process.env.QA_BASE_URL || "http://127.0.0.1:3000";
const MODE = process.env.QA_MODE || "public";
const THEME_KEY = "css-theme";
const INTRO_KEY = "css-nitdgp:laptop-intro-seen:v2";
const FIXTURE_SLUG = "runtime-qa-form";

const viewports = [
  [1920, 1080], [1440, 900], [1280, 800], [1024, 768], [768, 1024],
  [430, 932], [390, 844], [360, 800], [320, 700],
];
const failures = [];
const runtimeErrors = [];
const resourceErrors = [];
const pass = (label) => console.info(`PASS ${label}`);
const fail = (label, detail) => failures.push(`${label}: ${detail}`);
const assert = (condition, label, detail = "assertion failed") => condition ? pass(label) : fail(label, detail);
const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function request(path, options = {}) {
  return fetch(`${BASE_URL}${path}`, { redirect: "manual", ...options });
}
async function expectStatus(path, expected, options = {}) {
  const response = await request(path, options);
  assert(response.status === expected, `${options.method || "GET"} ${path} -> ${expected}`, `received ${response.status}`);
  return response;
}

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
    runtimeErrors.push(`console.error: ${(message.params.args || []).map((item) => item.value ?? item.description ?? "").join(" ")}`);
  }
  if (message.method === "Network.responseReceived") {
    const { response, type } = message.params;
    if (response?.status >= 400 && ["Document", "Script", "Stylesheet", "Image", "Font"].includes(type)) {
      resourceErrors.push(`${response.status} ${type} ${response.url}`);
    }
  }
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
async function setViewport(width, height) {
  await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width < 700 });
}
async function navigate(path, settle = 140) {
  await send("Page.navigate", { url: `${BASE_URL}${path}` });
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const ready = await evaluate("document.readyState").catch(() => "loading");
    if (ready === "complete") break;
    await wait(40);
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

function validSubmission(includeFile = false) {
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
  if (includeFile) data.set("resume", new File(["runtime qa"], "resume.pdf", { type: "application/pdf" }));
  return data;
}

async function inspectPage(route, theme, width, height, admin = false) {
  await setViewport(width, height);
  if (!admin) {
    await evaluate(`localStorage.setItem(${JSON.stringify(THEME_KEY)}, ${JSON.stringify(theme)}); sessionStorage.setItem(${JSON.stringify(INTRO_KEY)}, "1")`);
  }
  await navigate(`${route}${route.includes("?") ? "&" : "?"}qa-layout=${theme}-${width}`);
  const state = await evaluate(`(() => {
    const root = document.documentElement;
    const missingAlt = [...document.querySelectorAll('img')].filter((image) => !image.hasAttribute('alt')).length;
    const unsafeBlank = [...document.querySelectorAll('a[target="_blank"]')].filter((link) => !(link.getAttribute('rel') || '').split(/\\s+/).includes('noreferrer')).length;
    const unlabeledControls = [...document.querySelectorAll('input:not([type="hidden"]), select, textarea')].filter((control) => {
      if (control.disabled || control.getAttribute('aria-label') || control.getAttribute('aria-labelledby') || control.closest('label')) return false;
      return !(control.id && document.querySelector('label[for="' + CSS.escape(control.id) + '"]'));
    }).length;
    const namelessButtons = [...document.querySelectorAll('button')].filter((button) => !button.disabled && !(button.textContent || '').trim() && !button.getAttribute('aria-label') && !button.getAttribute('aria-labelledby') && !button.getAttribute('title')).length;
    const menu = document.querySelector('.v4-menu-toggle');
    const menuRect = menu?.getBoundingClientRect();
    return {
      viewport: root.clientWidth, scrollWidth: root.scrollWidth, theme: root.dataset.theme,
      hasSkip: Boolean(document.querySelector('.skip-link')), hasMain: Boolean(document.querySelector('#main')),
      missingAlt, unsafeBlank, unlabeledControls, namelessButtons,
      menuDisplay: menu ? getComputedStyle(menu).display : null,
      menuRight: menuRect ? Math.round(menuRect.right) : null,
      bodyText: document.body.innerText.slice(0, 500),
    };
  })()`);
  if (state.scrollWidth > state.viewport + 1) fail(`${route} ${width}x${height} overflow`, JSON.stringify(state));
  if (!admin && state.theme !== theme) fail(`${route} ${width}x${height} ${theme} theme`, JSON.stringify(state));
  if (!state.hasSkip || !state.hasMain) fail(`${route} skip/main accessibility`, JSON.stringify(state));
  if (state.missingAlt || state.unsafeBlank || state.unlabeledControls || state.namelessButtons) fail(`${route} basic accessibility`, JSON.stringify(state));
  if (/Application error|Internal Server Error|This page could not be found/i.test(state.bodyText)) fail(`${route} runtime render`, state.bodyText);
  if (!admin && width <= 430 && state.menuDisplay === "none") fail(`${route} mobile menu visibility`, JSON.stringify(state));
  if (!admin && width <= 430 && state.menuRight !== null && state.menuRight > state.viewport + 1) fail(`${route} mobile menu clipping`, JSON.stringify(state));
}

async function runPublicProductionQa() {
  await expectStatus("/admin", 307);
  await expectStatus("/api/admin/forms", 401, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: "Unauthorized QA form" }) });
  await expectStatus("/api/admin/responses/export", 401);

  const publicFormPage = await fetch(`${BASE_URL}/forms/${FIXTURE_SLUG}`);
  const publicFormHtml = await publicFormPage.text();
  assert(publicFormPage.status === 200 && publicFormHtml.includes("Runtime QA Form"), "production standalone form renders publicly", `status ${publicFormPage.status}`);

  const missing = new FormData();
  missing.set("email", "qa.student@example.test");
  let response = await fetch(`${BASE_URL}/api/forms/${FIXTURE_SLUG}/responses`, { method: "POST", body: missing });
  assert(response.status === 422, "production required-field validation rejects invalid response", `status ${response.status}`);
  const invalidEmail = validSubmission();
  invalidEmail.set("email", "not-an-email");
  response = await fetch(`${BASE_URL}/api/forms/${FIXTURE_SLUG}/responses`, { method: "POST", body: invalidEmail });
  assert(response.status === 422, "production email validation rejects invalid response", `status ${response.status}`);
  const invalidChoice = validSubmission();
  invalidChoice.set("track", "Secret track");
  response = await fetch(`${BASE_URL}/api/forms/${FIXTURE_SLUG}/responses`, { method: "POST", body: invalidChoice });
  assert(response.status === 422, "production choice validation rejects invalid response", `status ${response.status}`);
  response = await fetch(`${BASE_URL}/api/forms/${FIXTURE_SLUG}/responses`, { method: "POST", body: validSubmission(true) });
  assert(response.status === 503, "production file upload fails clearly without durable storage", `status ${response.status}`);
  response = await fetch(`${BASE_URL}/api/forms/${FIXTURE_SLUG}/responses`, { method: "POST", body: validSubmission() });
  assert(response.status === 201, "production text-only form submission persists without upload storage", `status ${response.status}`);

  await setViewport(1440, 900);
  await navigate("/events");
  for (const [label, saved, system] of [["saved-light", "light", "dark"], ["saved-dark", "dark", "light"], ["system-light", null, "light"], ["system-dark", null, "dark"]]) {
    await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: system }, { name: "prefers-reduced-motion", value: "no-preference" }] });
    await evaluate(saved ? `localStorage.setItem(${JSON.stringify(THEME_KEY)}, ${JSON.stringify(saved)})` : `localStorage.removeItem(${JSON.stringify(THEME_KEY)})`);
    await navigate(`/events?qa-theme=${label}`, 260);
    const observed = await evaluate("({ current: document.documentElement.dataset.theme, first: window.__qaThemeAtFirstPaint })");
    const expected = saved || system;
    assert(observed.current === expected, `${label} theme resolves correctly`, JSON.stringify(observed));
    assert(observed.first === expected, `${label} has correct theme at first paint`, JSON.stringify(observed));
  }
  await evaluate(`localStorage.setItem(${JSON.stringify(THEME_KEY)}, "light")`);
  await navigate("/projects?qa-theme-persist=1");
  assert(await evaluate("document.documentElement.dataset.theme === 'light'"), "theme persists across routes");
  const scrollBefore = await evaluate("window.scrollTo(0, Math.min(300, document.documentElement.scrollHeight - innerHeight)); window.scrollY");
  await evaluate("document.querySelector('.site-theme-toggle')?.click(); true");
  await wait(180);
  const themeToggleState = await evaluate("({ theme: document.documentElement.dataset.theme, y: window.scrollY })");
  assert(themeToggleState.theme === "dark", "theme toggle changes active theme");
  assert(Math.abs(themeToggleState.y - scrollBefore) <= 2, "theme toggle preserves scroll position", JSON.stringify({ scrollBefore, themeToggleState }));

  await setViewport(1440, 900);
  await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: "dark" }, { name: "prefers-reduced-motion", value: "no-preference" }] });
  await evaluate(`sessionStorage.removeItem(${JSON.stringify(INTRO_KEY)}); localStorage.setItem(${JSON.stringify(THEME_KEY)}, "dark")`);
  await navigate("/?qa-intro=fresh", 80);
  assert(Boolean(await poll("['POINT','ASSEMBLE','OPEN','BOOT','MAP_READY'].includes(document.querySelector('section[aria-label=\"CSS laptop campus introduction\"]')?.dataset.phase)", 1200)), "fresh session starts cinematic intro");
  assert(Boolean(await poll("document.querySelector('section[aria-label=\"CSS laptop campus introduction\"]')?.dataset.phase === 'MAP_READY'", 6500)), "intro reaches campus map state automatically");
  await evaluate(`(() => { const intro = document.querySelector('section[aria-label="CSS laptop campus introduction"]'); window.scrollTo({ top: Math.max(1, intro.offsetHeight - innerHeight), behavior: "auto" }); return true; })()`);
  assert(Boolean(await poll("document.querySelector('section[aria-label=\"CSS laptop campus introduction\"]')?.dataset.phase === 'COMPLETE'", 2500)), "intro completes after route/takeover/arrival scroll");
  const completionState = await evaluate(`(() => { const intro = document.querySelector('section[aria-label="CSS laptop campus introduction"]'); return { phase: intro?.dataset.phase, bypassed: intro?.dataset.bypassed, seen: sessionStorage.getItem(${JSON.stringify(INTRO_KEY)}) }; })()`);
  assert(completionState.bypassed === "true" && completionState.seen === "1", "completed intro retires scroll story and records session", JSON.stringify(completionState));
  await evaluate("window.scrollTo({ top: 0, behavior: 'auto' }); true");
  await wait(300);
  assert(await evaluate("document.querySelector('section[aria-label=\"CSS laptop campus introduction\"]')?.dataset.phase === 'COMPLETE'"), "up-scroll after completion does not replay intro");
  await navigate("/events?qa-after-intro=1");
  await navigate("/?qa-intro=return");
  assert(Boolean(await poll("document.querySelector('section[aria-label=\"CSS laptop campus introduction\"]')?.dataset.phase === 'COMPLETE'", 1200)), "same-session return does not replay intro");
  await evaluate("document.querySelector('.site-theme-toggle')?.click(); true");
  await wait(140);
  assert(await evaluate("document.querySelector('section[aria-label=\"CSS laptop campus introduction\"]')?.dataset.phase === 'COMPLETE'"), "theme switching does not restart intro");

  await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: "dark" }, { name: "prefers-reduced-motion", value: "reduce" }] });
  await evaluate(`sessionStorage.removeItem(${JSON.stringify(INTRO_KEY)})`);
  await navigate("/?qa-intro=reduced");
  assert(Boolean(await poll("document.querySelector('section[aria-label=\"CSS laptop campus introduction\"]')?.dataset.phase === 'COMPLETE'", 1200)) && await evaluate("document.querySelector('section[aria-label=\"CSS laptop campus introduction\"]')?.dataset.reduced === 'true'"), "prefers-reduced-motion bypasses cinematic motion");
  await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: "dark" }, { name: "prefers-reduced-motion", value: "no-preference" }] });
  await evaluate(`sessionStorage.setItem(${JSON.stringify(INTRO_KEY)}, "1")`);

  await setViewport(390, 844);
  await navigate("/events?qa-mobile-nav=1");
  await evaluate("document.querySelector('.v4-menu-toggle')?.click(); true");
  await wait(80);
  let menuState = await evaluate("({ expanded: document.querySelector('.v4-menu-toggle')?.getAttribute('aria-expanded'), bodyOpen: document.body.classList.contains('menu-open') })");
  assert(menuState.expanded === "true" && menuState.bodyOpen, "mobile menu opens and sets body state", JSON.stringify(menuState));
  await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape" });
  await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape" });
  await wait(100);
  menuState = await evaluate("({ expanded: document.querySelector('.v4-menu-toggle')?.getAttribute('aria-expanded'), bodyOpen: document.body.classList.contains('menu-open') })");
  assert(menuState.expanded === "false" && !menuState.bodyOpen, "Escape closes mobile menu", JSON.stringify(menuState));
  await evaluate("document.querySelector('.v4-menu-toggle')?.click(); true");
  await wait(60);
  await evaluate("document.querySelector('.v4-mobile-nav a[href=\"/projects\"]')?.click(); true");
  await poll("location.pathname === '/projects'", 2000);
  menuState = await evaluate("({ path: location.pathname, bodyOpen: document.body.classList.contains('menu-open') })");
  assert(menuState.path === "/projects" && !menuState.bodyOpen, "mobile link closes menu and navigates", JSON.stringify(menuState));

  const publicRoutes = ["/", "/events", "/archive", "/projects", "/team", "/resources", "/achievements", "/events/resume-rewired", "/events/open-source-kickoff", `/forms/${FIXTURE_SLUG}`];
  for (const theme of ["dark", "light"]) {
    for (const [width, height] of viewports) for (const route of publicRoutes) await inspectPage(route, theme, width, height, false);
  }
  pass(`public responsive checks: ${publicRoutes.length} routes × ${viewports.length} viewports × 2 themes`);
}

async function runLocalAdminQa() {
  await expectStatus("/admin", 200);
  const createResponse = await request("/api/admin/forms", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: "Admin Runtime QA" }) });
  const createPayload = await createResponse.json();
  assert(createResponse.status === 201 && createPayload.form?.id, "local admin can create form through protected API", `status ${createResponse.status}`);
  if (!createPayload.form?.id) return;
  const id = createPayload.form.id;
  const slug = `admin-runtime-qa-${Date.now()}`;
  const fields = [
    { id: "name", type: "shortText", label: "Name", required: true, order: 0 },
    { id: "email", type: "email", label: "Email", required: true, order: 1 },
    { id: "resume", type: "file", label: "Resume", required: false, order: 2, allowedFileTypes: ["application/pdf"], maxFileSizeMb: 1 },
  ];
  let response = await request(`/api/admin/forms/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug, title: "Admin Runtime QA", kind: "standalone", status: "published", submitLabel: "Submit", fields }) });
  assert(response.status === 200, "local admin can edit and publish form", `status ${response.status}`);

  const duplicateCreate = await request("/api/admin/forms", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: "Admin Runtime QA Duplicate" }) });
  const duplicatePayload = await duplicateCreate.json();
  assert(duplicateCreate.status === 201 && duplicatePayload.form?.id, "local admin can create second draft");
  if (duplicatePayload.form?.id) {
    response = await request(`/api/admin/forms/${duplicatePayload.form.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug }) });
    assert(response.status === 422, "admin duplicate slug is rejected", `status ${response.status}`);
    response = await request(`/api/admin/forms/${duplicatePayload.form.id}`, { method: "DELETE" });
    assert(response.status === 200, "admin can delete response-free form", `status ${response.status}`);
  }

  const submission = new FormData();
  submission.set("name", "Admin QA Student"); submission.set("email", "admin.qa@example.test");
  submission.set("resume", new File(["admin runtime qa"], "resume.pdf", { type: "application/pdf" }));
  response = await fetch(`${BASE_URL}/api/forms/${slug}/responses`, { method: "POST", body: submission });
  assert(response.status === 201, "development local file upload persists successfully", `status ${response.status}`);

  response = await request(`/api/admin/responses/export?form=${id}`);
  const csv = await response.text();
  assert(response.status === 200 && csv.includes('"Name"') && csv.includes('"Email"'), "admin CSV export returns human labels", `status ${response.status}`);
  response = await request(`/api/admin/forms/${id}`, { method: "DELETE" });
  assert(response.status === 409, "admin cannot delete form with responses", `status ${response.status}`);

  const responsesPage = await fetch(`${BASE_URL}/admin/responses`);
  const responsesHtml = await responsesPage.text();
  assert(responsesPage.status === 200 && responsesHtml.includes("Admin QA Student"), "admin responses page reads submitted data back", `status ${responsesPage.status}`);

  const adminRoutes = ["/admin", "/admin/events", "/admin/projects", "/admin/resources", "/admin/team", "/admin/achievements", "/admin/content", `/admin/form-builder?form=${id}`, "/admin/responses"];
  for (const [width, height] of viewports) for (const route of adminRoutes) await inspectPage(route, "admin", width, height, true);
  pass(`admin responsive checks: ${adminRoutes.length} routes × ${viewports.length} viewports`);
}

if (MODE === "public") await runPublicProductionQa();
else if (MODE === "admin") await runLocalAdminQa();
else throw new Error(`Unknown QA_MODE: ${MODE}`);

if (runtimeErrors.length) fail("browser runtime console/exceptions", [...new Set(runtimeErrors)].join(" | "));
if (resourceErrors.length) fail("browser document/static resource responses", [...new Set(resourceErrors)].join(" | "));
socket.close();
if (failures.length) {
  console.error(`\n${MODE} runtime QA failures:`);
  for (const issue of failures) console.error(`- ${issue}`);
  process.exitCode = 1;
} else {
  console.info(`\n${MODE} runtime QA passed with no detected browser exceptions, broken document/static resources, or page-level overflow.`);
}
