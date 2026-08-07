"use client";

import Link from "next/link";
import { useState } from "react";
import { formatDate, formatStatus } from "@/lib/utils";
import type { Event } from "@/types/event";
import { deleteEventAction } from "@/app/admin/(panel)/actions";

export function AdminEventTable({ events }: { events: Event[] }) {
  const [search, setSearch] = useState("");
  const filtered = events.filter((event) => `${event.title} ${event.category} ${event.status}`.toLowerCase().includes(search.toLowerCase()));
  return <><div className="admin-toolbar"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search events" aria-label="Search events" /><Link className="admin-primary" href="/admin/events/new">New event</Link></div><section className="admin-panel"><div className="table-wrap"><table><thead><tr><th>Event</th><th>Date</th><th>Status</th><th>Poster</th><th>Actions</th></tr></thead><tbody>{filtered.map((event) => <tr key={event.id}><td><strong>{event.title}</strong><small>{event.category}</small></td><td>{formatDate(event.date)}</td><td><span className="admin-status">{formatStatus(event.status)}</span></td><td>{event.poster ? "Ready" : "Missing"}</td><td><Link href={`/admin/events/${event.id}/edit`}>Edit</Link><Link href={`/admin/form-builder?event=${event.id}`}>Form</Link><form action={deleteEventAction} style={{ display: "inline" }}><input type="hidden" name="id" value={event.id} /><button type="submit" onClick={(click) => { if (!window.confirm(`Delete ${event.title}?`)) click.preventDefault(); }}>Delete</button></form></td></tr>)}</tbody></table></div>{!filtered.length && <div className="empty-state"><strong>No matching events</strong><p>Try another search term.</p></div>}</section></>;
}
