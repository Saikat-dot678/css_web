import { mkdir, writeFile } from "node:fs/promises";

const BASE_URL = "http://127.0.0.1:3000";
const STORAGE_KEY = "css-theme";
const INTRO_KEY = "css-nitdgp:laptop-intro-seen:v2";
const SCREENSHOT_DIR = ".qa/theme";

const targets = await fetch("http://127.0.0.1:9222/json").then((response) => response.json());
const target = targets.find((item) => item.type === "page");
if (!target) throw new Error("No Chrome page found on debugging port 9222.");

await mkdir(SCREENSHOT_DIR, { recursive: true });

const socket = new WebSocket(target.webSocketDebuggerUrl);
let sequence = 0;
const pending = new Map();
socket.onmessage = (event) => {
  const message = JSON.parse(event.data);
  if (!message.id) return;
  const handler = pending.get(message.id);
  if (handler) handler(message);
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

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function evaluate(expression) {
  const response = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (response.exceptionDetails) throw new Error(response.exceptionDetails.text);
  return response.result.value;
}

async function navigate(route, settle = 700) {
  await send("Page.navigate", { url: `${BASE_URL}${route}` });
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const ready = await evaluate("document.readyState").catch(() => "loading");
    if (ready === "complete") break;
    await wait(100);
  }
  await wait(settle);
}

async function setViewport(width, height) {
  await send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: width < 700,
  });
}

async function setTheme(theme) {
  await evaluate(`localStorage.setItem(${JSON.stringify(STORAGE_KEY)}, ${JSON.stringify(theme)})`);
  await evaluate("location.reload()");
  await wait(850);
}

async function capture(name, fullPage = false) {
  if (fullPage) {
    await evaluate("document.querySelectorAll('.reveal').forEach((item) => item.classList.add('visible'))");
    await wait(350);
  }
  const screenshot = await send("Page.captureScreenshot", {
    format: "png",
    fromSurface: true,
    captureBeyondViewport: fullPage,
  });
  await writeFile(`${SCREENSHOT_DIR}/${name}.png`, Buffer.from(screenshot.data, "base64"));
}

async function scrollTo(selector) {
  await evaluate(`(() => {
    const element = document.querySelector(${JSON.stringify(selector)});
    if (!element) throw new Error("Missing screenshot selector: ${selector}");
    element.scrollIntoView({ block: "start" });
    window.scrollBy(0, -72);
    document.querySelectorAll(".reveal").forEach((item) => item.classList.add("visible"));
  })()`);
  await wait(650);
}

async function inspectLayout(route, width, height, theme) {
  await setViewport(width, height);
  await navigate(route, 350);
  return evaluate(`(() => {
    const viewport = document.documentElement.clientWidth;
    const offenders = [...document.querySelectorAll("body *")]
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return { element, rect, overflow: Math.max(0, rect.right - viewport, -rect.left) };
      })
      .filter(({ element, rect, overflow }) => overflow > 1 && rect.width > 0 && rect.height > 0 && getComputedStyle(element).position !== "fixed")
      .sort((a, b) => b.overflow - a.overflow)
      .slice(0, 5)
      .map(({ element, rect, overflow }) => ({
        tag: element.tagName,
        className: typeof element.className === "string" ? element.className : "",
        left: Math.round(rect.left),
        right: Math.round(rect.right),
        width: Math.round(rect.width),
        overflow: Math.round(overflow),
      }));
    const brand = document.querySelector(".v4-brand");
    const toggle = document.querySelector(".site-theme-toggle");
    const menu = document.querySelector(".v4-menu-toggle");
    const join = document.querySelector(".v4-nav-join");
    const box = (element) => element ? {
      left: Math.round(element.getBoundingClientRect().left),
      right: Math.round(element.getBoundingClientRect().right),
      top: Math.round(element.getBoundingClientRect().top),
      bottom: Math.round(element.getBoundingClientRect().bottom),
      display: getComputedStyle(element).display,
    } : null;
    return {
      route: ${JSON.stringify(route)},
      theme: document.documentElement.dataset.theme,
      expectedTheme: ${JSON.stringify(theme)},
      viewport,
      scrollWidth: document.documentElement.scrollWidth,
      header: { brand: box(brand), toggle: box(toggle), menu: box(menu), join: box(join) },
      offenders,
    };
  })()`);
}

