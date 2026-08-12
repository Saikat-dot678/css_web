"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, type CSSProperties } from "react";

import { CampusRoute, type CampusRouteHandle } from "./CampusRoute";
import styles from "./campus-screen.module.css";

export type CampusScreenMapHandle = {
  setFocusProgress: (progress: number) => void;
  setRevealProgress: (progress: number) => void;
  setRouteProgress: (progress: number) => void;
};

type CampusScreenMapProps = {
  className?: string;
  focusProgress?: number;
  revealProgress?: number;
  routeProgress?: number;
  variant?: "device" | "takeover";
};

const clamp = (value: number) => Math.min(1, Math.max(0, value));
const boundary = "1144,255 1091,244 1023,221 910,185 765,141 714,125 625,97 614,93 602,89 599,89 591,85 580,76 575,67 573,52 375,49 60,46 56,47 88,80 132,119 151,138 190,179 256,244 300,291 322,314 341,335 287,379 211,439 196,451 163,485 131,511 149,522 168,555 184,572 221,579 278,581 308,588 324,597 324,608 320,619 319,625 326,629 326,633 343,639 355,645 380,655 418,669 501,695 558,714 726,587 801,531 943,424 1144,255";
const majorRoads = [
  "466,782 495,759 555,714 599,683 678,623 730,584 798,534 806,527 833,507 910,447 969,399 987,384 1070,322 1107,292 1128,276",
  "447,426 464,429 511,445 572,463 592,468 634,479 649,484 659,486 746,509 806,527",
  "517,633 535,656 548,660 556,662 647,586 671,567 738,517 746,509 817,456 806,456",
  "605,367 725,367 763,367 776,361 785,353 817,269",
  "601,449 651,448 659,448 706,448 715,447 722,444 726,442",
  "722,444 732,449 763,454 789,455 806,456",
];
const minorRoads = [
  "798,534 738,517 730,514 641,490 628,486 588,475 580,473 544,463 460,437 453,436",
  "592,468 598,460 601,449 595,419 591,397 576,390 605,367 611,361 552,345",
  "576,390 516,441 511,445",
  "659,448 661,455 660,460 657,475 657,484 659,486",
  "634,479 642,477 646,473 646,461 647,454 651,448",
  "726,442 725,367",
];
const buildings = [
  { id: "new-academic", points: "560,361 595,372 589,376 554,366" },
  { id: "main-academic", points: "567,408 593,416 584,422 559,414" },
  { id: "sac", points: "611,318 663,320 661,332 608,330" },
  { id: "ece", points: "743,374 780,374 788,372 804,374 804,384 783,384 783,382 743,382" },
  { id: "dm-sen", points: "784,387 820,387 820,394 784,394" },
  { id: "library", points: "753,450 753,440 760,440 760,433 774,433 774,441 784,441 784,433 796,433 796,440 802,440 802,448 778,448 778,450" },
  { id: "admin", points: "682,487 726,499 764,467 723,456 712,456 703,458 698,461" },
  { id: "math", points: "767,471 774,473 772,474 778,476 771,482 775,484 770,488 764,487 757,493 745,490" },
] as const;
const vertices = [...majorRoads, ...minorRoads, ...buildings.map((building) => building.points)]
  .flatMap((points) => points.split(" "))
  .map((point) => point.split(",").map(Number) as [number, number]);

