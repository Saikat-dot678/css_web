const shots = [
  ["01", "WORKSHOP", "Replace with a real workshop photograph"],
  ["02", "BUILD NIGHT", "Replace with a candid build-night photograph"],
  ["03", "CSE LABS", "Replace with a department/lab photograph"],
  ["04", "COMMUNITY", "Replace with a society group photograph"],
  ["05", "FACULTY TALK", "Replace with a faculty session photograph"],
] as const;

export function GallerySection() {
  return (
    <div className="gallery-v4-grid">
      {shots.map(([number, label, description], index) => (
        <figure className={`gallery-v4-shot shot-${index + 1} reveal`} key={number}>
          <div className="gallery-v4-placeholder" role="img" aria-label={description}>
            <span>{number}</span>
            <i />
            <b>CSS / NITDGP</b>
          </div>
          <figcaption>{label}</figcaption>
        </figure>
      ))}
    </div>
  );
}
