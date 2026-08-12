"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

import styles from "./correction.module.css";

export const CAMPUS_ROUTE_D = "M746 509 L817 456 L806 456 L789 455 L763 454 L732 449 L722 444 L726 442 L725 367 L717 388 L706 389";

export type CampusRouteHandle = {
  setProgress: (progress: number) => void;
};

const clamp = (value: number) => Math.min(1, Math.max(0, value));

export const CampusRoute = forwardRef<CampusRouteHandle, { progress?: number }>(function CampusRoute(
  { progress = 0 },
  forwardedRef,
) {
  const pathRef = useRef<SVGPathElement>(null);
  const travelledRef = useRef<SVGPathElement>(null);
  const dotRef = useRef<SVGGElement>(null);
  const trailRefs = useRef<Array<SVGCircleElement | null>>([]);
  const checkpointRefs = useRef<Array<SVGGElement | null>>([]);

  const setProgress = (rawProgress: number) => {
    const routeProgress = clamp(rawProgress);
    const path = pathRef.current;
    const travelled = travelledRef.current;
    const dot = dotRef.current;
    if (!path || !travelled || !dot) return;
    const length = path.getTotalLength();
    const point = path.getPointAtLength(length * routeProgress);
    dot.dataset.progress = routeProgress.toFixed(3);
    dot.dataset.routeLength = length.toFixed(2);
    travelled.style.strokeDashoffset = String(1 - routeProgress);
    dot.setAttribute("transform", `translate(${point.x} ${point.y})`);
    trailRefs.current.forEach((trail, index) => {
      if (!trail) return;
      const trailProgress = clamp(routeProgress - (index + 1) * 0.012);
      const trailPoint = path.getPointAtLength(length * trailProgress);
      trail.setAttribute("cx", String(trailPoint.x));
      trail.setAttribute("cy", String(trailPoint.y));
      trail.style.opacity = routeProgress > (index + 1) * 0.012 ? String(0.28 - index * 0.07) : "0";
    });
    [0.02, 0.38, 0.7, 0.98].forEach((threshold, index) => {
      const checkpoint = checkpointRefs.current[index];
      if (checkpoint) checkpoint.style.opacity = routeProgress >= threshold ? "1" : "0";
    });
  };

  useImperativeHandle(forwardedRef, () => ({ setProgress }), []);
  useEffect(() => setProgress(progress), [progress]);

  return (
    <g id="route-to-cse" className={styles.route} aria-hidden="true">
      <path ref={pathRef} className={styles.routeAhead} d={CAMPUS_ROUTE_D} pathLength="1" />
      <path ref={travelledRef} className={styles.routeTravelled} d={CAMPUS_ROUTE_D} pathLength="1" />
      <g id="route-checkpoints">
        <g ref={(node) => { checkpointRefs.current[0] = node; }} className={styles.checkpoint} transform="translate(746 509)"><circle r="2.6" /><text x="-7" y="31" textAnchor="end">ENTRY / 01</text></g>
        <g ref={(node) => { checkpointRefs.current[1] = node; }} className={styles.checkpoint} transform="translate(763 454)"><circle r="2.4" /><text x="7" y="-8">LIBRARY AXIS / 02</text></g>
        <g ref={(node) => { checkpointRefs.current[2] = node; }} className={styles.checkpoint} transform="translate(725 397)"><circle r="2.4" /><text x="8" y="-7">ACADEMIC SPINE / 03</text></g>
        <g ref={(node) => { checkpointRefs.current[3] = node; }} className={styles.checkpoint} transform="translate(706 389)"><circle r="2.6" /><text x="-9" y="18" textAnchor="end">CSE / 04</text></g>
      </g>
      {[0, 1, 2].map((index) => <circle key={index} ref={(node) => { trailRefs.current[index] = node; }} className={styles.routeTrail} r={1.8 - index * 0.3} />)}
      <g ref={dotRef} className={styles.routeDot} data-route-dot transform="translate(746 509)">
        <circle className={styles.routeDotHalo} r="8" />
        <circle className={styles.routeDotCore} r="1.9" />
        <path d="M-11 0H-5M5 0H11M0-11V-5M0 5V11" />
      </g>
    </g>
  );
});
