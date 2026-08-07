"use client";

import { useState } from "react";
import type { RegistrationForm as RegistrationFormType } from "@/types/forms";

export function RegistrationForm({ form, eventSlug }: { form: RegistrationFormType; eventSlug: string }) {
  const [state, setState] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("submitting");
    setMessage("");
    const body = new FormData(event.currentTarget);
    body.set("eventSlug", eventSlug);
    const response = await fetch("/api/registrations", { method: "POST", body });
    const payload = await response.json() as { message?: string };
    if (!response.ok) {
      setState("error");
      setMessage(payload.message || "Registration could not be submitted.");
      return;
    }
    setState("success");
    setMessage("Registration received. A copy is now available to the CSS admin team.");
    event.currentTarget.reset();
  }

  if (state === "success") return <div className="form-success" role="status"><strong>Registration received.</strong><p>{message}</p></div>;

  return <form onSubmit={submit} className={state === "submitting" ? "public-form-loading" : ""} encType="multipart/form-data">
    {state === "error" && <p className="form-error" role="alert">{message}</p>}
    {form.fields.toSorted((a, b) => a.order - b.order).map((field) => <DynamicField field={field} key={field.id} />)}
    <button className="solid-link large" type="submit" disabled={state === "submitting"}>{state === "submitting" ? "Submitting…" : "Submit registration"}</button>
    <small>Required fields are marked with an asterisk. Responses are stored securely by the configured server database.</small>
  </form>;
}

function DynamicField({ field }: { field: RegistrationFormType["fields"][number] }) {
  const required = field.required;
  const label = `${field.label}${required ? " *" : ""}`;
  if (field.type === "sectionHeading") return <div className="form-section"><strong>{field.label}</strong>{field.helperText && <small>{field.helperText}</small>}</div>;
  if (field.type === "longText") return <label className="form-field"><span>{label}</span><textarea name={field.id} placeholder={field.placeholder} required={required} />{field.helperText && <small>{field.helperText}</small>}</label>;
  if (field.type === "dropdown") return <label className="form-field"><span>{label}</span><select name={field.id} required={required} defaultValue=""><option value="" disabled>Select</option>{field.options?.map((option) => <option value={option} key={option}>{option}</option>)}</select>{field.helperText && <small>{field.helperText}</small>}</label>;
  if (field.type === "multipleChoice" || field.type === "checkbox") return <fieldset className="choice-field"><legend>{label}</legend>{field.options?.map((option, index) => <label key={option}><input type={field.type === "multipleChoice" ? "radio" : "checkbox"} name={field.id} value={option} required={required && index === 0} /><span>{option}</span></label>)}{field.helperText && <small>{field.helperText}</small>}</fieldset>;
  if (field.type === "consent") return <label className="check-field"><input type="checkbox" name={field.id} value="Yes" required={required} /><span>{label}</span></label>;
  if (field.type === "file") return <label className="form-field"><span>{label}</span><input type="file" name={field.id} required={required} accept=".pdf,image/*" />{field.helperText && <small>{field.helperText}</small>}</label>;
  const type = field.type === "shortText" ? "text" : field.type === "phone" ? "tel" : field.type;
  return <label className="form-field"><span>{label}</span><input type={type} name={field.id} placeholder={field.placeholder} required={required} />{field.helperText && <small>{field.helperText}</small>}</label>;
}
