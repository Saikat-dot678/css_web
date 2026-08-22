"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, type CSSProperties, type RefObject } from "react";

import styles from "./laptop-intro.module.css";

export type LaptopRevealHandle = {
  setAssemblyProgress: (progress: number) => void;
  setOpenProgress: (progress: number) => void;
  setTakeoverProgress: (progress: number) => void;
};

type LaptopRevealProps = {
  assemblyProgress?: number;
  children?: React.ReactNode;
  className?: string;
  openProgress?: number;
  screenRef?: RefObject<HTMLDivElement | null>;
  takeoverProgress?: number;
};

const clamp = (value: number) => Math.min(1, Math.max(0, value));

export const LaptopReveal = forwardRef<LaptopRevealHandle, LaptopRevealProps>(function LaptopReveal(
  {
    assemblyProgress = 0,
    children,
    className = "",
    openProgress = 0,
    screenRef,
    takeoverProgress = 0,
  },
  forwardedRef,
) {
  const rootRef = useRef<HTMLElement>(null);

  const setVariable = useCallback((name: string, value: number) => rootRef.current?.style.setProperty(name, String(clamp(value))), []);
  const setAssemblyProgress = useCallback((value: number) => setVariable("--assembly", value), [setVariable]);
  const setOpenProgress = useCallback((value: number) => setVariable("--open", value), [setVariable]);
  const setTakeoverProgress = useCallback((value: number) => setVariable("--takeover", value), [setVariable]);

  useImperativeHandle(forwardedRef, () => ({ setAssemblyProgress, setOpenProgress, setTakeoverProgress }), [setAssemblyProgress, setOpenProgress, setTakeoverProgress]);
  useEffect(() => setAssemblyProgress(assemblyProgress), [assemblyProgress, setAssemblyProgress]);
  useEffect(() => setOpenProgress(openProgress), [openProgress, setOpenProgress]);
  useEffect(() => setTakeoverProgress(takeoverProgress), [setTakeoverProgress, takeoverProgress]);

  const customStyle = {
    "--assembly": String(clamp(assemblyProgress)),
    "--open": String(clamp(openProgress)),
    "--takeover": String(clamp(takeoverProgress)),
  } as CSSProperties;

  return (
    <section ref={rootRef} className={`${styles.laptopScene} ${className}`.trim()} style={customStyle} aria-label="Laptop assembling and opening">
      <div className={styles.deviceField} aria-hidden="true"><i /><i /><i /><i /></div>
      <div className={styles.deviceRig}>
        <svg className={styles.assemblyDrawing} viewBox="0 0 1000 620" aria-hidden="true">
          <g className={styles.assemblyRays}>
            <path d="M500 380H176" pathLength="1" />
            <path d="M500 380H824" pathLength="1" />
            <path d="M500 516H72" pathLength="1" />
            <path d="M500 516H930" pathLength="1" />
          </g>
          <g className={styles.assemblyOutline}>
            <path d="M176 380L824 380L930 516L72 516Z" pathLength="1" />
            <path d="M72 516H930M416 486H584" pathLength="1" />
          </g>
        </svg>

        <div className={styles.seedTransfer} aria-hidden="true"><i /><span /></div>

        <div className={styles.deviceBody}>
          <div className={styles.lid}>
            <div className={styles.lidBack} aria-hidden="true"><span /></div>
            <div className={styles.bezel}>
              <div ref={screenRef} className={styles.screenViewport} data-laptop-screen>
                {children}
              </div>
              <i className={styles.cameraDot} aria-hidden="true" />
            </div>
            <span className={styles.materializationTrace} aria-hidden="true" />
          </div>

          <div className={styles.hinge} aria-hidden="true"><i /><i /><i /></div>
          <div className={styles.base} aria-hidden="true">
            <div className={styles.keyboard}>
              {Array.from({ length: 54 }, (_, index) => <i key={index} />)}
            </div>
            <div className={styles.touchpad} />
            <div className={styles.powerLine} />
            <span className={styles.materializationTrace} aria-hidden="true" />
          </div>
          <div className={styles.baseEdge} aria-hidden="true"><i /></div>
        </div>
      </div>

      <div className={styles.deviceCaption} aria-hidden="true">
        <span>DEVICE / 01</span>
        <strong>SIGNAL-ORIGIN TERMINAL</strong>
        <small>CSS / NIT DURGAPUR</small>
      </div>
    </section>
  );
});
