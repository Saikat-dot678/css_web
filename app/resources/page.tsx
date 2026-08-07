import { PublicShell } from "@/components/public/PublicShell";
import { ResourceExplorer } from "@/components/public/ResourceExplorer";
import { getAnnouncements } from "@/lib/repositories/content";
import { getResources } from "@/lib/repositories/resources";

export const metadata = { title: "Resources" };

export default async function ResourcesPage() {
  const [resources, announcements] = await Promise.all([getResources(), getAnnouncements(true)]);
  return <PublicShell announcements={announcements} showTicker><main id="main"><section className="page-intro wrap"><p className="edition">Student Desk / Live index</p><div><h1>Useful links should be findable twice.</h1><p>A practical index for opportunities, academics, placements, research, and department routines.</p></div></section><ResourceExplorer resources={resources} today={new Date().toISOString().slice(0, 10)} /><section className="resource-callout wrap"><div><p className="kicker">Missing something?</p><h2>Suggest a guide, link, or opportunity.</h2><p>The admin panel can publish, categorise, update, and remove resources without changing the site code.</p></div><a className="solid-link" href="https://cssnitdgp.in" target="_blank" rel="noreferrer">Contact CSS</a></section></main></PublicShell>;
}
