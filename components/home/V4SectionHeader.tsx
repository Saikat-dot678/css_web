export function V4SectionHeader({
  index,
  eyebrow,
  title,
  copy,
}: {
  index: string;
  eyebrow: string;
  title: string;
  copy?: string;
}) {
  return (
    <header className="v4-section-heading" data-motion-heading>
      <div className="v4-section-index">/{index}</div>
      <div className="v4-section-title">
        <p>{eyebrow}</p>
        <h2>{title}</h2>
      </div>
      {copy && <p className="v4-section-copy">{copy}</p>}
      <span className="v4-section-stamp" aria-hidden="true">CSS / FIELD NOTE</span>
    </header>
  );
}
