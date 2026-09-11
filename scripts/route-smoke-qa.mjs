const BASE_URL = process.env.QA_BASE_URL || "http://127.0.0.1:3000";
const failures = [];
const runtimeErrors = [];
const resourceErrors = [];
const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const pass = (label) => console.info(`PASS ${label}`);
const assert = (condition, label, detail = "assertion failed") => condition ? pass(label) : failures.push(`${label}: ${detail}`);

const targets = await fetch("http://127.0.0.1:9222/json").then((response) => response.json());
const target = targets.find((item) => item.type === "page");
if (!target) throw new Error("No Chromium page found on debugging port 9222.");
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
  if (message.method === "Runtime.exceptionThrown") runtimeErrors.push(message.params?.exceptionDetails?.exception?.description || message.params?.exceptionDetails?.text || "Browser exception");
  if (message.method === "Runtime.consoleAPICalled" && message.params?.type === "error") runtimeErrors.push(`console.error: ${(message.params.args || []).map((item) => item.value ?? item.description ?? "").join(" ")}`);
  if (message.method === "Network.responseReceived") {
    const { response, type } = message.params;
    if (response?.status >= 400 && ["Document", "Script", "Stylesheet", "Image", "Font"].includes(type)) resourceErrors.push(`${response.status} ${type} ${response.url}`);
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

async function inspect(path, admin, width) {
  await send("Emulation.setDeviceMetricsOverride", { width, height: width <= 430 ? 844 : 900, deviceScaleFactor: 1, mobile: width <= 430 });
  await send("Page.navigate", { url: `${BASE_URL}${path}` });
  for (let attempt = 0; attempt < 120; attempt += 1) {
    if (await evaluate("document.readyState === 'complete'").catch(() => false)) break;
    await wait(40);
  }
  await wait(100);
  const state = await evaluate(`(() => ({
    path: location.pathname,
    viewport: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    hasShell: Boolean(document.querySelector(${JSON.stringify(admin ? ".admin-app" : ".v4-public-shell")})),
    hasMain: Boolean(document.querySelector('#main')),
    body: document.body.innerText.slice(0, 500),
  }))()`);
  assert(state.path === path.split("?")[0] && state.hasShell && state.hasMain && state.scrollWidth <= state.viewport + 1 && !/Application error|Internal Server Error|This page could not be found/i.test(state.body), `${admin ? "Admin" : "Public"} ${path} ${width}px`, JSON.stringify(state));
}

await send("Page.enable");
await send("Runtime.enable");
await send("Network.enable");

const adminRoutes = ["/admin", "/admin/events", "/admin/projects", "/admin/resources", "/admin/team", "/admin/achievements", "/admin/content", "/admin/form-builder", "/admin/responses"];
const publicRoutes = ["/", "/events", "/archive", "/projects", "/team", "/resources", "/achievements", "/events/resume-rewired"];
for (const width of [1440, 390]) {
  for (const path of adminRoutes) await inspect(path, true, width);
  for (const path of publicRoutes) await inspect(path, false, width);
}

assert(runtimeErrors.length === 0, "route smoke has no browser console errors/exceptions", [...new Set(runtimeErrors)].join(" | "));
assert(resourceErrors.length === 0, "route smoke has no failed document/static resources", [...new Set(resourceErrors)].join(" | "));
socket.close();
if (failures.length) {
  console.error("\nRoute smoke QA failures:");
  for (const issue of failures) console.error(`- ${issue}`);
  process.exitCode = 1;
} else {
  console.info("\nAdmin and public route smoke QA passed at desktop and mobile widths.");
}
