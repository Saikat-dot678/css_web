"use server";

import { redirect } from "next/navigation";
import { clearAdminSession, createAdminSession, verifyAdminCredentials } from "@/lib/auth";
import { loginAttemptAllowed } from "@/lib/login-rate-limit";

export async function loginAction(formData: FormData) {
  if (!(await loginAttemptAllowed())) redirect("/admin/login?error=1");
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  if (!(await verifyAdminCredentials(email, password))) redirect("/admin/login?error=1");
  await createAdminSession(email || "local-demo");
  redirect("/admin");
}

export async function logoutAction() {
  await clearAdminSession();
  redirect("/admin/login");
}
