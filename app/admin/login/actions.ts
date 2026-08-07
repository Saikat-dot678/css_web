"use server";

import { redirect } from "next/navigation";
import { clearAdminSession, createAdminSession, verifyAdminCredentials } from "@/lib/auth";

export async function loginAction(formData: FormData) {
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
