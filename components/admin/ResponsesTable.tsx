"use client";

import { useMemo, useRef, useState } from "react";
import { deleteRegistrationAction } from "@/app/admin/(panel)/actions";
import type { Event } from "@/types/event";
import type { Registration, RegistrationForm } from "@/types/forms";

type Props = {
  events: Event[];
  registrations: Registration[];
  forms: RegistrationForm[];
  initialEventId?: string;
};

export function ResponsesTable({ events, registrations, forms, initialEventId = "" }: Props) {
  const [eventId, setEventId] = useState(initialEventId);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Registration | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const eventMap = useMemo(() => new Map(events.map((event) => [event.id, event])), [events]);
  const fieldMap = useMemo(() => new Map(forms.map((form) => [form.eventId, form.fields])), [forms]);
  const filtered = registrations.filter((registration) => {
    if (eventId && registration.eventId !== eventId) return false;
    const haystack = `${registration.name} ${registration.email} ${Object.values(registration.answers).flat().join(" ")}`.toLowerCase();
    return haystack.includes(query.toLowerCase());
  });

  function inspect(registration: Registration) {
    setSelected(registration);
    dialogRef.current?.showModal();
  }

  return <>
    <div className="responses-controls">
      <label className="sr-only" htmlFor="response-search">Search responses</label>
      <input id="response-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, email or answer" />
      <label className="sr-only" htmlFor="response-event">Filter by event</label>
      <select id="response-event" value={eventId} onChange={(event) => setEventId(event.target.value)}>
        <option value="">All events</option>
        {events.map((event) => <option value={event.id} key={event.id}>{event.title}</option>)}
      </select>
      <a className="admin-primary" href={`/api/admin/responses/export${eventId ? `?event=${encodeURIComponent(eventId)}` : ""}`}>Export CSV</a>
    </div>
    <div className="table-wrap">
      <table>
        <thead><tr><th>Respondent</th><th>Event</th><th>Submitted</th><th>Answers</th><th>Actions</th></tr></thead>
        <tbody>{filtered.map((registration) => <tr key={registration.id}>
          <td><strong>{registration.name}</strong><small>{registration.email}</small></td>
          <td>{eventMap.get(registration.eventId)?.title ?? registration.eventSlug}</td>
          <td>{new Date(registration.submittedAt).toLocaleString("en-IN")}</td>
          <td>{Object.keys(registration.answers).length}</td>
          <td><button type="button" onClick={() => inspect(registration)}>Inspect</button><form action={deleteRegistrationAction} className="inline-form"><input type="hidden" name="id" value={registration.id} /><button type="submit">Delete</button></form></td>
        </tr>)}</tbody>
      </table>
      {!filtered.length && <div className="empty-state"><strong>No responses</strong><p>Try a different filter or wait for the next registration.</p></div>}
    </div>
    <dialog ref={dialogRef} className="response-dialog" onClose={() => setSelected(null)}>
      <button type="button" onClick={() => dialogRef.current?.close()}>Close</button>
      {selected && <><p className="eyebrow">{eventMap.get(selected.eventId)?.title ?? selected.eventSlug}</p><h2>{selected.name}</h2><dl>
        <div><dt>Email</dt><dd>{selected.email}</dd></div>
        <div><dt>Submitted</dt><dd>{new Date(selected.submittedAt).toLocaleString("en-IN")}</dd></div>
        {Object.entries(selected.answers).map(([fieldId, answer]) => {
          const label = fieldMap.get(selected.eventId)?.find((field) => field.id === fieldId)?.label ?? fieldId;
          return <div key={fieldId}><dt>{label}</dt><dd>{Array.isArray(answer) ? answer.join(", ") : answer || "—"}</dd></div>;
        })}
      </dl></>}
    </dialog>
  </>;
}
