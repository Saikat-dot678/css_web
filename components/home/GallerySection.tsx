import Image from "next/image";

const shots = [
  ["01", "WORKSHOP", "Replace with a real workshop photograph"],
  ["02", "BUILD NIGHT", "Replace with a candid build-night photograph"],
  ["03", "CSE LABS", "Replace with a department/lab photograph"],
  ["04", "COMMUNITY", "Replace with a society group photograph"],
  ["05", "FACULTY TALK", "Replace with a faculty session photograph"],
] as const;

export function GallerySection({ images = [] }: { images?: Array<{ alt: string; label: string; src: string }> }) {
  return (
    <div className="gallery-v4-grid">
      {shots.map(([number, fallbackLabel, description], index) => {
        const image = images[index];
        return (
          <figure className={`gallery-v4-shot shot-${index + 1}`} key={image?.src ?? number}>
            {image ? (
              <div className="gallery-v4-photo">
                <Image src={image.src} alt={image.alt} fill sizes="(max-width: 760px) 92vw, 40vw" unoptimized={image.src.startsWith("/api/") || image.src.endsWith(".svg")} />
                <span>{number}</span>
              </div>
            ) : (
              <div className="gallery-v4-placeholder" role="img" aria-label={description}>
                <span>{number}</span>
                <i />
                <b>CSS / NITDGP</b>
              </div>
            )}
            <figcaption>{image?.label ?? fallbackLabel}</figcaption>
          </figure>
        );
      })}
    </div>
  );
}
