import type { Announcement } from "@/types/content";

export function AnnouncementTicker({ announcements }: { announcements: Announcement[] }) {
  const items = [...announcements, ...announcements];
  if (!items.length) return null;
  return (
    <div className="ticker" aria-label="Announcements">
      <div className="ticker-label">Noticeboard</div>
      <div className="ticker-track"><div>{items.map((item, index) => <span key={`${item.id}-${index}`}>{item.pinned && <><b>Pinned</b>{" "}</>}{item.content} <b>{index % 2 ? "↗" : "•"}</b></span>)}</div></div>
    </div>
  );
}
