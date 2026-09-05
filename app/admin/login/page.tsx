import { redirect } from "next/navigation";
import { adminAuthConfigured, adminDemoModeEnabled, isAdminAuthenticated } from "@/lib/auth";
import { loginAction } from "./actions";

export const metadata = { title: "Admin login" };

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await isAdminAuthenticated()) redirect("/admin");
  const error = (await searchParams).error;
  const configured = adminAuthConfigured();
  const demoMode = adminDemoModeEnabled();
  const message = configured
    ? "Use the administrator credentials configured on this server."
    : demoMode
      ? "Local demo mode is active because admin credentials are not configured."
      : "Admin access is disabled because production credentials are not configured.";

  return <main className="login-shell" id="main"><section className="login-card"><p className="kicker">CSS / Content Desk</p><h1>Admin access</h1><p>{message}</p>{error && <p className="admin-error" role="alert">The email or password was not accepted.</p>}{configured || demoMode ? <form action={loginAction}><label className="admin-field">Email<input name="email" type="email" autoComplete="username" required /></label><label className="admin-field">Password<input name="password" type="password" autoComplete="current-password" required /></label><button className="admin-primary" type="submit">Sign in</button></form> : <p className="admin-error" role="alert">Set both ADMIN_EMAIL and ADMIN_PASSWORD, then restart the server before using the admin panel.</p>}</section></main>;
}
