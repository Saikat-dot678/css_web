import { PublicShell } from "@/components/public/PublicShell";
import { V4PageHero } from "@/components/public/V4PageHero";
import { getAchievements } from "@/lib/repositories/achievements";

export const metadata = { title: "Achievements" };

export default async function AchievementsPage() {
  const achievements = await getAchievements();
  const years = [...new Set(achievements.map((item) => item.year))].sort((a, b) => b.localeCompare(a));

  return (
    <PublicShell>
      <main id="main" className="v4-page v4-achievements-page">
        <V4PageHero
          index="07"
          eyebrow="DEPARTMENT RECORD / MILESTONES"
          title="Keep the record specific."
          copy="Achievements, milestones and support work belong in a public history—not only in social posts."
          meta={[`${achievements.length} RECORDED ITEMS`, `${years.length} YEARS`, "VERIFIED / LINKABLE"]}
        >
          <div className="v4-record-orbit">
            <span>{achievements.length}</span><i /><i /><i />
            <b>RECORDED<br />OUTCOMES</b>
          </div>
        </V4PageHero>

        <section className="record-summary wrap reveal"><strong>{achievements.length}</strong><div><span>recorded items</span><p>Verified event outcomes, student achievements, publications, competition results, and society milestones remain findable here.</p></div></section>
        <section className="timeline wrap">{years.map((year) => { const items = achievements.filter((item) => item.year === year); return <div className="timeline-year" key={year}><header><span>{year}</span><b>{items.length} entries</b></header><div>{items.map((item, index) => <article className="reveal" key={item.id}><span>{String(index + 1).padStart(2, "0")}</span><div><em>{item.category}</em><h2>{item.title}</h2><p>{item.description}</p>{item.externalUrl && <a className="record-link" href={item.externalUrl} target="_blank" rel="noreferrer">Supporting link ↗</a>}</div></article>)}</div></div>; })}</section>
      </main>
    </PublicShell>
  );
}
