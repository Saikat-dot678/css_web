"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Event } from "@/types/event";
import type { FormField, FormFieldType, RegistrationForm } from "@/types/forms";

const fieldTypes: [FormFieldType, string][] = [
  ["shortText", "Short text"], ["longText", "Long answer"], ["email", "Email"], ["phone", "Phone"], ["number", "Number"], ["dropdown", "Dropdown"], ["multipleChoice", "Multiple choice"], ["checkbox", "Checkboxes"], ["date", "Date"], ["file", "File upload"], ["consent", "Consent"], ["sectionHeading", "Section heading"],
];
const optionTypes: FormFieldType[] = ["dropdown", "multipleChoice", "checkbox"];

export function FormBuilder({ form, events }: { form: RegistrationForm; events: Event[] }) {
  const router = useRouter();
  const [fields, setFields] = useState(form.fields.toSorted((a, b) => a.order - b.order));
  const [saveState, setSaveState] = useState("All changes are local until saved.");

  const update = (id: string, patch: Partial<FormField>) => setFields((items) => items.map((item) => item.id === id ? { ...item, ...patch } : item));
  const remove = (id: string) => setFields((items) => items.filter((item) => item.id !== id));
  const move = (index: number, direction: -1 | 1) => setFields((items) => { const target = index + direction; if (target < 0 || target >= items.length) return items; const copy = [...items]; [copy[index], copy[target]] = [copy[target], copy[index]]; return copy; });
  const duplicate = (index: number) => setFields((items) => { const copy = [...items]; const source = copy[index]; copy.splice(index + 1, 0, { ...structuredClone(source), id: crypto.randomUUID(), label: `${source.label} copy` }); return copy; });
  const add = (type: FormFieldType) => setFields((items) => [...items, { id: crypto.randomUUID(), type, label: fieldTypes.find(([key]) => key === type)?.[1] || "Field", required: false, order: items.length, options: optionTypes.includes(type) ? ["Option 1", "Option 2"] : undefined }]);

  async function save() {
    setSaveState("Saving…");
    const response = await fetch(`/api/admin/forms/${form.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fields: fields.map((field, order) => ({ ...field, order })) }) });
    const payload = await response.json() as { message?: string };
    setSaveState(response.ok ? "Form saved." : payload.message || "Could not save form.");
    if (response.ok) router.refresh();
  }

  return <><div className="builder-top"><select value={form.eventId} onChange={(event) => router.push(`/admin/form-builder?event=${event.target.value}`)}>{events.map((event) => <option value={event.id} key={event.id}>{event.title}</option>)}</select><button className="admin-primary" type="button" onClick={save}>Save form</button><span className="builder-save-state" role="status">{saveState}</span></div><div className="builder-layout"><aside className="admin-panel field-library"><h2>Field library</h2>{fieldTypes.map(([type, label]) => <button type="button" onClick={() => add(type)} key={type}>+ {label}</button>)}</aside><section className="admin-panel"><h2>Form structure</h2><div>{fields.map((field, index) => <article className={`builder-field ${optionTypes.includes(field.type) ? "has-options" : ""}`} key={field.id}><div><span>{String(index + 1).padStart(2, "0")}</span><input aria-label="Field label" value={field.label} onChange={(event) => update(field.id, { label: event.target.value })} /></div><select aria-label="Field type" value={field.type} onChange={(event) => { const type = event.target.value as FormFieldType; update(field.id, { type, required: type === "sectionHeading" ? false : field.required, options: optionTypes.includes(type) ? field.options || ["Option 1", "Option 2"] : undefined }); }}>{fieldTypes.map(([type, label]) => <option value={type} key={type}>{label}</option>)}</select><label><input type="checkbox" checked={field.required} disabled={field.type === "sectionHeading"} onChange={(event) => update(field.id, { required: event.target.checked })} /> Required</label><div className="builder-actions"><button type="button" onClick={() => move(index, -1)} aria-label="Move up">↑</button><button type="button" onClick={() => move(index, 1)} aria-label="Move down">↓</button><button type="button" onClick={() => duplicate(index)} aria-label="Duplicate">⧉</button><button type="button" onClick={() => remove(field.id)} aria-label="Remove">×</button></div><label className="builder-placeholder">Placeholder<input value={field.placeholder || ""} onChange={(event) => update(field.id, { placeholder: event.target.value })} /></label>{optionTypes.includes(field.type) && <label className="builder-options">Options, one per line<textarea value={(field.options || []).join("\n")} onChange={(event) => update(field.id, { options: event.target.value.split(/\r?\n/).map((option) => option.trim()).filter(Boolean) })} /></label>}</article>)}{!fields.length && <div className="empty-state"><strong>No fields yet</strong><p>Add a field from the library.</p></div>}</div></section><aside className="admin-panel live-form"><p>Public preview</p><h2>{form.title.replace(/ registration$/i, "")}</h2><div>{fields.map((field) => <PreviewField field={field} key={field.id} />)}</div></aside></div></>;
}

function PreviewField({ field }: { field: FormField }) {
  if (field.type === "sectionHeading") return <div className="form-section"><strong>{field.label}</strong></div>;
  if (field.type === "longText") return <label className="form-field"><span>{field.label}{field.required ? " *" : ""}</span><textarea disabled placeholder={field.placeholder} /></label>;
  if (field.type === "dropdown") return <label className="form-field"><span>{field.label}{field.required ? " *" : ""}</span><select disabled><option>Select</option>{field.options?.map((option) => <option key={option}>{option}</option>)}</select></label>;
  if (["multipleChoice", "checkbox"].includes(field.type)) return <fieldset className="choice-field"><legend>{field.label}{field.required ? " *" : ""}</legend>{field.options?.map((option) => <label key={option}><input disabled type={field.type === "multipleChoice" ? "radio" : "checkbox"} /><span>{option}</span></label>)}</fieldset>;
  if (field.type === "consent") return <label className="check-field"><input type="checkbox" disabled /><span>{field.label}{field.required ? " *" : ""}</span></label>;
  return <label className="form-field"><span>{field.label}{field.required ? " *" : ""}</span><input disabled type={field.type === "shortText" ? "text" : field.type} placeholder={field.placeholder} /></label>;
}
