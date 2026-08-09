import type { Announcement } from "@/types/content";
import { AnnouncementTicker } from "./AnnouncementTicker";
import { MotionEngine } from "./MotionEngine";
import { RevealManager } from "./RevealManager";
import { RouteAtmosphere } from "./RouteAtmosphere";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

export function PublicShell({
  children,
  announcements,
  showTicker = false,
}: {
  children: React.ReactNode;
  announcements?: Announcement[];
  showTicker?: boolean;
}) {
  return (
    <div className="site-page v4-public-shell">
      <RevealManager />
      <MotionEngine />
      <SiteHeader />
      <RouteAtmosphere />
      {showTicker && <AnnouncementTicker announcements={announcements ?? []} />}
      {children}
      <SiteFooter />
    </div>
  );
}
