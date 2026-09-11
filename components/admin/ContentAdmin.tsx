"use client";

import { useActionState, useCallback, useEffect, useRef, useState } from "react";

import {
  createAnnouncementAction,
  deleteAnnouncementAction,
  updateAnnouncementAction,
  updateSiteContentAction,
  type ContentActionState,
} from "@/app/admin/(panel)/actions";
import type { Announcement, SiteContent } from "@/types/content";

const initialState: ContentActionState = { status: "idle", message: "" };

function FieldError({ state, name, id }: { state: ContentActionState; name: string; id: string }) {
  const message = state.fieldErrors?.[name]?.[0];
  return message ? <span className="admin-field-error" id={id}>{message}</span> : null;
}

function FormStatus({ state }: { state: ContentActionState }) {
  if (state.status === "idle") return null;
  return (
    <p className={`admin-form-status ${state.status}`} role={state.status === "error" ? "alert" : "status"} aria-live="polite">
      {state.message}
    </p>
  );
}

function Check({ id, name, label, defaultChecked }: { id: string; name: string; label: string; defaultChecked?: boolean }) {
  return <label className="inline-check" htmlFor={id}><input id={id} type="checkbox" name={name} defaultChecked={defaultChecked} /> {label}</label>;
}

function SiteContentForm({ content }: { content: SiteContent }) {
  const [state, action, pending] = useActionState(updateSiteContentAction, initialState);
  return (
    <form action={action} className="content-form">
      <label htmlFor="heroHeadline">Homepage lead headline
        <input id="heroHeadline" name="heroHeadline" required minLength={5} maxLength={240} defaultValue={content.heroHeadline} aria-describedby="heroHeadline-help heroHeadline-error" />
        <small id="heroHeadline-help">Shown in the first content section after the cinematic intro.</small>
        <FieldError state={state} name="heroHeadline" id="heroHeadline-error" />
      </label>
      <label htmlFor="heroDescription">Homepage lead description
        <textarea id="heroDescription" name="heroDescription" required minLength={5} maxLength={1000} defaultValue={content.heroDescription} aria-describedby="heroDescription-help heroDescription-error" />
        <small id="heroDescription-help">Supports the lead headline without changing the intro sequence.</small>
        <FieldError state={state} name="heroDescription" id="heroDescription-error" />
      </label>
      <label htmlFor="recruitmentText">Recruitment text
        <textarea id="recruitmentText" name="recruitmentText" required minLength={5} maxLength={1000} defaultValue={content.recruitmentText} aria-describedby="recruitmentText-error" />
        <FieldError state={state} name="recruitmentText" id="recruitmentText-error" />
      </label>
      <label htmlFor="currentAcademicYear">Current academic year
        <input id="currentAcademicYear" name="currentAcademicYear" required pattern="\d{4}-\d{2}" title="Use YYYY-YY, for example 2026-27" defaultValue={content.currentAcademicYear} aria-describedby="currentAcademicYear-help currentAcademicYear-error" />
        <small id="currentAcademicYear-help">Use a consecutive range such as 2026-27. This also selects the current team cohort.</small>
        <FieldError state={state} name="currentAcademicYear" id="currentAcademicYear-error" />
      </label>
      <Check id="recruitmentOpen" name="recruitmentOpen" label="Recruitment is open" defaultChecked={content.recruitmentOpen} />
      <FormStatus state={state} />
      <button className="admin-primary" type="submit" disabled={pending}>{pending ? "Saving…" : "Save homepage content"}</button>
    </form>
  );
}

function AnnouncementCreateForm({ onSaved }: { onSaved: (announcement: Announcement) => void }) {
  const [state, action, pending] = useActionState(createAnnouncementAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.status === "success" && state.announcement) {
      formRef.current?.reset();
      onSaved(state.announcement);
    }
  }, [onSaved, state]);
  return (
    <form ref={formRef} action={action} className="admin-inline-form">
      <label htmlFor="announcement-new-title">Title
        <input id="announcement-new-title" name="title" required maxLength={180} aria-describedby="announcement-new-title-error" />
        <FieldError state={state} name="title" id="announcement-new-title-error" />
      </label>
      <label htmlFor="announcement-new-content">Content
        <textarea id="announcement-new-content" name="content" required maxLength={1000} aria-describedby="announcement-new-content-error" />
        <FieldError state={state} name="content" id="announcement-new-content-error" />
      </label>
      <div className="two">
        <Check id="announcement-new-pinned" name="pinned" label="Pin announcement" />
        <Check id="announcement-new-published" name="published" label="Publish now" defaultChecked />
      </div>
      <FormStatus state={state} />
      <button className="admin-primary" type="submit" disabled={pending}>{pending ? "Adding…" : "Add announcement"}</button>
    </form>
  );
}

