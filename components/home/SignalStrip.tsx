import type { Announcement } from "@/types/content";

export function SignalStrip({ announcements }: { announcements: Announcement[] }) {
  const visible = announcements.slice(0, 3);
  if (!visible.length) return null;

  return (
    <section className="signal-strip" aria-label="Latest announcements">
      <div className="v4-wrap signal-strip-inner">
        <span className="signal-label"><i /> LIVE SIGNAL</span>
        <div className="signal-items">
          {visible.map((item) => (
            <p key={item.id}>
              {item.pinned && <b>PINNED</b>} {item.content}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
