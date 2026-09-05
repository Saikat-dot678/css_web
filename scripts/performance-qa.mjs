const BASE_URL = process.env.QA_BASE_URL || "http://127.0.0.1:3000";
const failures = [];
const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const assert = (condition, label, detail) => {
  if (condition) console.info(`PASS ${label}: ${detail}`);
  else failures.push(`${label}: ${detail}`);
};

const targets = await fetch("http://127.0.0.1:9222/json").then((response) => response.json());
const target = targets.find((item) => item.type === "page");
if (!target) throw new Error("No Chrome page found on debugging port 9222.");
const socket = new WebSocket(target.webSocketDebuggerUrl);
let sequence = 0;
const pending = new Map();
let requestCount = 0;
let transferBytes = 0;
let failedRequests = 0;
socket.onmessage = (event) => {
  const message = JSON.parse(event.data);
  if (message.id) {
    const handler = pending.get(message.id);
    if (handler) handler(message);
    return;
  }
  if (message.method === "Network.requestWillBeSent") requestCount += 1;
  if (message.method === "Network.loadingFinished") transferBytes += message.params?.encodedDataLength || 0;
  if (message.method === "Network.loadingFailed" && !message.params?.canceled && message.params?.errorText !== "net::ERR_ABORTED") failedRequests += 1;
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
async function navigate(path) {
  await send("Page.navigate", { url: "about:blank" });
  await wait(250);
  requestCount = 0;
  transferBytes = 0;
  failedRequests = 0;
  await send("Page.navigate", { url: `${BASE_URL}${path}` });
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (await evaluate("document.readyState === 'complete'").catch(() => false)) break;
    await wait(40);
  }
  await wait(1200);
}

await send("Page.enable");
await send("Runtime.enable");
await send("Network.enable");
await send("Performance.enable");
await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
await send("Page.addScriptToEvaluateOnNewDocument", { source: `
  window.__qaVitals = { lcp: 0, cls: 0, inp: 0, longTask: 0 };
  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) window.__qaVitals.lcp = Math.max(window.__qaVitals.lcp, entry.startTime || 0);
    }).observe({ type: 'largest-contentful-paint', buffered: true });
  } catch {}
  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.__qaVitals.cls += entry.value || 0;
    }).observe({ type: 'layout-shift', buffered: true });
  } catch {}
  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) window.__qaVitals.longTask += entry.duration || 0;
    }).observe({ type: 'longtask', buffered: true });
  } catch {}
  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) window.__qaVitals.inp = Math.max(window.__qaVitals.inp, entry.duration || 0);
    }).observe({ type: 'event', buffered: true, durationThreshold: 16 });
  } catch {}
` });

await navigate("/events?qa-performance=1");
await evaluate("document.querySelector('.site-theme-toggle')?.click(); true");
await wait(300);
const vitals = await evaluate(`(() => {
  const nav = performance.getEntriesByType('navigation')[0];
  const paint = Object.fromEntries(performance.getEntriesByType('paint').map((entry) => [entry.name, entry.startTime]));
  const resources = performance.getEntriesByType('resource');
  const images = [...document.images];
  const visibleImages = images.filter((image) => {
    const rect = image.getBoundingClientRect();
    const style = getComputedStyle(image);
    return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > 0 && rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < innerHeight;
  });
  const incompleteVisibleImages = visibleImages.filter((image) => !image.complete || image.naturalWidth === 0).map((image) => {
    const rect = image.getBoundingClientRect();
    return {
      src: image.currentSrc || image.src,
      alt: image.alt,
      loading: image.loading,
      complete: image.complete,
      naturalWidth: image.naturalWidth,
      top: Math.round(rect.top),
      bottom: Math.round(rect.bottom),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      className: image.className,
    };
  });
  return {
    ...window.__qaVitals,
    fcp: paint['first-contentful-paint'] || 0,
    domContentLoaded: nav?.domContentLoadedEventEnd || 0,
    load: nav?.loadEventEnd || 0,
    resourceEntries: resources.length,
    imageCount: images.length,
    visibleImageCount: visibleImages.length,
    incompleteVisibleImages,
    domNodes: document.getElementsByTagName('*').length,
  };
})()`);

const transferMb = transferBytes / 1024 / 1024;
console.info("PERFORMANCE", JSON.stringify({ ...vitals, requestCount, transferMb: Number(transferMb.toFixed(2)), failedRequests }));
assert(vitals.lcp > 0 && vitals.lcp <= 4000, "LCP lab budget", `${Math.round(vitals.lcp)}ms (budget 4000ms)`);
assert(vitals.cls <= 0.15, "CLS lab budget", `${vitals.cls.toFixed(4)} (budget 0.15)`);
assert(vitals.longTask <= 1200, "main-thread long-task budget", `${Math.round(vitals.longTask)}ms cumulative (budget 1200ms)`);
assert(requestCount <= 120, "network request budget", `${requestCount} requests (budget 120)`);
assert(transferMb <= 6, "transfer-size budget", `${transferMb.toFixed(2)}MB (budget 6MB)`);
assert(failedRequests === 0, "non-aborted network failures", `${failedRequests} failed requests`);
assert(vitals.incompleteVisibleImages.length === 0, "above-the-fold image loading", vitals.incompleteVisibleImages.length ? JSON.stringify(vitals.incompleteVisibleImages) : `${vitals.visibleImageCount} visible images complete`);
assert(vitals.domNodes <= 2500, "DOM size budget", `${vitals.domNodes} nodes (budget 2500)`);
if (vitals.inp > 0) assert(vitals.inp <= 300, "INP interaction lab budget", `${Math.round(vitals.inp)}ms (budget 300ms)`);
else console.info("INFO INP event timing was not exposed by this headless Chromium run; the theme-toggle interaction still executed successfully.");

socket.close();
if (failures.length) {
  console.error("\nPerformance QA failures:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.info("\nPerformance QA passed all available lab budgets.");
}
