"use client";

import { useState } from "react";
import type { FormDefinition, FormField } from "@/types/forms";

const displayOnly = (type: FormField["type"]) => ["sectionHeading", "information", "divider"].includes(type);

export function DynamicForm({
  form,
  submitUrl,
  hiddenFields = {},
  preview = false,
}: {
  form: FormDefinition;
  submitUrl: string;
  hiddenFields?: Record<string, string>;
  preview?: boolean;
}) {
  const [state, setState] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (preview) return;
    setState("submitting");
    setMessage("");
    const body = new FormData(event.currentTarget);
    for (const [key, value] of Object.entries(hiddenFields)) body.set(key, value);
    const response = await fetch(submitUrl, { method: "POST", body });
    const payload = await response.json() as { message?: string };
    if (!response.ok) {
      setState("error");
      setMessage(payload.message || "The form could not be submitted.");
      return;
    }
    setState("success");
    setMessage(form.successMessage || payload.message || "Your response has been recorded.");
    event.currentTarget.reset();
  }

  if (state === "success" && !preview) {
    return <div className="form-success" role="status"><strong>{form.successTitle || "Response received."}</strong><p>{message}</p></div>;
  }

  return <form onSubmit={submit} className={state === "submitting" ? "public-form-loading" : ""} encType="multipart/form-data">
    {state === "error" && <p className="form-error" role="alert">{message}</p>}
    {form.fields.toSorted((a, b) => a.order - b.order).map((field) => <DynamicField field={field} disabled={preview} key={field.id} />)}
    {!preview && <button className="solid-link large" type="submit" disabled={state === "submitting"}>{state === "submitting" ? "Submitting…" : form.submitLabel}</button>}
    {!preview && <small>Required fields are marked with an asterisk. Validation is enforced again on the server before a response is stored.</small>}
  </form>;
}

export function DynamicField({ field, disabled = false }: { field: FormField; disabled?: boolean }) {
  const required = field.required && !displayOnly(field.type);
  const label = `${field.label}${required ? " *" : ""}`;
  if (field.type === "sectionHeading") return <div className="form-section"><strong>{field.label}</strong>{field.helperText && <small>{field.helperText}</small>}</div>;
  if (field.type === "information") return <div className="form-information"><strong>{field.label}</strong>{field.helperText && <p>{field.helperText}</p>}</div>;
  if (field.type === "divider") return <hr className="form-divider" aria-hidden="true" />;
  if (field.type === "longText") return <label className="form-field"><span>{label}</span><textarea name={field.id} placeholder={field.placeholder} required={required} disabled={disabled} minLength={field.minLength} maxLength={field.maxLength} />{field.helperText && <small>{field.helperText}</small>}</label>;
  if (field.type === "dropdown") return <label className="form-field"><span>{label}</span><select name={field.id} required={required} disabled={disabled} defaultValue=""><option value="" disabled>Select</option>{field.options?.map((option) => <option value={option} key={option}>{option}</option>)}</select>{field.helperText && <small>{field.helperText}</small>}</label>;
  if (field.type === "multipleChoice" || field.type === "checkbox") return <fieldset className="choice-field" disabled={disabled}><legend>{label}</legend>{field.options?.map((option) => <label key={option}><input type={field.type === "multipleChoice" ? "radio" : "checkbox"} name={field.id} value={option} required={required && field.type === "multipleChoice"} /><span>{option}</span></label>)}{field.helperText && <small>{field.helperText}</small>}</fieldset>;
  if (field.type === "consent") return <label className="check-field"><input type="checkbox" name={field.id} value="Yes" required={required} disabled={disabled} /><span>{label}</span>{field.helperText && <small>{field.helperText}</small>}</label>;
  if (field.type === "file") return <label className="form-field"><span>{label}</span><input type="file" name={field.id} required={required} disabled={disabled} accept={field.allowedFileTypes?.join(",") || "application/pdf,image/jpeg,image/png,image/webp"} multiple={field.allowMultipleFiles} />{field.helperText && <small>{field.helperText}</small>}</label>;
  const type = field.type === "shortText" ? "text" : field.type === "phone" ? "tel" : field.type === "dateTime" ? "datetime-local" : field.type;
  return <label className="form-field"><span>{label}</span><input
    type={type}
    name={field.id}
    placeholder={field.placeholder}
    required={required}
    disabled={disabled}
    minLength={["shortText", "email", "phone", "url"].includes(field.type) ? field.minLength : undefined}
    maxLength={["shortText", "email", "phone", "url"].includes(field.type) ? field.maxLength : undefined}
    min={field.type === "number" ? field.min : undefined}
    max={field.type === "number" ? field.max : undefined}
    step={field.type === "number" ? field.step : undefined}
  />{field.helperText && <small>{field.helperText}</small>}</label>;
}
