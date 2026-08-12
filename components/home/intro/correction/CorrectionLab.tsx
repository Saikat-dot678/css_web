"use client";

import { useEffect, useState } from "react";

import { CampusNightMap } from "./CampusNightMap";
import { GravityCore } from "./GravityCore";
import { ParticleSpiral } from "./ParticleSpiral";
import styles from "./lab.module.css";

export type CorrectionFrame = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J" | "K" | "L";
export type CorrectionScene = "gravity" | "spiral" | "map" | "route";

type FrameSpec = {
  id: CorrectionFrame;
  label: string;
  note: string;
};

const frames: FrameSpec[] = [
  { id: "A", label: "GRAVITY CORE", note: "one point / field dormant" },
  { id: "B", label: "INITIAL EMISSION", note: "particles leave the core" },
  { id: "C", label: "BURST", note: "radial energy acquires curvature" },
  { id: "D", label: "SPIRAL FORMED", note: "five-arm computational field" },
  { id: "E", label: "FIELD DESTABILISES", note: "depth begins to compress" },
  { id: "F", label: "ORDERED PLANE", note: "particles resolve into map vertices" },
  { id: "G", label: "GRID ASSEMBLY", note: "coordinate geometry resolves" },
  { id: "H", label: "MAP REST", note: "stable camera / route awaiting scroll" },
  { id: "I", label: "ROUTE 25%", note: "signal leaves Main Gate" },
  { id: "J", label: "ROUTE 60%", note: "academic spine reached" },
  { id: "K", label: "CSE LOCK", note: "target building resolves in 2.5D" },
  { id: "L", label: "EDITORIAL HANDOFF", note: "map target becomes society frame" },
];

const frameProgress: Record<CorrectionFrame, number> = {
  A: 0,
  B: 0.1,
  C: 0.29,
  D: 0.57,
  E: 0.78,
  F: 0.99,
  G: 0.42,
  H: 1,
  I: 0.25,
  J: 0.6,
  K: 1,
  L: 1,
};

function FrameVisual({ frame }: { frame: CorrectionFrame }) {
  if (frame === "A") return <GravityCore progress={0} className={styles.compactScene} />;
  if (["B", "C", "D", "E", "F"].includes(frame)) {
    return <ParticleSpiral progress={frameProgress[frame]} className={styles.compactScene} />;
  }
  if (frame === "G") {
    return <CampusNightMap revealProgress={frameProgress.G} showRoute={false} className={styles.compactScene} />;
  }
  if (frame === "H") {
    return <CampusNightMap revealProgress={1} showRoute={false} className={styles.compactScene} />;
  }

  const routeProgress = frameProgress[frame];
  const focusProgress = frame === "J" ? 0 : frame === "I" ? 0 : 1;
  return (
    <div className={`${styles.transitionScene} ${frame === "L" ? styles.handoffScene : ""}`.trim()}>
      <CampusNightMap
        focusProgress={focusProgress}
        revealProgress={1}
        routeProgress={routeProgress}
        className={styles.compactScene}
      />
      {frame === "L" ? (
        <div className={styles.editorialLock} aria-hidden="true">
          <span>ISSUE 04 / DEPARTMENT DISPATCH</span>
          <strong>CSS</strong>
          <small>CSE STUDENTS&rsquo; SOCIETY / NIT DURGAPUR</small>
        </div>
      ) : null}
    </div>
  );
}

function LabNavigation() {
  return (
    <nav className={styles.navigation} aria-label="Corrected intro lab scenes">
      <a href="?view=sheet">A–L CONTACT SHEET</a>
      <a href="?scene=gravity">GRAVITY</a>
      <a href="?scene=spiral">SPIRAL</a>
      <a href="?scene=map">MAP</a>
      <a href="?scene=route">ROUTE</a>
    </nav>
  );
}

function ScenePreview({ initialProgress, scene }: { initialProgress?: number; scene: CorrectionScene }) {
  const [progress, setProgress] = useState(initialProgress ?? (scene === "gravity" ? 0 : scene === "map" ? 1 : 0.56));
  const controlled = initialProgress !== undefined;

  return (
    <main className={styles.preview} data-correction-lab>
      {scene === "gravity" ? <GravityCore progress={controlled ? progress : undefined} /> : null}
      {scene === "spiral" ? <ParticleSpiral progress={controlled ? progress : undefined} /> : null}
      {scene === "map" ? <CampusNightMap revealProgress={progress} showRoute={false} /> : null}
      {scene === "route" ? <CampusNightMap revealProgress={1} routeProgress={progress} focusProgress={Math.max(0, (progress - 0.8) / 0.2)} /> : null}
      <LabNavigation />
      <label className={styles.progressControl}>
        <span>{scene.toUpperCase()} / {Math.round(progress * 100).toString().padStart(3, "0")}</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.001"
          value={progress}
          onChange={(event) => setProgress(Number(event.target.value))}
        />
      </label>
    </main>
  );
}

export function CorrectionLab({
  frame,
  initialProgress,
  scene,
  view,
}: {
  frame?: CorrectionFrame;
  initialProgress?: number;
  scene?: CorrectionScene;
  view?: "sheet";
}) {
  useEffect(() => {
    document.body.classList.add("intro-correction-lab");
    return () => document.body.classList.remove("intro-correction-lab");
  }, []);

  if (frame) {
    const spec = frames.find((item) => item.id === frame)!;
    return (
      <main className={styles.singleFrame} data-correction-frame={frame} data-correction-lab>
        <FrameVisual frame={frame} />
        <div className={styles.frameCaption}><span>FRAME {frame}</span><strong>{spec.label}</strong><small>{spec.note}</small></div>
      </main>
    );
  }

  if (view === "sheet" || !scene) {
    return (
      <main className={styles.sheet} data-correction-lab>
        <header className={styles.sheetHeader}>
          <div><span>CSS / NIT DURGAPUR</span><h1>CORRECTED INTRO / A–L</h1></div>
          <p>CORE → PARTICLES → ORDERED PLANE → REAL CAMPUS GEOMETRY → CSE</p>
        </header>
        <div className={styles.sheetGrid}>
          {frames.map((item) => (
            <a className={styles.frameCard} href={`?frame=${item.id}`} key={item.id}>
              <div className={styles.frameVisual}><FrameVisual frame={item.id} /></div>
              <div className={styles.cardCaption}><span>{item.id}</span><strong>{item.label}</strong><small>{item.note}</small></div>
            </a>
          ))}
        </div>
        <LabNavigation />
      </main>
    );
  }

  return <ScenePreview initialProgress={initialProgress} scene={scene} />;
}
