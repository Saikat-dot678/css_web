import { PublicShell } from "@/components/public/PublicShell";
import { ResourceExplorer } from "@/components/public/ResourceExplorer";
import { V4PageHero } from "@/components/public/V4PageHero";
import { getAnnouncements } from "@/lib/repositories/content";
import { getResources } from "@/lib/repositories/resources";

export const metadata = { title: "Resources" };

export default async function ResourcesPage() {
  const [resources, announcements] = await Promise.all([getResources(), getAnnouncements(true)]);
  const featured = resources.filter((resource) => resource.featured).length;

  return (
    <PublicShell announcements={announcements} showTicker>
      <main id="main" className="v4-page v4-resources-page">
        <V4PageHero
          index="06"
          eyebrow="STUDENT DESK / LIVE INDEX"
          title="Useful links should be findable twice."
          copy="A practical technical index for opportunities, academics, placements, research, competitive programming and department routines."
          meta={[`${resources.length} RESOURCES`, `${featured} FEATURED`, "SEARCHABLE / FILTERED"]}
        >
          <div className="v4-resource-terminal">
            <div><i /><i /><i /><span>student-desk.sh</span></div>
            <pre>{`> index resources\n> filter --current\n> status: READY\n> cursor: _`}</pre>
          </div>
        </V4PageHero>

        <ResourceExplorer resources={resources} today={new Date().toISOString().slice(0, 10)} />
        <section className="resource-callout wrap reveal"><div><p className="kicker">Missing something?</p><h2>Suggest a guide, link, or opportunity.</h2><p>The admin panel can publish, categorise, update, and remove resources without changing the site code.</p></div><a className="solid-link" href="https://cssnitdgp.in" target="_blank" rel="noreferrer">Contact CSS</a></section>
      </main>
    </PublicShell>
  );
}
