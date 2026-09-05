import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { requireAdmin } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return <div className="admin-app"><AdminSidebar /><div className="admin-main" id="main" tabIndex={-1}>{children}</div></div>;
}