await send("Page.enable");
await send("Runtime.enable");
await send("Network.enable");
await setViewport(1440, 900);
await navigate("/events");

async function captureTakeover(theme) {
  await setTheme(theme);
  await evaluate(`sessionStorage.removeItem(${JSON.stringify(INTRO_KEY)}); window.scrollTo(0, 0)`);
  await navigate(`/?qa-intro=${theme}`, 1100);
  await capture(`home-intro-${theme}`);
  await evaluate(`(() => {
    const skip = [...document.querySelectorAll("button")].find((button) => button.textContent.toLowerCase().includes("skip intro"));
    if (skip) skip.click();
  })()`);
  await wait(250);
  await evaluate(`(() => {
    const intro = document.querySelector('section[aria-label="CSS laptop campus introduction"]');
    const distance = Math.max(1, intro.offsetHeight - innerHeight);
    window.scrollTo(0, distance * .86);
  })()`);
  await wait(500);
  await capture(`home-takeover-${theme}`);
  await evaluate(`(() => {
    const intro = document.querySelector('section[aria-label="CSS laptop campus introduction"]');
    const distance = Math.max(1, intro.offsetHeight - innerHeight);
    window.scrollTo(0, distance);
  })()`);
  await wait(450);
  await capture(`home-takeover-final-${theme}`);
}

async function captureMobileMenus() {
  await setViewport(390, 844);
  for (const theme of ["dark", "light"]) {
    await setTheme(theme);
    await navigate(`/events?qa-mobile-menu=${theme}`, 450);
    await evaluate("document.querySelector('.v4-menu-toggle').click()");
    await wait(350);
    await capture(`mobile-menu-${theme}`);
  }
}

async function captureAdminSafety() {
  await setViewport(1440, 900);
  await navigate("/events", 350);
  await setTheme("dark");
  const results = [];
  for (const [label, route] of [
    ["admin", "/admin"],
    ["admin-events", "/admin/events"],
    ["admin-team", "/admin/team"],
    ["admin-form-builder", "/admin/form-builder?event=event-resume-rewired"],
  ]) {
    await navigate(route, 650);
    results.push(await evaluate(`(() => {
      const shell = document.querySelector('.admin-app, .login-shell');
      const style = shell ? getComputedStyle(shell) : null;
      return {
        route: location.pathname + location.search,
        rootTheme: document.documentElement.dataset.theme,
        shell: shell ? shell.className : null,
        colorScheme: style?.colorScheme,
        background: style?.backgroundColor,
        color: style?.color,
        scrollWidth: document.documentElement.scrollWidth,
        viewport: document.documentElement.clientWidth,
      };
    })()`));
    await capture(label);
  }
  console.log("ADMIN", JSON.stringify(results));
}

if (process.argv.includes("--takeover-only")) {
  for (const theme of ["dark", "light"]) await captureTakeover(theme);
  socket.close();
  process.exit(0);
}

if (process.argv.includes("--mobile-only")) {
  await captureMobileMenus();
  socket.close();
  process.exit(0);
}

if (process.argv.includes("--admin-only")) {
  await captureAdminSafety();
  socket.close();
  process.exit(0);
}

// Required home comparisons. The intro is captured fresh; section captures skip the replay gate.
for (const theme of ["dark", "light"]) {
  await captureTakeover(theme);

  await evaluate(`sessionStorage.setItem(${JSON.stringify(INTRO_KEY)}, "1")`);
  await navigate(`/?qa-sections=${theme}`, 900);
  for (const [label, selector] of [
    ["about", "#about"],
    ["events", "#events"],
    ["projects", "#projects"],
    ["team", "#team"],
    ["join", "#contact"],
  ]) {
    await scrollTo(selector);
    await capture(`home-${label}-${theme}`);
  }
}

