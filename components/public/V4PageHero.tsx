export function V4PageHero({
  index,
  eyebrow,
  title,
  copy,
  meta,
  children,
}: {
  index: string;
  eyebrow: string;
  title: string;
  copy: string;
  meta?: string[];
  children?: React.ReactNode;
}) {
  return (
    <section className="v4-page-hero v4-wrap" data-motion-hero>
      <div className="v4-page-hero-copy">
        <div className="v4-page-hero-kicker"><span>/{index}</span><b>{eyebrow}</b></div>
        <h1>{title}</h1>
        <p>{copy}</p>
        {!!meta?.length && (
          <div className="v4-page-hero-meta">
            {meta.map((item) => <span key={item}>{item}</span>)}
          </div>
        )}
      </div>

      <div className="v4-page-hero-visual">
        <div className="v4-hero-paper-ticket" aria-hidden="true">
          <span>CSS / DEPARTMENT DISPATCH</span>
          <strong>{index}</strong>
          <small>NIT DURGAPUR</small>
        </div>
        {children ?? <div className="v4-hero-schematic"><i /><i /><i /><strong>CSS</strong></div>}
      </div>
    </section>
  );
}