function AnnouncementEditForm({ announcement, onDeleted, onSaved }: { announcement: Announcement; onDeleted: (id: string) => void; onSaved: (announcement: Announcement) => void }) {
  const [editState, editAction, editPending] = useActionState(updateAnnouncementAction, initialState);
  const [deleteState, deleteAction, deletePending] = useActionState(deleteAnnouncementAction, initialState);
  useEffect(() => {
    if (editState.status === "success" && editState.announcement) onSaved(editState.announcement);
  }, [editState, onSaved]);
  useEffect(() => {
    if (deleteState.status === "success" && deleteState.deletedId) onDeleted(deleteState.deletedId);
  }, [deleteState, onDeleted]);
  const prefix = `announcement-${announcement.id}`;
  return <>
    <details className="admin-edit-details">
      <summary>Edit announcement</summary>
      <form action={editAction} className="admin-inline-form">
        <input type="hidden" name="id" value={announcement.id} />
        <label htmlFor={`${prefix}-title`}>Title
          <input id={`${prefix}-title`} name="title" required maxLength={180} defaultValue={announcement.title} aria-describedby={`${prefix}-title-error`} />
          <FieldError state={editState} name="title" id={`${prefix}-title-error`} />
        </label>
        <label htmlFor={`${prefix}-content`}>Content
          <textarea id={`${prefix}-content`} name="content" required maxLength={1000} defaultValue={announcement.content} aria-describedby={`${prefix}-content-error`} />
          <FieldError state={editState} name="content" id={`${prefix}-content-error`} />
        </label>
        <div className="two">
          <Check id={`${prefix}-pinned`} name="pinned" label="Pinned" defaultChecked={announcement.pinned} />
          <Check id={`${prefix}-published`} name="published" label="Published" defaultChecked={announcement.published} />
        </div>
        <FormStatus state={editState} />
        <button className="admin-primary" type="submit" disabled={editPending}>{editPending ? "Saving…" : "Save announcement"}</button>
      </form>
    </details>
    <form action={deleteAction} className="admin-list-actions">
      <input type="hidden" name="id" value={announcement.id} />
      <FormStatus state={deleteState} />
      <button className="danger" type="submit" disabled={deletePending}>{deletePending ? "Deleting…" : "Delete"}</button>
    </form>
  </>;
}

export function ContentAdmin({ content, announcements }: { content: SiteContent; announcements: Announcement[] }) {
  const sortAnnouncements = useCallback((items: Announcement[]) => items.slice().sort((a, b) =>
    Number(b.pinned) - Number(a.pinned)
    || b.updatedAt.localeCompare(a.updatedAt)
    || b.createdAt.localeCompare(a.createdAt)
    || a.id.localeCompare(b.id),
  ), []);
  const [announcementItems, setAnnouncementItems] = useState(() => sortAnnouncements(announcements));
  const handleSaved = useCallback((announcement: Announcement) => {
    setAnnouncementItems((current) => sortAnnouncements([
      announcement,
      ...current.filter((item) => item.id !== announcement.id),
    ]));
  }, [sortAnnouncements]);
  const handleDeleted = useCallback((id: string) => {
    setAnnouncementItems((current) => current.filter((item) => item.id !== id));
  }, []);

  return <main className="admin-content">
    <div className="admin-columns">
      <section className="admin-panel">
        <div className="panel-head"><h2>Homepage controls</h2></div>
        <SiteContentForm content={content} />
      </section>
      <aside className="admin-panel">
        <div className="panel-head"><h2>Add announcement</h2></div>
        <AnnouncementCreateForm onSaved={handleSaved} />
      </aside>
    </div>
    <section className="admin-panel notice-editor">
      <div className="panel-head"><h2>Announcements</h2><span>{announcementItems.length} entries</span></div>
      {announcementItems.length ? <div className="management-list content-announcement-list">
        {announcementItems.map((announcement, index) => <article key={announcement.id}>
          <span>{String(index + 1).padStart(2, "0")}</span>
          <div>
            <strong>{announcement.title}</strong>
            <em>{announcement.pinned ? "Pinned · " : ""}{announcement.published ? "Published" : "Draft"}</em>
            <p>{announcement.content}</p>
            <AnnouncementEditForm announcement={announcement} onDeleted={handleDeleted} onSaved={handleSaved} />
          </div>
        </article>)}
      </div> : <div className="empty-state"><strong>No announcements yet</strong><p>Create a draft or publish the first notice above.</p></div>}
    </section>
  </main>;
}
