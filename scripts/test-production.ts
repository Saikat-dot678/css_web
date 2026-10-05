import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { encodeAdminSession } from "../lib/admin-session";

async function main() {
  process.env.ADMIN_EMAIL = "qa@example.test";
  process.env.ADMIN_PASSWORD = "local-qa-only-password";
  process.env.ADMIN_SESSION_SECRET = "local-qa-only-session-secret";
  const base = "http://127.0.0.1:3100";
  const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", "3100"], {
    env: { ...process.env, NODE_ENV: "production", MONGO_URL: "", VERCEL: "" }, stdio: "ignore",
  });
  try {
    let ready = false;
    for (let attempt = 0; attempt < 50; attempt++) {
      try { await fetch(`${base}/robots.txt`); ready = true; break; } catch { await new Promise((resolve) => setTimeout(resolve, 100)); }
    }
    assert.ok(ready, "Production server must become reachable.");
    for (const path of ["/", "/events", "/projects", "/team", "/resources", "/achievements", "/archive", "/sitemap.xml"]) {
      const response = await fetch(`${base}${path}`);
      assert.equal(response.status, 200, path);
      assert.equal(response.headers.get("x-content-type-options"), "nosniff");
    }
    assert.equal((await fetch(`${base}/admin/projects`, { redirect: "manual" })).status, 307);
    assert.equal((await fetch(`${base}/api/admin/responses/export`)).status, 401);
    const cookie = `css_admin_session=${encodeAdminSession("qa@example.test", Date.now() + 60000)}`;
    for (const path of ["/admin", "/admin/projects", "/admin/events", "/admin/content", "/admin/form-builder", "/admin/team", "/admin/resources", "/admin/responses"]) {
      assert.equal((await fetch(`${base}${path}`, { headers: { cookie }, redirect: "manual" })).status, 200, path);
    }
    assert.equal((await fetch(`${base}/api/admin/forms`, { method: "POST", headers: { cookie, origin: "https://untrusted.example", "content-type": "application/json" }, body: "{}" })).status, 403);
    console.info("Production public routes, authenticated admin routes, anonymous access gates, origin rejection, and security headers passed.");
  } finally {
    server.kill("SIGTERM");
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
