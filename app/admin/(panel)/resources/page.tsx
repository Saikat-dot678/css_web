import { AdminHeader } from "@/components/admin/AdminHeader";
import { ResourceCreateForm, ResourceEditForm } from "@/components/admin/EntityEditors";
import { getResources } from "@/lib/repositories/resources";
import { resourceCategoryLabel } from "@/lib/utils";

export default async function AdminResourcesPage() {
  const resources = await getResources();
  const today = new Date().toISOString().slice(0, 10);
  return <><AdminHeader title="Resources" description="Maintain opportunities, references and their expiry dates." /><main className="admin-content"><div className="admin-columns"><section className="admin-panel"><div className="panel-head"><h2>Resource desk</h2><span>{resources.length} entries</span></div><div className="management-list">{resources.map((resource, index) => { const expired = Boolean(resource.expiryDate && resource.expiryDate < today); return <article key={resource.id}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{resource.title}</strong><em>{resourceCategoryLabel(resource.category)}{expired ? " · Expired" : ""}</em><p>{resource.description}</p><ResourceEditForm resource={resource} /></div></article>; })}</div></section><aside className="admin-panel"><div className="panel-head"><h2>Add resource</h2></div><ResourceCreateForm /></aside></div></main></>;
}
