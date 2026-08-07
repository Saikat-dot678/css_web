export function SectionHeader({ index, kicker, title, copy }: { index: string; kicker: string; title: string; copy?: string }) {
  return <div className="section-heading"><div className="section-index">{index}</div><div><p className="kicker">{kicker}</p><h2>{title}</h2>{copy && <p className="section-intro">{copy}</p>}</div></div>;
}
