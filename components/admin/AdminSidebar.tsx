"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/admin/login/actions";

const items = [
  ["Dashboard", "/admin"],
  ["Events", "/admin/events"],
  ["Form builder", "/admin/form-builder"],
  ["Responses", "/admin/responses"],
  ["Projects", "/admin/projects"],
  ["Resources", "/admin/resources"],
  ["Achievements", "/admin/achievements"],
  ["Team", "/admin/team"],
  ["Content", "/admin/content"],
] as const;

export function AdminSidebar() {
  const pathname = usePathname();
  return <aside className="admin-side"><div className="admin-logo">CSS<br /><span>Admin</span></div><nav>{items.map(([label, href]) => { const active = href === "/admin" ? pathname === href : pathname.startsWith(href); return <Link className={active ? "active" : ""} href={href} key={href}>{label}</Link>; })}</nav><Link href="/" className="admin-public">Public site ↗</Link><form action={logoutAction}><button type="submit" className="admin-logout">Sign out</button></form></aside>;
}
