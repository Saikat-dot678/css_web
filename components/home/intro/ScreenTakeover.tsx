"use client";

import Link from "next/link";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, type CSSProperties, type RefObject } from "react";

import { CampusScreenMap } from "./CampusScreenMap";
import styles from "./screen-takeover.module.css";

export type ScreenTakeoverHandle = { setProgress: (progress: number) => void; syncSourceRect: () => void; };
type ScreenTakeoverProps = { academicYear: string; memberCount: number; nextEvent?: string; sourceRef: RefObject<HTMLElement | null>; };
const clamp = (value: number) => Math.min(1, Math.max(0, value));
const mix = (from: number, to: number, progress: number) => from + (to - from) * progress;

export const ScreenTakeover = forwardRef<ScreenTakeoverHandle, ScreenTakeoverProps>(function ScreenTakeover(
  { academicYear, memberCount, nextEvent, sourceRef }, forwardedRef,
) {
  const rootRef = useRef<HTMLDivElement>(null);
  const apertureRef = useRef<HTMLDivElement>(null);
  const sourceRectRef = useRef({ left: 0, top: 0, right: 0, bottom: 0, radius: 3 });
  const syncSourceRect = useCallback(() => {
    const source = sourceRef.current;
    if (!source) return;
    const rect = source.getBoundingClientRect();
    sourceRectRef.current = { left: Math.max(0, rect.left), top: Math.max(0, rect.top), right: Math.max(0, window.innerWidth - rect.right), bottom: Math.max(0, window.innerHeight - rect.bottom), radius: 3 };
  }, [sourceRef]);
  const setProgress = useCallback((rawProgress: number) => {
    const progress = clamp(rawProgress); const root = rootRef.current; const aperture = apertureRef.current;
    if (!root || !aperture) return;
    if (progress < .025 || sourceRectRef.current.right === 0) syncSourceRect();
    const source = sourceRectRef.current; const eased = progress * progress * (3 - 2 * progress);
    aperture.style.clipPath = `inset(${mix(source.top, 0, eased)}px ${mix(source.right, 0, eased)}px ${mix(source.bottom, 0, eased)}px ${mix(source.left, 0, eased)}px round ${mix(source.radius, 0, eased)}px)`;
    root.style.setProperty("--takeover", String(progress)); root.dataset.active = String(progress > .008); root.dataset.complete = String(progress > .985);
  }, [syncSourceRect]);
  useImperativeHandle(forwardedRef, () => ({ setProgress, syncSourceRect }), [setProgress, syncSourceRect]);
  useEffect(() => { const onResize = () => syncSourceRect(); window.addEventListener("resize", onResize, { passive: true }); syncSourceRect(); return () => window.removeEventListener("resize", onResize); }, [syncSourceRect]);

  return <div ref={rootRef} className={styles.takeover} style={{ "--takeover": "0" } as CSSProperties} data-active="false" data-complete="false"><div ref={apertureRef} className={styles.aperture}>
    <div className={styles.mapPlane} aria-hidden="true"><CampusScreenMap variant="takeover" revealProgress={1} routeProgress={1} focusProgress={1} /></div>
    <article className={styles.identity} aria-label="CSE Students’ Society">
      <div className={styles.registration} aria-hidden="true"><i /><i /><i /><i /></div>
      <div className={styles.topline}><span>DEPARTMENT DISPATCH / ISSUE 04</span><strong>CSS / NITDGP</strong></div>
      <p className={styles.kicker}>CSE FOUND / STUDENT LAYER ONLINE</p>
      <h1><span>CSE Students’</span><span>Society</span></h1>
      <div className={styles.footer}><p>National Institute of Technology Durgapur<br />Engage · Educate · Inspire</p><div><Link className="v4-button v4-button-primary" href="#about">Enter CSS ↓</Link><Link className="v4-text-link" href="/events">View events ↗</Link></div></div>
      <aside className={styles.stats} aria-hidden="true"><span>{memberCount} / MEMBERS</span><span>{academicYear} / SESSION</span><span>{nextEvent ? `NEXT / ${nextEvent}` : "NEXT / TBA"}</span></aside>
    </article>
    <div className={styles.lockTransfer} aria-hidden="true"><i /><span>CSE / LOCKED</span></div>
  </div></div>;
});
