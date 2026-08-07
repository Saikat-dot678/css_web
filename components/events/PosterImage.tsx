import Image from "next/image";

export function PosterImage({ src, title, priority = false }: { src: string; title: string; priority?: boolean }) {
  return <Image src={src} alt={`Poster for ${title}`} width={800} height={1000} sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 33vw" priority={priority} unoptimized={src.endsWith(".svg") || src.startsWith("/api/")} />;
}
