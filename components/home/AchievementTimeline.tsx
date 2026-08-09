import Link from "next/link";

import type { Achievement } from "@/types/achievement";

export function AchievementTimeline({ achievements }: { achievements: Achievement[] }) {
  return (
    <div className="achievement-v4-list">
      {achievements.slice(0, 4).map((item, index) => (
        <Link href="/achievements" className="achievement-v4-row reveal" key={item.id}>
          <time>{item.year}</time>
          <span>{String(index + 1).padStart(2, "0")}</span>
          <strong>{item.title}</strong>
          <em>{item.category}</em>
          <b>↗</b>
        </Link>
      ))}
      {!achievements.length && <p className="v4-empty">Milestones will appear here after they are added.</p>}
    </div>
  );
}
