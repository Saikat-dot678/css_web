"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DynamicField } from "@/components/forms/DynamicForm";
import type { Event } from "@/types/event";
import type { FormDefinition, FormField, FormFieldType, FormStatus } from "@/types/forms";

const fieldTypes: [FormFieldType, string][] = [
  ["shortText", "Short text"], ["longText", "Long answer"], ["email", "Email"], ["phone", "Phone"],
  ["number", "Number"], ["url", "URL"], ["dropdown", "Dropdown"], ["multipleChoice", "Multiple choice"],
  ["checkbox", "Checkboxes"], ["date", "Date"], ["time", "Time"], ["dateTime", "Date + time"],
  ["file", "File upload"], ["consent", "Consent"], ["sectionHeading", "Section heading"],
  ["information", "Information text"], ["divider", "Divider"],
];
const optionTypes: FormFieldType[] = ["dropdown", "multipleChoice", "checkbox"];
const textTypes: FormFieldType[] = ["shortText", "longText", "email", "phone", "url"];
const displayTypes: FormFieldType[] = ["sectionHeading", "information", "divider"];
const labelFor = (type: FormFieldType) => fieldTypes.find(([key]) => key === type)?.[1] || "Field";
const toLocalInput = (iso?: string) => {
  if (!iso) return "";
  const date = new Date(iso);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
};
const fromLocalInput = (value: string) => value ? new Date(value).toISOString() : undefined;

