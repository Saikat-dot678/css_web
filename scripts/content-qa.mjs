const BASE_URL = process.env.QA_BASE_URL || "http://127.0.0.1:3000";
const failures = [];
const runtimeErrors = [];
const resourceErrors = [];
const pass = (label) => console.info(`PASS ${label}`);
const fail = (label, detail = "assertion failed") => failures.push(`${label}: ${detail}`);
const assert = (condition, label, detail) => condition ? pass(label) : fail(label, detail);
const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

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

async function navigate(path, settle = 180) {
  await send("Page.navigate", { url: `${BASE_URL}${path}` });
  for (let attempt = 0; attempt < 120; attempt += 1) {
    if (await evaluate("document.readyState === 'complete'").catch(() => false)) break;
    await wait(50);
  }
  await wait(settle);
}

async function poll(expression, timeout = 20000, interval = 100) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    const result = await evaluate(expression).catch(() => null);
    if (result) return result;
    await wait(interval);
  }
  return null;
}

async function submit(buttonText, values = {}, scopeText = null, noValidate = false) {
  const result = await evaluate(`(() => {
    const buttonText = ${JSON.stringify(buttonText)};
    const scopeText = ${JSON.stringify(scopeText)};
    const values = ${JSON.stringify(values)};
    const forms = [...document.querySelectorAll('form')];
    const form = forms.find((candidate) => {
      const button = [...candidate.querySelectorAll('button')].find((item) => (item.textContent || '').trim().includes(buttonText));
      if (!button) return false;
      if (!scopeText) return true;
      const scope = candidate.closest('article') || candidate.parentElement;
      return Boolean(scope && ((scope.innerText || '').includes(scopeText) || [...scope.querySelectorAll('input,textarea')].some((control) => control.value.includes(scopeText))));
    });
    if (!form) return { ok: false, reason: 'form not found', buttonText, scopeText };
    form.noValidate = ${JSON.stringify(noValidate)};
    for (const [name, value] of Object.entries(values)) {
      const controls = [...form.querySelectorAll('[name="' + CSS.escape(name) + '"]')];
      if (!controls.length) return { ok: false, reason: 'control not found', name };
      for (const control of controls) {
        if (control instanceof HTMLInputElement && (control.type === 'checkbox' || control.type === 'radio')) control.checked = Boolean(value);
        else control.value = String(value ?? '');
        control.dispatchEvent(new Event('input', { bubbles: true }));
        control.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
    const button = [...form.querySelectorAll('button')].find((item) => (item.textContent || '').trim().includes(buttonText));
    form.requestSubmit(button);
    return { ok: true };
  })()`);
  assert(result.ok, `locate and submit ${buttonText}${scopeText ? ` for ${scopeText}` : ""}`, JSON.stringify(result));
  if (result.ok) await wait(250);
  return result.ok;
}

async function fetchText(path) {
  const response = await fetch(`${BASE_URL}${path}`, { redirect: "manual" });
  return { status: response.status, text: await response.text() };
}

