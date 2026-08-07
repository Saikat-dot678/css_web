import type { Announcement } from "@/types/content";
import { AnnouncementTicker } from "./AnnouncementTicker";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";
import { RevealManager } from "./RevealManager";

export function PublicShell({ children, announcements, showTicker = false }: { children: React.ReactNode; announcements?: Announcement[]; showTicker?: boolean }) {
  return <div className="site-page"><RevealManager /><SiteHeader />{showTicker && <AnnouncementTicker announcements={announcements ?? []} />}{children}<SiteFooter /></div>;
}
