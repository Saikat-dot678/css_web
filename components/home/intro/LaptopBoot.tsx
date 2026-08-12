"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, type CSSProperties } from "react";

import styles from "./laptop-intro.module.css";

export type LaptopBootHandle = { setProgress: (progress: number) => void };

const clamp = (value: number) => Math.min(1, Math.max(0, value));

export const LaptopBoot = forwardRef<LaptopBootHandle, { progress?: number }>(function LaptopBoot(
  { progress = 0 },
  forwardedRef,
) {
  const rootRef = useRef<HTMLDivElement>(null);
  const setProgress = (value: number) => rootRef.current?.style.setProperty("--boot", String(clamp(value)));
  useImperativeHandle(forwardedRef, () => ({ setProgress }), []);
  useEffect(() => setProgress(progress), [progress]);

  return (
    <div ref={rootRef} className={styles.boot} style={{ "--boot": String(clamp(progress)) } as CSSProperties} aria-hidden="true">
      <div className={styles.bootCore}><i /></div>
      <div className={styles.bootIdentity}>
        <span>CSS / NITDGP</span>
        <strong>SYSTEM INITIALISING</strong>
      </div>
      <div className={styles.bootSequence}>
        <span><i />DISPLAY BUS</span>
        <span><i />CAMPUS NODES</span>
        <span><i />MAIN GATE → CSE</span>
      </div>
      <div className={styles.bootScan} />
      <div className={styles.bootDispatch}>ISSUE 04 / DEPARTMENT LINK</div>
    </div>
  );
});