const pageText = (html) => html.replace(/<!--.*?-->/gs, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");

const announcementExists = (text) => `[
  ...document.querySelectorAll('.content-announcement-list article')
].some((article) => article.textContent.includes(${JSON.stringify(text)}) || [...article.querySelectorAll('input,textarea')].some((control) => control.value.includes(${JSON.stringify(text)})))`;
const announcementMissing = (text) => `!(${announcementExists(text)})`;

await send("Page.enable");
await send("Runtime.enable");
await send("Network.enable");

const stamp = Date.now();
const firstTitle = `Content QA A ${stamp}`;
const secondTitle = `Content QA B ${stamp}`;
const updatedTitle = `${firstTitle} Updated`;
let originals;

try {
  await navigate("/admin/content");
  originals = await evaluate(`(() => ({
    heroHeadline: document.querySelector('[name=heroHeadline]')?.value,
    heroDescription: document.querySelector('[name=heroDescription]')?.value,
    recruitmentText: document.querySelector('[name=recruitmentText]')?.value,
    currentAcademicYear: document.querySelector('[name=currentAcademicYear]')?.value,
    recruitmentOpen: document.querySelector('[name=recruitmentOpen]')?.checked,
  }))()`);
  assert(Object.values(originals).slice(0, 4).every(Boolean), "Content editor loads all current SiteContent values", JSON.stringify(originals));

  await submit("Save homepage content", { ...originals, heroHeadline: "   " }, null, true);
  assert(Boolean(await poll("document.querySelector('.content-form .admin-form-status.error')?.textContent.includes('headline')")), "whitespace-only headline returns an inline validation error");
  let publicPage = await fetchText("/");
  assert(publicPage.status === 200 && publicPage.text.includes(originals.heroHeadline), "invalid Content input does not mutate public data", `status ${publicPage.status}`);

  await submit("Save homepage content", { ...originals, currentAcademicYear: "2026-99" }, null, true);
  assert(Boolean(await poll("document.querySelector('.content-form .admin-form-status.error')?.textContent.includes('immediately follow')")), "non-consecutive academic year returns a useful server validation error");

  const temporary = {
    heroHeadline: `Content QA headline ${stamp}`,
    heroDescription: `Content QA description ${stamp} confirms the current homepage lead copy.`,
    recruitmentText: `Content QA recruitment message ${stamp}.`,
    currentAcademicYear: "2027-28",
    recruitmentOpen: false,
  };
  await submit("Save homepage content", temporary);
  assert(Boolean(await poll("document.querySelector('.content-form .admin-form-status.success')?.textContent.includes('saved')")), "Content save reports success");
  publicPage = await fetchText("/");
  assert(publicPage.status === 200 && [temporary.heroHeadline, temporary.heroDescription, temporary.recruitmentText, temporary.currentAcademicYear, "RECRUITMENT CLOSED", "MEET THE"].every((text) => pageText(publicPage.text).includes(text)), "all Content fields reach the current homepage in recruitment-closed state", `status ${publicPage.status}`);
  let teamPage = await fetchText("/team");
  assert(teamPage.status === 200 && teamPage.text.includes(temporary.currentAcademicYear) && teamPage.text.includes(temporary.recruitmentText) && teamPage.text.includes("Recruitment is currently closed."), "academic year and closed recruitment state reach the public team page", `status ${teamPage.status}`);

  await submit("Save homepage content", { ...temporary, recruitmentOpen: true });
  publicPage = await fetchText("/");
  teamPage = await fetchText("/team");
  assert(pageText(publicPage.text).includes("RECRUITMENT OPEN") && pageText(publicPage.text).includes("Join CSS"), "recruitment-open state updates the homepage without stale copy");
  assert(teamPage.text.includes("Recruitment open") && teamPage.text.includes("See yourself in the next cohort?"), "recruitment-open state updates the team CTA");

  await submit("Save homepage content", originals);
  assert(Boolean(await poll(`document.querySelector('[name=currentAcademicYear]')?.value === ${JSON.stringify(originals.currentAcademicYear)}`)), "original SiteContent values are restored in Admin");
  publicPage = await fetchText("/");
  assert(publicPage.text.includes(originals.heroHeadline) && publicPage.text.includes(originals.currentAcademicYear), "restored SiteContent is immediately public");

  await submit("Add announcement", { title: "   ", content: "   ", pinned: false, published: false }, null, true);
  assert(Boolean(await poll("document.querySelector('aside .admin-form-status.error')?.textContent.includes('title')")), "whitespace-only announcement returns an inline validation error");

  await submit("Add announcement", { title: firstTitle, content: "Draft announcement content.", pinned: false, published: false });
  assert(Boolean(await poll(announcementExists(firstTitle))), "draft announcement create refreshes the Admin list");
  publicPage = await fetchText("/");
  assert(!publicPage.text.includes(firstTitle), "unpublished announcement stays private");

  await submit("Save announcement", { title: updatedTitle, content: "Published announcement content.", pinned: false, published: true }, firstTitle);
  assert(Boolean(await poll(announcementExists(updatedTitle))), "announcement edit refreshes the Admin list");
  publicPage = await fetchText("/");
  assert(publicPage.text.includes(updatedTitle) && publicPage.text.includes("Published announcement content."), "published announcement title and content appear publicly");

  await submit("Add announcement", { title: secondTitle, content: "Second published announcement.", pinned: false, published: true });
  assert(Boolean(await poll(announcementExists(secondTitle))), "second announcement create refreshes the Admin list");
  publicPage = await fetchText("/");
  assert(publicPage.text.indexOf(secondTitle) < publicPage.text.indexOf(updatedTitle), "unpinned announcements use updated-time secondary ordering");

  await submit("Save announcement", { title: updatedTitle, content: "Pinned announcement content.", pinned: true, published: true }, updatedTitle);
  publicPage = await fetchText("/");
  assert(publicPage.text.indexOf(updatedTitle) < publicPage.text.indexOf(secondTitle) && publicPage.text.includes("PINNED"), "pinning gives an announcement priority publicly");

  await submit("Save announcement", { title: updatedTitle, content: "Unpinned announcement content.", pinned: false, published: true }, updatedTitle);
  assert(Boolean(await poll(`(() => { const article = [...document.querySelectorAll('.content-announcement-list article')].find((item) => item.textContent.includes(${JSON.stringify(updatedTitle)})); return article && !article.textContent.includes('Pinned ·'); })()`)), "unpinning updates Admin state");

  await submit("Save announcement", { title: updatedTitle, content: "Private again.", pinned: false, published: false }, updatedTitle);
  publicPage = await fetchText("/");
  assert(!publicPage.text.includes(updatedTitle) && publicPage.text.includes(secondTitle), "unpublishing removes only that announcement from public output");

  await submit("Save announcement", { title: secondTitle, content: "Second announcement edited.", pinned: false, published: true }, secondTitle);
  for (const route of ["/", "/events", "/archive", "/projects", "/resources", "/events/resume-rewired"]) {
    const page = await fetchText(route);
    assert(page.status === 200 && page.text.includes(secondTitle) && page.text.includes("Second announcement edited."), `announcement edit is fresh on ${route}`, `status ${page.status}`);
  }

  const viewports = [[1440, 900], [1024, 768], [768, 1024], [430, 932], [390, 844], [360, 800]];
  for (const [width, height] of viewports) {
    await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width < 700 });
    await navigate("/admin/content", 100);
    const layout = await evaluate(`(() => ({
      viewport: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      unlabeled: [...document.querySelectorAll('input:not([type="hidden"]),textarea')].filter((control) => !control.closest('label') && !control.labels?.length && !control.getAttribute('aria-label')).length,
      badButtons: [...document.querySelectorAll('button')].filter((button) => (button.getAttribute('type') || 'submit') !== 'submit').length,
      details: document.querySelectorAll('details > summary').length,
      saveVisible: Boolean([...document.querySelectorAll('button')].find((button) => button.textContent.includes('Save homepage content'))),
    }))()`);
    assert(layout.scrollWidth <= layout.viewport + 1 && layout.unlabeled === 0 && layout.badButtons === 0 && layout.details > 0 && layout.saveVisible, `Admin Content accessibility/layout ${width}x${height}`, JSON.stringify(layout));
  }
} finally {
  await send("Emulation.clearDeviceMetricsOverride").catch(() => undefined);
  await navigate("/admin/content").catch(() => undefined);
  for (const title of [updatedTitle, firstTitle, secondTitle]) {
    if (await poll(announcementExists(title), 20000).catch(() => false)) {
      await submit("Delete", {}, title).catch(() => undefined);
      await poll(announcementMissing(title), 20000).catch(() => undefined);
    }
  }
  if (originals?.heroHeadline) {
    await submit("Save homepage content", originals).catch(() => undefined);
  }
}

assert(runtimeErrors.length === 0, "no browser console errors or exceptions", [...new Set(runtimeErrors)].join(" | "));
assert(resourceErrors.length === 0, "no failed document/static resources", [...new Set(resourceErrors)].join(" | "));
socket.close();
if (failures.length) {
  console.error("\nContent runtime QA failures:");
  for (const issue of failures) console.error(`- ${issue}`);
  process.exitCode = 1;
} else {
  console.info("\nAdmin Content runtime QA passed with all temporary data restored and announcements removed.");
}
