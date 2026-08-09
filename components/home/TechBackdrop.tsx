const nodes = [
  [9, 19], [19, 74], [31, 38], [47, 13], [58, 80], [72, 43], [84, 21], [92, 66],
] as const;

export function TechBackdrop() {
  return (
    <div className="tech-backdrop" aria-hidden="true">
      <div className="tech-grid" />
      <div className="tech-noise" />
      <div className="tech-scanline" />
      {nodes.map(([left, top], index) => (
        <i className={`tech-node tech-node-${index + 1}`} key={`${left}-${top}`} style={{ left: `${left}%`, top: `${top}%` }} />
      ))}
      <span className="tech-note note-a">SYS/CSS · 04</span>
      <span className="tech-note note-b">23.55 N / 87.29 E</span>
      <span className="tech-note note-c">DEPARTMENT SIGNAL / ONLINE</span>
      <span className="tech-note note-d">NITDGP.CSE</span>
    </div>
  );
}
