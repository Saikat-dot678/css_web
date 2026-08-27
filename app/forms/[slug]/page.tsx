import { notFound } from "next/navigation";
import { DynamicForm } from "@/components/forms/DynamicForm";
import { PublicShell } from "@/components/public/PublicShell";
import { getFormAvailability } from "@/lib/forms/submission";
import { getAnnouncements } from "@/lib/repositories/content";
import { countFormResponses, getFormBySlug } from "@/lib/repositories/forms";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const form = await getFormBySlug((await params).slug);
  return { title: form?.title ?? "Form", description: form?.description };
}

export default async function StandaloneFormPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [form, announcements] = await Promise.all([getFormBySlug(slug), getAnnouncements(true)]);
  if (!form || form.kind !== "standalone" || form.status === "draft") notFound();
  const responseCount = await countFormResponses(form.id);
  const availability = getFormAvailability(form, { responseCount });

  return <PublicShell announcements={announcements}><main id="main" className="v4-page v4-form-page">
    <section className="page-intro wrap"><div><p className="kicker">CSS / PUBLIC FORM</p><h1>{form.title}</h1>{form.description && <p>{form.description}</p>}</div></section>
    <section className="event-content-stack wrap"><aside className="registration-panel generic-form-panel">
      {availability.available ? <><div className="registration-head"><span>Form</span><strong>{form.fields.filter((field) => !["sectionHeading", "information", "divider"].includes(field.type)).length} fields</strong></div><DynamicForm form={form} submitUrl={`/api/forms/${encodeURIComponent(form.slug)}/responses`} /></> : <div className="registration-closed"><span>{form.status}</span><h2>This form is not accepting responses.</h2><p>{availability.message}</p></div>}
    </aside></section>
  </main></PublicShell>;
}
