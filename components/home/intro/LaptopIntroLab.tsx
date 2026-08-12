"use client";

import { useEffect, useRef } from "react";

import { CampusScreenMap } from "./CampusScreenMap";
import { GravityPoint } from "./GravityPoint";
import { LaptopBoot } from "./LaptopBoot";
import { LaptopReveal } from "./LaptopReveal";
import { ScreenTakeover, type ScreenTakeoverHandle } from "./ScreenTakeover";
import styles from "./laptop-lab.module.css";

export type LaptopFrame = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J" | "K" | "L";

const frames: Array<{ id: LaptopFrame; label: string; note: string }> = [
  { id: "A", label: "SINGULAR POINT", note: "one concentrated origin signal" },
  { id: "B", label: "DEVICE EMERGENCE", note: "wireframe leaves the origin" },
  { id: "C", label: "LAPTOP FORMED", note: "graphite shell / lid at rest" },
  { id: "D", label: "HINGE MOTION", note: "display opens with physical resistance" },
  { id: "E", label: "POWER ON", note: "restrained CSS system boot" },
  { id: "F", label: "CAMPUS MAP", note: "map settled inside the device" },
  { id: "G", label: "MAIN GATE", note: "origin signal awaits scroll" },
  { id: "H", label: "CAMPUS ROUTE", note: "signal crosses the academic spine" },
  { id: "I", label: "CSE LOCK", note: "route merges into department target" },
  { id: "J", label: "SCREEN FORWARD", note: "measured screen aperture expands" },
  { id: "K", label: "WEBSITE TAKEOVER", note: "browser viewport becomes CSS" },
  { id: "L", label: "ABOUT / EDITORIAL", note: "normal homepage motion begins" },
];

const states: Record<LaptopFrame, { assembly: number; boot: number; focus: number; map: number; open: number; route: number; takeover: number }> = {
  A: { assembly: 0, open: 0, boot: 0, map: 0, route: 0, focus: 0, takeover: 0 },
  B: { assembly: .34, open: 0, boot: 0, map: 0, route: 0, focus: 0, takeover: 0 },
  C: { assembly: 1, open: .04, boot: 0, map: 0, route: 0, focus: 0, takeover: 0 },
  D: { assembly: 1, open: .56, boot: 0, map: 0, route: 0, focus: 0, takeover: 0 },
  E: { assembly: 1, open: 1, boot: .6, map: 0, route: 0, focus: 0, takeover: 0 },
  F: { assembly: 1, open: 1, boot: 1, map: 1, route: 0, focus: 0, takeover: 0 },
  G: { assembly: 1, open: 1, boot: 1, map: 1, route: 0, focus: 0, takeover: 0 },
  H: { assembly: 1, open: 1, boot: 1, map: 1, route: .55, focus: 0, takeover: 0 },
  I: { assembly: 1, open: 1, boot: 1, map: 1, route: 1, focus: 1, takeover: 0 },
  J: { assembly: 1, open: 1, boot: 1, map: 1, route: 1, focus: 1, takeover: .34 },
  K: { assembly: 1, open: 1, boot: 1, map: 1, route: 1, focus: 1, takeover: 1 },
  L: { assembly: 1, open: 1, boot: 1, map: 1, route: 1, focus: 1, takeover: 1 },
};

function AboutFrame() {
  return (
    <div className={styles.aboutFrame}>
      <div className={styles.aboutIssue}>01 / ABOUT THE SOCIETY <span>ISSUE 04</span></div>
      <h2>A technical community,<br /><em>not another club page.</em></h2>
      <div className={styles.aboutPieces}><p>BUILD BEFORE BRANDING.</p><p>OPEN ACROSS BATCHES.</p><p>KEEP THE MEMORY.</p></div>
    </div>
  );
}

function FrameVisual({ frame }: { frame: LaptopFrame }) {
  const state = states[frame];
  const screenRef = useRef<HTMLDivElement>(null);
  const takeoverRef = useRef<ScreenTakeoverHandle>(null);

  useEffect(() => {
    const renderFrame = requestAnimationFrame(() => {
      takeoverRef.current?.syncSourceRect();
      takeoverRef.current?.setProgress(state.takeover);
    });
    return () => cancelAnimationFrame(renderFrame);
  }, [state.takeover]);

  if (frame === "A") return <GravityPoint progress={1} />;
  if (frame === "L") return <AboutFrame />;

  return (
    <div className={styles.deviceFrame}>
      <LaptopReveal
        assemblyProgress={state.assembly}
        openProgress={state.open}
        screenRef={screenRef}
        takeoverProgress={state.takeover}
      >
        <LaptopBoot progress={state.boot} />
        <CampusScreenMap revealProgress={state.map} routeProgress={state.route} focusProgress={state.focus} />
      </LaptopReveal>
      <ScreenTakeover ref={takeoverRef} sourceRef={screenRef} academicYear="2026–27" memberCount={84} nextEvent="CSS Orientation" />
    </div>
  );
}

export function LaptopIntroLab({ frame, sheet = false }: { frame?: LaptopFrame; sheet?: boolean }) {
  useEffect(() => {
    document.body.classList.add("laptop-intro-lab");
    return () => document.body.classList.remove("laptop-intro-lab");
  }, []);

  if (frame) {
    const details = frames.find((item) => item.id === frame)!;
    return (
      <main className={styles.single} data-laptop-frame={frame}>
        <FrameVisual frame={frame} />
        <div className={styles.caption}><span>FRAME {frame}</span><strong>{details.label}</strong><small>{details.note}</small></div>
      </main>
    );
  }

  return (
    <main className={styles.sheet} data-sheet={sheet}>
      <header><div><span>CSS / NIT DURGAPUR</span><h1>LAPTOP INTRO / A–L</h1></div><p>POINT → DEVICE → CAMPUS → CSE → WEBSITE</p></header>
      <div className={styles.grid}>
        {frames.map((item) => <a href={`?frame=${item.id}`} key={item.id}><div><FrameVisual frame={item.id} /></div><footer><span>{item.id}</span><strong>{item.label}</strong><small>{item.note}</small></footer></a>)}
      </div>
    </main>
  );
}
