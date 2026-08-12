import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { LaptopIntroLab, type LaptopFrame } from "@/components/home/intro/LaptopIntroLab";

export const metadata: Metadata = { title: "Laptop Intro Lab / CSS", robots: { index: false, follow: false } };
const validFrames = new Set<LaptopFrame>(["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"]);

export default async function IntroPreviewPage({ searchParams }: { searchParams: Promise<{ frame?: string; view?: string }> }) {
  if (process.env.NODE_ENV !== "development") notFound();
  const query = await searchParams;
  const frame = query.frame && validFrames.has(query.frame as LaptopFrame) ? query.frame as LaptopFrame : undefined;
  return <LaptopIntroLab frame={frame} sheet={query.view === "sheet"} />;
}
