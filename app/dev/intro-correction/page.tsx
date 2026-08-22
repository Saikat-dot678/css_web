import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  CorrectionLab,
  type CorrectionFrame,
  type CorrectionScene,
} from "@/components/home/intro/correction/CorrectionLab";

export const metadata: Metadata = {
  title: "Corrected Intro Lab / CSS",
  robots: { index: false, follow: false },
};

const validFrames = new Set(["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"]);
const validScenes = new Set(["gravity", "spiral", "map", "route"]);

export default async function CorrectedIntroPreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ frame?: string; progress?: string; scene?: string; view?: string }>;
}) {
  if (process.env.NODE_ENV !== "development") notFound();

  const query = await searchParams;
  const frame = query.frame?.toUpperCase();
  const scene = query.scene?.toLowerCase();
  const parsedProgress = query.progress === undefined ? undefined : Number(query.progress);
  const initialProgress = parsedProgress !== undefined && Number.isFinite(parsedProgress)
    ? Math.min(1, Math.max(0, parsedProgress))
    : undefined;

  return (
    <CorrectionLab
      frame={frame && validFrames.has(frame) ? frame as CorrectionFrame : undefined}
      initialProgress={initialProgress}
      scene={scene && validScenes.has(scene) ? scene as CorrectionScene : undefined}
      view={query.view === "sheet" ? "sheet" : undefined}
    />
  );
}