export function FormBuilder({ forms, selectedForm, events }: { forms: FormDefinition[]; selectedForm?: FormDefinition; events: Event[] }) {
  const router = useRouter();
  const [draft, setDraft] = useState<FormDefinition | undefined>(selectedForm);
  const [selectedFieldId, setSelectedFieldId] = useState(selectedForm?.fields.toSorted((a, b) => a.order - b.order)[0]?.id);
  const [saveState, setSaveState] = useState("All changes are local until saved.");
  const fields = useMemo(() => draft?.fields.toSorted((a, b) => a.order - b.order) ?? [], [draft]);
  const selectedField = fields.find((field) => field.id === selectedFieldId);

  useEffect(() => {
    setDraft(selectedForm);
    setSelectedFieldId(selectedForm?.fields.toSorted((a, b) => a.order - b.order)[0]?.id);
    setSaveState("All changes are local until saved.");
  }, [selectedForm]);

  const updateDraft = (patch: Partial<FormDefinition>) => setDraft((current) => current ? { ...current, ...patch } : current);
  const updateField = (id: string, patch: Partial<FormField>) => setDraft((current) => current ? {
    ...current,
    fields: current.fields.map((field) => field.id === id ? { ...field, ...patch } : field),
  } : current);

  const removeField = (id: string) => {
    setDraft((current) => current ? { ...current, fields: current.fields.filter((field) => field.id !== id) } : current);
    if (selectedFieldId === id) setSelectedFieldId(undefined);
  };
  const move = (index: number, direction: -1 | 1) => setDraft((current) => {
    if (!current) return current;
    const ordered = current.fields.toSorted((a, b) => a.order - b.order);
    const target = index + direction;
    if (target < 0 || target >= ordered.length) return current;
    [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
    return { ...current, fields: ordered.map((field, order) => ({ ...field, order })) };
  });
  const duplicateField = (index: number) => setDraft((current) => {
    if (!current) return current;
    const ordered = current.fields.toSorted((a, b) => a.order - b.order);
    const source = ordered[index];
    const duplicate = { ...structuredClone(source), id: crypto.randomUUID(), label: `${source.label} copy` };
    ordered.splice(index + 1, 0, duplicate);
    setSelectedFieldId(duplicate.id);
    return { ...current, fields: ordered.map((field, order) => ({ ...field, order })) };
  });
  const add = (type: FormFieldType) => {
    const field: FormField = {
      id: crypto.randomUUID(), type, label: labelFor(type), required: false,
      order: fields.length, options: optionTypes.includes(type) ? ["Option 1", "Option 2"] : undefined,
      allowedFileTypes: type === "file" ? ["application/pdf", "image/jpeg", "image/png", "image/webp"] : undefined,
      maxFileSizeMb: type === "file" ? 5 : undefined,
    };
    setDraft((current) => current ? { ...current, fields: [...current.fields, field] } : current);
    setSelectedFieldId(field.id);
  };

  async function save(status?: FormStatus) {
    if (!draft) return;
    setSaveState("Saving…");
    const editable = {
      slug: draft.slug, title: draft.title, kind: draft.kind, eventOwned: draft.eventOwned,
      submitLabel: draft.submitLabel, fields: draft.fields,
    };
    const response = await fetch(`/api/admin/forms/${draft.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...editable,
        status: status ?? draft.status,
        eventId: draft.eventId ?? null,
        description: draft.description ?? null,
        successTitle: draft.successTitle ?? null,
        successMessage: draft.successMessage ?? null,
        opensAt: draft.opensAt ?? null,
        closesAt: draft.closesAt ?? null,
        responseLimit: draft.responseLimit ?? null,
        fields: fields.map((field, order) => ({ ...field, order })),
      }),
    });
    const payload = await response.json() as { message?: string; form?: FormDefinition };
    if (!response.ok) { setSaveState(payload.message || "Could not save form."); return; }
    if (payload.form) setDraft(payload.form);
    setSaveState("Form saved.");
    router.refresh();
  }

  async function createNew() {
    const title = window.prompt("Form title", "Untitled form");
    if (title === null) return;
    const response = await fetch("/api/admin/forms", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title }) });
    const payload = await response.json() as { message?: string; form?: FormDefinition };
    if (!response.ok || !payload.form) { setSaveState(payload.message || "Could not create form."); return; }
    router.push(`/admin/form-builder?form=${payload.form.id}`);
    router.refresh();
  }

  async function duplicateCurrent() {
    if (!draft) return;
    const response = await fetch("/api/admin/forms", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ duplicateFromId: draft.id }) });
    const payload = await response.json() as { message?: string; form?: FormDefinition };
    if (!response.ok || !payload.form) { setSaveState(payload.message || "Could not duplicate form."); return; }
    router.push(`/admin/form-builder?form=${payload.form.id}`);
    router.refresh();
  }

  async function deleteCurrent() {
    if (!draft || !window.confirm(`Delete “${draft.title}”? Forms with responses cannot be deleted until those responses are removed.`)) return;
    const response = await fetch(`/api/admin/forms/${draft.id}`, { method: "DELETE" });
    const payload = await response.json() as { message?: string };
    if (!response.ok) { setSaveState(payload.message || "Could not delete form."); return; }
    router.push("/admin/form-builder");
    router.refresh();
  }

  if (!draft) return <div className="empty-state"><strong>No forms yet</strong><p>Create a standalone form or create an event to start with an event-owned registration form.</p><button className="admin-primary" type="button" onClick={createNew}>Create form</button></div>;

  const previewHref = draft.kind === "standalone" ? `/forms/${draft.slug}` : draft.eventId ? `/events/${events.find((event) => event.id === draft.eventId)?.slug ?? ""}#register` : "";
  return <>
    <div className="builder-top form-builder-toolbar">
      <select value={draft.id} onChange={(event) => router.push(`/admin/form-builder?form=${event.target.value}`)} aria-label="Select form">
        {forms.map((form) => <option value={form.id} key={form.id}>{form.title} · {form.status}</option>)}
      </select>
      <button className="admin-secondary" type="button" onClick={createNew}>New</button>
      <button className="admin-primary" type="button" onClick={() => save()}>Save</button>
      {draft.status !== "published" && <button className="admin-secondary" type="button" onClick={() => save("published")}>Publish</button>}
      {draft.status === "published" && <button className="admin-secondary" type="button" onClick={() => save("closed")}>Close</button>}
      {draft.status === "closed" && <button className="admin-secondary" type="button" onClick={() => save("published")}>Re-open</button>}
      {previewHref && <Link className="admin-secondary" href={previewHref} target="_blank">Preview ↗</Link>}
      <button className="admin-secondary" type="button" onClick={duplicateCurrent}>Duplicate</button>
      <button className="admin-secondary danger" type="button" onClick={deleteCurrent}>Delete</button>
      <span className="builder-save-state" role="status">{saveState}</span>
    </div>

    <section className="admin-panel form-settings-panel">
      <div className="panel-head"><h2>Form settings</h2><span>{draft.kind === "event" ? "Event-linked" : "Standalone"}</span></div>
      <div className="form-settings-grid">
        <label>Title<input value={draft.title} onChange={(event) => updateDraft({ title: event.target.value })} /></label>
        <label>Slug<input value={draft.slug} onChange={(event) => updateDraft({ slug: event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })} /></label>
        <label>Type<select value={draft.kind} onChange={(event) => { const kind = event.target.value as FormDefinition["kind"]; updateDraft({ kind, eventId: kind === "standalone" ? undefined : draft.eventId, eventOwned: false }); }}><option value="standalone">Standalone</option><option value="event">Event-linked</option></select></label>
        <label>Linked event<select value={draft.eventId || ""} disabled={draft.kind !== "event"} onChange={(event) => updateDraft({ eventId: event.target.value || undefined, eventOwned: false })}><option value="">Choose event</option>{events.map((event) => <option value={event.id} key={event.id}>{event.title}</option>)}</select></label>
        <label>Status<select value={draft.status} onChange={(event) => updateDraft({ status: event.target.value as FormStatus })}><option value="draft">Draft</option><option value="published">Published</option><option value="closed">Closed</option></select></label>
        <label>Submit button<input value={draft.submitLabel} onChange={(event) => updateDraft({ submitLabel: event.target.value })} /></label>
        <label>Open date/time<input type="datetime-local" value={toLocalInput(draft.opensAt)} onChange={(event) => updateDraft({ opensAt: fromLocalInput(event.target.value) })} /></label>
        <label>Close date/time<input type="datetime-local" value={toLocalInput(draft.closesAt)} onChange={(event) => updateDraft({ closesAt: fromLocalInput(event.target.value) })} /></label>
        <label>Response limit<input type="number" min="1" value={draft.responseLimit ?? ""} onChange={(event) => updateDraft({ responseLimit: event.target.value ? Number(event.target.value) : undefined })} /></label>
        <label>Success title<input value={draft.successTitle || ""} onChange={(event) => updateDraft({ successTitle: event.target.value || undefined })} /></label>
        <label className="form-setting-wide">Description<textarea value={draft.description || ""} onChange={(event) => updateDraft({ description: event.target.value || undefined })} /></label>
        <label className="form-setting-wide">Success message<textarea value={draft.successMessage || ""} onChange={(event) => updateDraft({ successMessage: event.target.value || undefined })} /></label>
      </div>
    </section>

    <div className="builder-layout generic-builder-layout">
      <aside className="admin-panel field-library"><h2>Field library</h2>{fieldTypes.map(([type, label]) => <button type="button" onClick={() => add(type)} key={type}>+ {label}</button>)}</aside>
      <section className="admin-panel form-structure-panel"><div className="panel-head"><h2>Form structure</h2><span>{fields.length} items</span></div>
        <div className="builder-structure-list">{fields.map((field, index) => <article className={`builder-field-card ${selectedFieldId === field.id ? "selected" : ""}`} key={field.id} onClick={() => setSelectedFieldId(field.id)}>
          <div><span>{String(index + 1).padStart(2, "0")}</span><strong>{field.label}</strong><small>{labelFor(field.type)}</small></div>
          <div className="builder-actions"><button type="button" onClick={(event) => { event.stopPropagation(); move(index, -1); }} aria-label={`Move ${field.label} up`}>↑</button><button type="button" onClick={(event) => { event.stopPropagation(); move(index, 1); }} aria-label={`Move ${field.label} down`}>↓</button><button type="button" onClick={(event) => { event.stopPropagation(); duplicateField(index); }} aria-label={`Duplicate ${field.label}`}>⧉</button><button type="button" onClick={(event) => { event.stopPropagation(); removeField(field.id); }} aria-label={`Remove ${field.label}`}>×</button></div>
        </article>)}{!fields.length && <div className="empty-state"><strong>No fields yet</strong><p>Add a field from the library.</p></div>}</div>
        {selectedField && <FieldEditor field={selectedField} update={(patch) => updateField(selectedField.id, patch)} />}
      </section>
      <aside className="admin-panel live-form"><p>Live preview</p><h2>{draft.title}</h2>{draft.description && <small>{draft.description}</small>}<div>{fields.map((field) => <DynamicField field={field} disabled key={field.id} />)}</div><button className="solid-link large" type="button" disabled>{draft.submitLabel}</button></aside>
    </div>
  </>;
}

function FieldEditor({ field, update }: { field: FormField; update: (patch: Partial<FormField>) => void }) {
  const input = !displayTypes.includes(field.type);
  return <section className="field-editor"><p className="eyebrow">FIELD / {labelFor(field.type).toUpperCase()}</p><div className="field-editor-grid">
    {field.type !== "divider" && <label>Label<input value={field.label} onChange={(event) => update({ label: event.target.value })} /></label>}
    <label>Type<select value={field.type} onChange={(event) => { const type = event.target.value as FormFieldType; update({ type, required: displayTypes.includes(type) ? false : field.required, options: optionTypes.includes(type) ? field.options || ["Option 1", "Option 2"] : undefined }); }}>{fieldTypes.map(([type, label]) => <option value={type} key={type}>{label}</option>)}</select></label>
    {input && <label className="field-required"><input type="checkbox" checked={field.required} onChange={(event) => update({ required: event.target.checked })} /> Required</label>}
    {input && !["checkbox", "multipleChoice", "consent", "file"].includes(field.type) && <label>Placeholder<input value={field.placeholder || ""} onChange={(event) => update({ placeholder: event.target.value || undefined })} /></label>}
    {field.type !== "divider" && <label className="field-editor-wide">Helper / information text<textarea value={field.helperText || ""} onChange={(event) => update({ helperText: event.target.value || undefined })} /></label>}
    {textTypes.includes(field.type) && <><label>Minimum length<input type="number" min="0" value={field.minLength ?? ""} onChange={(event) => update({ minLength: event.target.value ? Number(event.target.value) : undefined })} /></label><label>Maximum length<input type="number" min="0" value={field.maxLength ?? ""} onChange={(event) => update({ maxLength: event.target.value ? Number(event.target.value) : undefined })} /></label></>}
    {field.type === "number" && <><label>Minimum<input type="number" value={field.min ?? ""} onChange={(event) => update({ min: event.target.value ? Number(event.target.value) : undefined })} /></label><label>Maximum<input type="number" value={field.max ?? ""} onChange={(event) => update({ max: event.target.value ? Number(event.target.value) : undefined })} /></label><label>Step<input type="number" min="0" step="any" value={field.step ?? ""} onChange={(event) => update({ step: event.target.value ? Number(event.target.value) : undefined })} /></label></>}
    {optionTypes.includes(field.type) && <label className="field-editor-wide">Options, one per line<textarea value={(field.options || []).join("\n")} onChange={(event) => update({ options: event.target.value.split(/\r?\n/).map((option) => option.trim()).filter(Boolean) })} /></label>}
    {field.type === "file" && <><label className="field-editor-wide">Allowed MIME types, comma separated<input value={(field.allowedFileTypes || []).join(", ")} onChange={(event) => update({ allowedFileTypes: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) })} /></label><label>Maximum size (MB)<input type="number" min="0.1" max="20" step="0.1" value={field.maxFileSizeMb ?? 5} onChange={(event) => update({ maxFileSizeMb: Number(event.target.value) || 5 })} /></label><label className="field-required"><input type="checkbox" checked={field.allowMultipleFiles || false} onChange={(event) => update({ allowMultipleFiles: event.target.checked })} /> Allow multiple files</label></>}
  </div></section>;
}
