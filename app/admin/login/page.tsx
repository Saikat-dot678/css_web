import { redirect } from "next/navigation";
import { adminAuthConfigured, isAdminAuthenticated } from "@/lib/auth";
import { loginAction } from "./actions";

export const metadata = { title: "Admin login" };

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await isAdminAuthenticated()) redirect("/admin");
  const error = (await searchParams).error;
  return <main className="login-shell" id="main"><section className="login-card"><p className="kicker">CSS / Content Desk</p><h1>Admin access</h1><p>{adminAuthConfigured() ? "Use the administrator credentials configured on this server." : "Local demo mode is active because admin credentials are not configured."}</p>{error && <p className="admin-error" role="alert">The email or password was not accepted.</p>}<form action={loginAction}><label className="admin-field">Email<input name="email" type="email" autoComplete="username" required /></label><label className="admin-field">Password<input name="password" type="password" autoComplete="current-password" required /></label><button className="admin-primary" type="submit">Sign in</button></form></section></main>;
}
