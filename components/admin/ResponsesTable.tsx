"use client";

import { useMemo, useRef, useState } from "react";
import { deleteRegistrationAction } from "@/app/admin/(panel)/actions";
import type { Event } from "@/types/event";
import type { FormDefinition, FormField, FormResponse } from "@/types/forms";

type Props = {
  events: Event[];
  responses: FormResponse[];
  forms: FormDefinition[];
  initialFormId?: string;
  initialEventId?: string;
};

const answerText = (value: FormResponse["answers"][string] | undefined) => Array.isArray(value) ? value.join(", ") : value || "";

export function ResponsesTable({ events, responses, forms, initialFormId = "", initialEventId = "" }: Props) {
  const [formId, setFormId] = useState(initialFormId);
  const [eventId, setEventId] = useState(initialEventId);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<FormResponse | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const eventMap = useMemo(() => new Map(events.map((event) => [event.id, event])), [events]);
  const formMap = useMemo(() => new Map(forms.map((form) => [form.id, form])), [forms]);
  const filtered = responses.filter((response) => {
    if (formId && response.formId !== formId) return false;
    if (eventId && response.eventId !== eventId) return false;
    const form = formMap.get(response.formId);
    const haystack = `${response.name || ""} ${response.email || ""} ${form?.title || response.formSlug} ${Object.values(response.answers).flat().join(" ")}`.toLowerCase();
    return haystack.includes(query.toLowerCase());
  });

  function inspect(response: FormResponse) {
    setSelected(response);
    dialogRef.current?.showModal();
  }

  const exportQuery = new URLSearchParams();
  if (formId) exportQuery.set("form", formId);
  if (eventId) exportQuery.set("event", eventId);

  return <>
    <div className="responses-controls generic-responses-controls">
      <label className="sr-only" htmlFor="response-search">Search responses</label>
      <input id="response-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search any answer" />
      <label className="sr-only" htmlFor="response-form">Filter by form</label>
      <select id="response-form" value={formId} onChange={(event) => setFormId(event.target.value)}><option value="">All forms</option>{forms.map((form) => <option value={form.id} key={form.id}>{form.title}</option>)}</select>
      <label className="sr-only" htmlFor="response-event">Filter by event</label>
      <select id="response-event" value={eventId} onChange={(event) => setEventId(event.target.value)}><option value="">All events</option>{events.map((event) => <option value={event.id} key={event.id}>{event.title}</option>)}</select>
      <a className="admin-primary" href={`/api/admin/responses/export${exportQuery.size ? `?${exportQuery.toString()}` : ""}`}>Export CSV</a>
    </div>
    <div className="table-wrap"><table><thead><tr><th>Respondent</th><th>Form</th><th>Event</th><th>Submitted</th><th>Answers</th><th>Actions</th></tr></thead><tbody>{filtered.map((response) => {
      const form = formMap.get(response.formId);
      const summary = responseSummary(response, form);
      return <tr key={response.id}><td><strong>{summary.primary}</strong><small>{summary.secondary}</small></td><td>{form?.title ?? response.formSlug}</td><td>{response.eventId ? eventMap.get(response.eventId)?.title ?? response.eventSlug ?? "Linked event" : "Standalone"}</td><td>{new Date(response.submittedAt).toLocaleString("en-IN")}</td><td>{Object.keys(response.answers).length}</td><td><button type="button" onClick={() => inspect(response)}>Inspect</button><form action={deleteRegistrationAction} className="inline-form"><input type="hidden" name="id" value={response.id} /><button type="submit" onClick={(click) => { if (!window.confirm("Delete this response? This cannot be undone.")) click.preventDefault(); }}>Delete</button></form></td></tr>;
    })}</tbody></table>{!filtered.length && <div className="empty-state"><strong>No responses</strong><p>Try another form, event, or search term.</p></div>}</div>
    <dialog ref={dialogRef} className="response-dialog" onClose={() => setSelected(null)}>
      <button type="button" onClick={() => dialogRef.current?.close()}>Close</button>
      {selected && <ResponseDetail response={selected} form={formMap.get(selected.formId)} event={selected.eventId ? eventMap.get(selected.eventId) : undefined} />}
    </dialog>
  </>;
}

function responseSummary(response: FormResponse, form?: FormDefinition) {
  const fields = form?.fields.toSorted((a, b) => a.order - b.order) ?? [];
  const named = fields.find((field) => field.type === "shortText" && /name|student|applicant|respondent/i.test(field.label));
  const firstText = named ?? fields.find((field) => field.type === "shortText");
  const emailField = fields.find((field) => field.type === "email");
  const primary = answerText(firstText ? response.answers[firstText.id] : undefined) || response.name || `Response ${response.id.slice(-8)}`;
  const secondary = answerText(emailField ? response.answers[emailField.id] : undefined) || response.email || form?.title || response.formSlug;
  return { primary, secondary };
}

function ResponseDetail({ response, form, event }: { response: FormResponse; form?: FormDefinition; event?: Event }) {
  const fields = form?.fields.toSorted((a, b) => a.order - b.order).filter((field) => !["sectionHeading", "information", "divider"].includes(field.type)) ?? [];
  const fieldMap = new Map(fields.map((field) => [field.id, field]));
  return <><p className="eyebrow">{form?.title ?? response.formSlug}</p><h2>{responseSummary(response, form).primary}</h2><dl><div><dt>Event</dt><dd>{event?.title ?? response.eventSlug ?? "Standalone form"}</dd></div><div><dt>Submitted</dt><dd>{new Date(response.submittedAt).toLocaleString("en-IN")}</dd></div>{Object.entries(response.answers).map(([fieldId, answer]) => {
    const field = fieldMap.get(fieldId);
    return <div key={fieldId}><dt>{field?.label ?? fieldId}</dt><dd>{renderAnswer(answer, field)}</dd></div>;
  })}</dl></>;
}

function renderAnswer(answer: FormResponse["answers"][string], field?: FormField) {
  const values = Array.isArray(answer) ? answer : [answer];
  if (field?.type === "file") return <>{values.map((value, index) => <span key={`${value}-${index}`}><a href={value} target="_blank" rel="noreferrer">Open file ↗</a>{index < values.length - 1 ? ", " : ""}</span>)}</>;
  return values.join(", ") || "—";
}
