"use client";

import { useRef } from "react";

import { CampusScreenMap, type CampusScreenMapHandle } from "./CampusScreenMap";
import { GravityPoint } from "./GravityPoint";
import { IntroHUD } from "./IntroHUD";
import { LaptopBoot, type LaptopBootHandle } from "./LaptopBoot";
import { LaptopReveal, type LaptopRevealHandle } from "./LaptopReveal";
import { ScreenTakeover, type ScreenTakeoverHandle } from "./ScreenTakeover";
import styles from "./experience.module.css";
import { useIntroTimeline } from "./useIntroTimeline";

export function IntroExperience({ academicYear, memberCount, nextEvent }: { academicYear: string; memberCount: number; nextEvent?: string }) {
  const rootRef = useRef<HTMLElement>(null);
  const laptopRef = useRef<LaptopRevealHandle>(null);
  const bootRef = useRef<LaptopBootHandle>(null);
  const mapRef = useRef<CampusScreenMapHandle>(null);
  const takeoverRef = useRef<ScreenTakeoverHandle>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const { phase, reduced, skipIntro, skipVisible } = useIntroTimeline(rootRef, laptopRef, bootRef, mapRef, takeoverRef);
  const pointActive = phase === "PRELOAD" || phase === "POINT" || phase === "ASSEMBLE" || phase === "OPEN" || phase === "BOOT";

  return (
    <section ref={rootRef} className={styles.experience} data-phase={phase} data-reduced={reduced} data-bypassed="false" aria-label="CSS laptop campus introduction">
      <div className={styles.stickyStage}>
        <div className={styles.pointLayer} aria-hidden={phase !== "POINT"}><GravityPoint active={pointActive} /></div>
        <div className={styles.laptopLayer}>
          <LaptopReveal ref={laptopRef} screenRef={screenRef}>
            <LaptopBoot ref={bootRef} />
            <CampusScreenMap ref={mapRef} revealProgress={0} routeProgress={0} focusProgress={0} />
          </LaptopReveal>
        </div>
        <ScreenTakeover ref={takeoverRef} sourceRef={screenRef} academicYear={academicYear} memberCount={memberCount} nextEvent={nextEvent} />
        <IntroHUD phase={phase} skipVisible={skipVisible} onSkip={skipIntro} />
      </div>
    </section>
  );
}
