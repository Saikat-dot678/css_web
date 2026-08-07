import { writeFile } from "node:fs/promises";

const targets = await fetch("http://127.0.0.1:9222/json").then((response) => response.json());
const target = targets.find((item) => item.type === "page" && item.url.startsWith("http://127.0.0.1:3000"));
if (!target) throw new Error("No QA Chrome page found on port 9222.");

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

await send("Page.enable");
const routes = [
  "/",
  "/events",
  "/events/resume-rewired",
  "/events/open-source-kickoff",
  "/team",
  "/projects",
  "/resources",
  "/achievements",
  "/admin",
  "/admin/events",
  "/admin/events/event-resume-rewired/edit",
  "/admin/form-builder?event=event-resume-rewired",
  "/admin/team",
];
const requestedWidth = process.argv.find((value) => /^\d+$/.test(value));
const widths = requestedWidth ? [Number(requestedWidth)] : [390, 768, 1024, 1440];
for (const width of widths) {
  await send("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: 1, mobile: width < 700 });
  for (const route of routes) {
    await send("Page.navigate", { url: `http://127.0.0.1:3000${route}` });
    await new Promise((resolve) => setTimeout(resolve, 450));
    const result = await send("Runtime.evaluate", { expression: `(() => {
      const viewport = document.documentElement.clientWidth;
      const scrollWidth = document.documentElement.scrollWidth;
      const elements = [...document.querySelectorAll('body *')].map((element) => {
        const rect = element.getBoundingClientRect();
        return { element, rect, overflow: Math.max(0, rect.right - viewport, -rect.left) };
      }).filter(({ rect, overflow, element }) => overflow > 1 && rect.width > 0 && rect.height > 0 && getComputedStyle(element).position !== 'fixed')
        .sort((a, b) => b.overflow - a.overflow).slice(0, 6)
        .map(({ element, rect, overflow }) => ({ tag: element.tagName, className: element.className || '', left: Math.round(rect.left), right: Math.round(rect.right), width: Math.round(rect.width), overflow: Math.round(overflow) }));
      const heading = document.querySelector('h1');
      const menu = document.querySelector('.menu-toggle');
      const poster = document.querySelector('.event-detail-poster img');
      return JSON.stringify({ viewport, scrollWidth, innerWidth, heading: heading ? { clientWidth: heading.clientWidth, scrollWidth: heading.scrollWidth, fontSize: getComputedStyle(heading).fontSize, right: Math.round(heading.getBoundingClientRect().right) } : null, poster: poster ? { left: Math.round(poster.getBoundingClientRect().left), right: Math.round(poster.getBoundingClientRect().right), width: Math.round(poster.getBoundingClientRect().width), height: Math.round(poster.getBoundingClientRect().height) } : null, menu: menu ? { display: getComputedStyle(menu).display, right: Math.round(menu.getBoundingClientRect().right) } : null, offenders: elements });
    })()`, returnByValue: true });
    console.log(width, route, result.result.value);
    if (process.argv.includes("--screenshots")) {
      if (process.argv.includes("--full")) {
        await send("Runtime.evaluate", { expression: "document.querySelectorAll('.reveal').forEach((element) => element.classList.add('visible'))" });
        await new Promise((resolve) => setTimeout(resolve, 650));
      }
      const capture = await send("Page.captureScreenshot", { format: "png", fromSurface: true, captureBeyondViewport: process.argv.includes("--full") });
      const name = route === "/" ? "home" : route.replace(/^\//, "").replaceAll(/[^a-z0-9]+/gi, "-").replace(/-$/, "");
      await writeFile(`.qa/cdp-${name}-${width}.png`, Buffer.from(capture.data, "base64"));
    }
  }
}
socket.close();
