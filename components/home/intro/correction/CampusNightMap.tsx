"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState, type CSSProperties } from "react";

import { CampusRoute, type CampusRouteHandle } from "./CampusRoute";
import styles from "./correction.module.css";

export type CampusNightMapHandle = {
  setFocusProgress: (progress: number) => void;
  setRevealProgress: (progress: number) => void;
  setRouteProgress: (progress: number) => void;
};

type CampusNightMapProps = {
  className?: string;
  focusProgress?: number;
  revealProgress?: number;
  routeProgress?: number;
  showRoute?: boolean;
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

const secondaryRoads = [
  "798,534 738,517 730,514 641,490 628,486 588,475 580,473 544,463 460,437 453,436",
  "592,468 598,460 601,449 595,419 591,397 576,390 605,367 611,361 552,345",
  "576,390 516,441 511,445",
  "659,448 661,455 660,460 657,475 657,484 659,486",
  "646,473 649,475 653,476 657,475",
  "634,479 642,477 646,473 646,461 647,454 651,448",
  "588,475 582,480 577,483 560,490 551,491",
  "726,442 725,367",
];

const buildings = [
  { id: "new-academic", label: "NEW ACADEMIC", points: "560,361 595,372 589,376 554,366" },
  { id: "main-academic", label: "MAIN ACADEMIC", points: "567,408 593,416 584,422 559,414" },
  { id: "sac", label: "SAC", points: "611,318 663,320 661,332 608,330" },
  { id: "ece", label: "ECE", points: "743,374 780,374 788,372 804,374 804,384 783,384 783,382 743,382" },
  { id: "dm-sen", label: "DM SEN", points: "784,387 820,387 820,394 784,394" },
  { id: "library", label: "CENTRAL LIBRARY", points: "753,450 753,440 760,440 760,433 774,433 774,441 784,441 784,433 796,433 796,440 802,440 802,448 778,448 778,450" },
  { id: "admin", label: "ADMIN", points: "682,487 726,499 764,467 723,456 712,456 703,458 698,461" },
  { id: "math", label: "MATHEMATICS", points: "767,471 774,473 772,474 778,476 771,482 775,484 770,488 764,487 757,493 745,490" },
  { id: "high-voltage", label: "HV LAB", points: "851,444 866,448 855,457 851,456 848,458 843,457 846,454 840,453" },
] as const;

const mapVertices = [...majorRoads, ...secondaryRoads, ...buildings.map((building) => building.points)]
  .flatMap((points) => points.split(" "))
  .map((point) => point.split(",").map(Number) as [number, number]);

export const CampusNightMap = forwardRef<CampusNightMapHandle, CampusNightMapProps>(function CampusNightMap(
  { className = "", focusProgress = 0, revealProgress = 1, routeProgress = 0, showRoute = true },
  forwardedRef,
) {
  const rootRef = useRef<HTMLElement>(null);
  const cameraRef = useRef<SVGGElement>(null);
  const routeRef = useRef<CampusRouteHandle>(null);
  const [viewBox, setViewBox] = useState("400 250 500 310");

  const setRevealProgress = (value: number) => {
    rootRef.current?.style.setProperty("--map-reveal", String(clamp(value)));
  };
  const setFocusProgress = (value: number) => {
    const focus = clamp(value);
    rootRef.current?.style.setProperty("--map-focus", String(focus));
    const scale = 1 + focus * 0.58;
    const targetX = 650;
    const targetY = 405;
    const translateX = (targetX - 706 * scale) * focus;
    const translateY = (targetY - 389 * scale) * focus;
    cameraRef.current?.setAttribute("transform", `translate(${translateX} ${translateY}) scale(${scale})`);
  };
  const setRouteProgress = (value: number) => routeRef.current?.setProgress(value);

  useImperativeHandle(forwardedRef, () => ({ setFocusProgress, setRevealProgress, setRouteProgress }), []);

  useEffect(() => setRevealProgress(revealProgress), [revealProgress]);
  useEffect(() => setFocusProgress(focusProgress), [focusProgress]);
  useEffect(() => setRouteProgress(routeProgress), [routeProgress]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const observer = new ResizeObserver(([entry]) => {
      const width = entry?.contentRect.width ?? 1200;
      setViewBox(width < 600 ? "535 275 360 255" : width < 980 ? "455 245 455 310" : "400 250 500 310");
    });
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  const customStyle = {
    "--map-focus": String(clamp(focusProgress)),
    "--map-reveal": String(clamp(revealProgress)),
  } as CSSProperties;

  return (
    <section ref={rootRef} className={`${styles.mapScene} ${className}`.trim()} style={customStyle} aria-label="Coordinate-derived NIT Durgapur academic precinct night map">
      <svg viewBox={viewBox} role="img" aria-labelledby="corrected-map-title corrected-map-description" preserveAspectRatio="xMidYMid meet">
        <title id="corrected-map-title">NIT Durgapur Main Gate to Computer Science and Engineering department</title>
        <desc id="corrected-map-description">An original technical map based on the official institute guide and OpenStreetMap geometry. The Main Gate route follows mapped campus roads through the eastern academic precinct to the CSE building.</desc>
        <defs>
          <pattern id="corrected-grid" width="12" height="12" patternUnits="userSpaceOnUse"><path d="M12 0H0V12" fill="none" /></pattern>
          <filter id="corrected-road-glow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="1.6" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          <filter id="corrected-target-glow" x="-120%" y="-120%" width="340%" height="340%"><feGaussianBlur stdDeviation="3.5" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          <linearGradient id="corrected-building-face" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#0c1c2a" /><stop offset="1" stopColor="#06101a" /></linearGradient>
        </defs>
        <rect x="0" y="0" width="1200" height="760" className={styles.mapGround} />
        <rect x="0" y="0" width="1200" height="760" fill="url(#corrected-grid)" className={styles.mapGrid} />

        <g ref={cameraRef} className={styles.mapCamera}>
          <g id="map-vertices" className={styles.mapVertices}>
            {mapVertices.map(([cx, cy], index) => <circle key={index} cx={cx} cy={cy} r={index % 9 === 0 ? 1.1 : 0.55} />)}
          </g>
          <g id="campus-boundary" className={styles.boundary}><polyline points={boundary} pathLength="1" /></g>
          <g id="major-roads" className={styles.majorRoads}>{majorRoads.map((points, index) => <polyline key={index} points={points} pathLength="1" />)}</g>
          <g id="secondary-roads" className={styles.secondaryRoads}>{secondaryRoads.map((points, index) => <polyline key={index} points={points} pathLength="1" />)}</g>

          <g id="buildings" className={styles.buildings}>
            {buildings.map((building) => (
              <g key={building.id} data-building={building.id}>
                <polygon className={styles.buildingExtrusion} points={building.points} transform="translate(3 4)" />
                <polygon className={styles.buildingFace} points={building.points} />
              </g>
            ))}
          </g>

          <g id="cse-building" className={styles.cseBuilding}>
            <g className={styles.cseMass}>
              <polygon className={styles.cseExtrusion} points="693,383 719,383 720,393 693,394" transform="translate(4 6)" />
              <path className={styles.cseRiseLines} d="M693 383v-7M719 383v-7M720 393v-7M693 394v-7" />
              <polygon className={styles.cseRoof} points="693,383 719,383 720,393 693,394" />
              <path className={styles.cseRoofDetail} d="M698 386h17M698 389h17M706 383v10" />
            </g>
            <circle className={styles.targetRingOuter} cx="706" cy="389" r="24" />
            <circle className={styles.targetRingInner} cx="706" cy="389" r="16" />
            <path className={styles.targetTicks} d="M706 358v8M706 412v8M675 389h8M729 389h8" />
          </g>

          <g id="landmarks" className={styles.landmarks}>
            <text x="560" y="351">NEW ACADEMIC</text>
            <text className={styles.mobileEssential} x="555" y="432">MAIN ACADEMIC</text>
            <text x="614" y="313">SAC</text>
            <text className={styles.mobileEssential} x="750" y="369">ECE</text>
            <text x="789" y="384">DM SEN</text>
            <text className={styles.mobileEssential} x="757" y="429">CENTRAL LIBRARY</text>
            <text x="696" y="506">ADMIN</text>
            <text x="748" y="502">MATHEMATICS</text>
            <text x="843" y="466">HV LAB</text>
            <text className={styles.cseLabel} x="682" y="417">CSE DEPARTMENT</text>
            <text className={styles.cseSubLabel} x="682" y="426">COMPUTER SCIENCE &amp; ENGINEERING</text>
          </g>

          <g id="ambient-lights" className={styles.ambientLights}>
            {[[548, 320], [631, 323], [708, 313], [576, 414], [777, 441], [711, 471], [798, 390], [643, 515]].map(([cx, cy], index) => <circle key={index} cx={cx} cy={cy} r={index % 3 === 1 ? 1.4 : 1} />)}
          </g>

          <g id="main-gate" className={styles.mainGate} transform="translate(746 509)">
            <path d="M-8 7L0-7 8 7M-11 8H11M0-7V9" />
            <circle r="2.2" />
            <text x="14" y="14">MAIN GATE</text>
          </g>

          {showRoute ? <CampusRoute ref={routeRef} progress={routeProgress} /> : null}

          <g id="cse-target-panel" className={styles.targetPanel} transform="translate(655 340)">
            <path d="M0 0H103V30H0Z" />
            <text x="7" y="10">TARGET ACQUIRED</text>
            <text x="7" y="21">COMPUTER SCIENCE &amp; ENGINEERING</text>
          </g>
        </g>

        <g className={styles.overview} transform="translate(410 263)">
          <rect width="92" height="62" />
          <polyline points={boundary} transform="translate(2 2) scale(.075)" />
          <rect x="31" y="20" width="42" height="27" />
          <text x="5" y="57">EAST PRECINCT</text>
        </g>
      </svg>

      <div className={styles.mapHud} aria-hidden="true">
        <div><span>NITDGP / EAST CAMPUS</span><strong>ACADEMIC PRECINCT</strong><small>ORIGINAL VECTOR / GEO-REFERENCED</small></div>
        <div><span>NORTH / 000</span><i /></div>
      </div>
      <div className={styles.mapSource} aria-hidden="true"><span>SPATIAL BASIS</span><strong>NITDGP GUIDE + OPENSTREETMAP</strong><small>SCHEMATIC / NOT FOR NAVIGATION</small></div>
    </section>
  );
});