export const CampusScreenMap = forwardRef<CampusScreenMapHandle, CampusScreenMapProps>(function CampusScreenMap(
  { className = "", focusProgress = 0, revealProgress = 1, routeProgress = 0, variant = "device" },
  forwardedRef,
) {
  const rootRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<SVGGElement>(null);
  const routeRef = useRef<CampusRouteHandle>(null);

  const setRevealProgress = (value: number) => rootRef.current?.style.setProperty("--map-reveal", String(clamp(value)));
  const setRouteProgress = (value: number) => routeRef.current?.setProgress(clamp(value));
  const setFocusProgress = (value: number) => {
    const focus = clamp(value);
    rootRef.current?.style.setProperty("--map-focus", String(focus));
    const scale = 1 + focus * .54;
    const translateX = (650 - 706 * scale) * focus;
    const translateY = (405 - 389 * scale) * focus;
    cameraRef.current?.setAttribute("transform", `translate(${translateX} ${translateY}) scale(${scale})`);
  };

  useImperativeHandle(forwardedRef, () => ({ setFocusProgress, setRevealProgress, setRouteProgress }), []);
  useEffect(() => setRevealProgress(revealProgress), [revealProgress]);
  useEffect(() => setRouteProgress(routeProgress), [routeProgress]);
  useEffect(() => setFocusProgress(focusProgress), [focusProgress]);

  const customStyle = {
    "--map-focus": String(clamp(focusProgress)),
    "--map-reveal": String(clamp(revealProgress)),
  } as CSSProperties;

  return (
    <div ref={rootRef} className={`${styles.map} ${className}`.trim()} data-map-variant={variant} style={customStyle}>
      <svg viewBox="430 250 500 310" preserveAspectRatio="xMidYMid meet" role="img" aria-labelledby={`screen-map-title-${variant} screen-map-description-${variant}`}>
        <title id={`screen-map-title-${variant}`}>NIT Durgapur route from Main Gate to Computer Science and Engineering</title>
        <desc id={`screen-map-description-${variant}`}>An original technical campus schematic based on official campus references and mapped road geometry.</desc>
        <defs>
          <pattern id={`screen-grid-${variant}`} width="12" height="12" patternUnits="userSpaceOnUse"><path d="M12 0H0V12" fill="none" /></pattern>
          <filter id={`screen-road-glow-${variant}`} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="1.4" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          <filter id={`screen-target-glow-${variant}`} x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>
        <rect width="1200" height="760" className={styles.ground} />
        <rect width="1200" height="760" fill={`url(#screen-grid-${variant})`} className={styles.grid} />
        <g ref={cameraRef} className={styles.camera}>
          <g id="map-vertices" className={styles.vertices}>{vertices.map(([cx, cy], index) => <circle key={index} cx={cx} cy={cy} r={index % 10 === 0 ? 1 : .45} />)}</g>
          <g id="campus-boundary" className={styles.boundary}><polyline points={boundary} pathLength="1" /></g>
          <g id="major-roads" className={styles.majorRoads} filter={`url(#screen-road-glow-${variant})`}>{majorRoads.map((points, index) => <polyline key={index} points={points} pathLength="1" />)}</g>
          <g id="minor-roads" className={styles.minorRoads}>{minorRoads.map((points, index) => <polyline key={index} points={points} pathLength="1" />)}</g>
          <g id="buildings" className={styles.buildings}>{buildings.map((building) => <g key={building.id} data-building={building.id}><polygon points={building.points} transform="translate(3 4)" /><polygon points={building.points} /></g>)}</g>
          <g id="cse-building" className={styles.cseBuilding}>
            <g className={styles.cseMass}>
              <polygon points="693,383 719,383 720,393 693,394" transform="translate(4 6)" />
              <polygon points="693,383 719,383 720,393 693,394" />
              <path d="M698 386h17M698 389h17M706 383v10" />
            </g>
            <circle cx="706" cy="389" r="24" /><circle cx="706" cy="389" r="16" />
            <path className={styles.targetTicks} d="M706 358v8M706 412v8M675 389h8M729 389h8" />
          </g>
          <g id="landmarks" className={styles.labels}>
            <text x="560" y="351">NEW ACADEMIC</text><text x="555" y="432">MAIN ACADEMIC</text><text x="614" y="313">SAC</text>
            <text x="750" y="369">ECE</text><text x="789" y="384">DM SEN</text><text x="757" y="429">CENTRAL LIBRARY</text>
            <text x="696" y="506">ADMIN</text><text x="748" y="502">MATHEMATICS</text>
            <text className={styles.cseLabel} x="682" y="417">CSE DEPARTMENT</text>
          </g>
          <g id="main-gate" className={styles.mainGate} transform="translate(746 509)"><path d="M-8 7L0-7 8 7M-11 8H11M0-7V9" /><circle r="2" /><text x="14" y="14">MAIN GATE</text></g>
          <CampusRoute ref={routeRef} progress={routeProgress} />
        </g>
      </svg>
      <div className={styles.mapHud} aria-hidden="true"><span>NITDGP / CAMPUS LINK</span><strong>MAIN GATE → CSE</strong><small>ORIGINAL VECTOR / NOT FOR NAVIGATION</small></div>
      <div className={styles.north} aria-hidden="true"><span>N / 000</span><i /></div>
    </div>
  );
});