// Required inner-page comparisons.
for (const theme of ["dark", "light"]) {
  await setTheme(theme);
  for (const [label, route, contentSelector] of [
    ["events", "/events", ".featured-event-new"],
    ["archive", "/archive", ".v4-archive-timeline"],
    ["projects", "/projects", ".project-lead"],
    ["team", "/team", ".faculty-section-new"],
    ["resources", "/resources", ".resource-library"],
    ["achievements", "/achievements", ".timeline"],
    ["event-detail", "/events/resume-rewired", "#register"],
  ]) {
    await navigate(route, 850);
    await capture(`${label}-${theme}`, true);
    await scrollTo(contentSelector);
    await capture(`${label}-content-${theme}`);
  }
}

// Persistence and live-toggle checks.
await setViewport(1440, 900);
await navigate("/events");
await evaluate(`localStorage.removeItem(${JSON.stringify(STORAGE_KEY)})`);
await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: "dark" }] });
await navigate("/events?qa-system-dark");
const systemDark = await evaluate("document.documentElement.dataset.theme");
await evaluate("document.querySelector('.site-theme-toggle').click()");
await wait(280);
const toggledLight = await evaluate("document.documentElement.dataset.theme");
await navigate("/projects?qa-persist-light");
const persistedLight = await evaluate("document.documentElement.dataset.theme");
const scrollBefore = await evaluate("window.scrollY = 240; window.scrollY");
await evaluate("document.querySelector('.site-theme-toggle').click()");
await wait(280);
const toggledDark = await evaluate("document.documentElement.dataset.theme");
const scrollAfter = await evaluate("window.scrollY");
await navigate("/projects?qa-persist-dark");
const persistedDark = await evaluate("document.documentElement.dataset.theme");
await evaluate(`localStorage.removeItem(${JSON.stringify(STORAGE_KEY)})`);
await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: "light" }] });
await navigate("/events?qa-system-light");
const systemLight = await evaluate("document.documentElement.dataset.theme");
console.log("INTERACTIONS", JSON.stringify({ systemDark, toggledLight, persistedLight, toggledDark, persistedDark, scrollBefore, scrollAfter, systemLight }));

// Responsive header and horizontal-overflow checks in both themes.
const responsive = [];
for (const theme of ["dark", "light"]) {
  await setTheme(theme);
  for (const [width, height] of [[1920, 1080], [1440, 900], [1024, 768], [768, 1024], [430, 932], [390, 844], [360, 800], [320, 760]]) {
    responsive.push(await inspectLayout("/events", width, height, theme));
  }
}
console.log("RESPONSIVE", JSON.stringify(responsive));

// Mobile navigation is a separate themed surface.
await captureMobileMenus();

// Observe the root theme at the browser's first paint while network resources are throttled.
await send("Page.addScriptToEvaluateOnNewDocument", { source: `
  window.__themeAtFirstPaint = null;
  new PerformanceObserver((list) => {
    if (list.getEntries().some((entry) => entry.name === "first-paint")) {
      window.__themeAtFirstPaint = document.documentElement.dataset.theme;
    }
  }).observe({ type: "paint", buffered: true });
` });
await send("Network.setCacheDisabled", { cacheDisabled: true });
await send("Network.emulateNetworkConditions", {
  offline: false,
  latency: 220,
  downloadThroughput: 64000,
  uploadThroughput: 32000,
  connectionType: "cellular3g",
});
const fouc = [];
for (const [label, saved, system] of [
  ["saved-light", "light", "dark"],
  ["saved-dark", "dark", "light"],
  ["system-light", null, "light"],
  ["system-dark", null, "dark"],
]) {
  await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: system }] });
  await evaluate(saved
    ? `localStorage.setItem(${JSON.stringify(STORAGE_KEY)}, ${JSON.stringify(saved)})`
    : `localStorage.removeItem(${JSON.stringify(STORAGE_KEY)})`);
  await navigate(`/events?qa-fouc=${label}`, 500);
  fouc.push(await evaluate(`({ case: ${JSON.stringify(label)}, atFirstPaint: window.__themeAtFirstPaint, current: document.documentElement.dataset.theme })`));
}
console.log("FIRST_PAINT", JSON.stringify(fouc));
await send("Network.emulateNetworkConditions", {
  offline: false,
  latency: 0,
  downloadThroughput: -1,
  uploadThroughput: -1,
});
await send("Network.setCacheDisabled", { cacheDisabled: false });

socket.close();
