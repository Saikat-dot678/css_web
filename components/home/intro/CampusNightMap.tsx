"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

import { CampusRoute, type CampusRouteHandle } from "./CampusRoute";
import styles from "./map.module.css";

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
};

const clamp = (value: number) => Math.min(1, Math.max(0, value));

export const CampusNightMap = forwardRef<CampusNightMapHandle, CampusNightMapProps>(function CampusNightMap(
  { className = "", focusProgress = 0, revealProgress = 1, routeProgress = 0 },
  forwardedRef,
) {
  const svgRef = useRef<SVGSVGElement>(null);
  const cameraRef = useRef<SVGGElement>(null);
  const cseRef = useRef<SVGGElement>(null);
  const routeRef = useRef<CampusRouteHandle>(null);
  const focusVeilRef = useRef<SVGRectElement>(null);

  const setRevealProgress = (progress: number) => {
    svgRef.current?.style.setProperty("--map-reveal", String(clamp(progress)));
  };

  const setRouteProgress = (progress: number) => {
    const value = clamp(progress);
    svgRef.current?.style.setProperty("--route-progress", String(value));
    routeRef.current?.setProgress(value);
  };

  const setFocusProgress = (progress: number) => {
    const value = clamp(progress);
    svgRef.current?.style.setProperty("--map-focus", String(value));
    if (cameraRef.current) {
      const scale = 1 + value * 0.34;
      cameraRef.current.style.transform = `translate(${-value * 71}px, ${value * 18}px) scale(${scale})`;
    }
    if (focusVeilRef.current) focusVeilRef.current.style.opacity = String(value * 0.48);
    if (cseRef.current) {
      cseRef.current.style.filter = value > 0.01
        ? `drop-shadow(0 0 ${2 + value * 8}px rgba(242, 193, 78, ${value * 0.58}))`
        : "none";
    }
  };

  useImperativeHandle(forwardedRef, () => ({
    setFocusProgress,
    setRevealProgress,
    setRouteProgress,
  }), []);

  useEffect(() => setRevealProgress(revealProgress), [revealProgress]);
  useEffect(() => setRouteProgress(routeProgress), [routeProgress]);
  useEffect(() => setFocusProgress(focusProgress), [focusProgress]);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const syncViewBox = () => {
      const width = svg.getBoundingClientRect().width;
      if (width < 600) svg.setAttribute("viewBox", "570 0 560 760");
      else if (width < 1000) svg.setAttribute("viewBox", "380 0 720 760");
      else svg.setAttribute("viewBox", "0 0 1200 760");
    };
    const observer = new ResizeObserver(syncViewBox);
    observer.observe(svg);
    syncViewBox();
    return () => observer.disconnect();
  }, []);

  return (
    <section className={`${styles.mapScene} ${className}`.trim()} data-intro-scene="campus-map" aria-label="NIT Durgapur night campus map">
      <svg
        ref={svgRef}
        className={styles.mapSvg}
        viewBox="0 0 1200 760"
        preserveAspectRatio="xMidYMid slice"
        role="img"
        aria-labelledby="campus-map-title campus-map-description"
      >
        <title id="campus-map-title">Technical night map of the NIT Durgapur campus</title>
        <desc id="campus-map-description">
          An original schematic map showing the Main Gate, academic spine, Central Library, ECE, Student Activity Center, and the route to the Computer Science and Engineering department.
        </desc>
        <defs>
          <pattern id="campus-grid" width="30" height="30" patternUnits="userSpaceOnUse">
            <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(102,205,221,.08)" strokeWidth="1" />
          </pattern>
          <pattern id="campus-micro-grid" width="6" height="6" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r=".55" fill="rgba(177,235,243,.16)" />
          </pattern>
          <filter id="road-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2.4" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="target-glow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <clipPath id="campus-clip">
            <path d="M135 139 L421 73 L721 91 L1040 252 L1074 558 L951 691 L579 716 L246 647 L99 442 Z" />
          </clipPath>
        </defs>

        <rect width="1200" height="760" fill="#02080d" />
        <rect width="1200" height="760" fill="url(#campus-grid)" />

        <g ref={cameraRef} className={styles.mapCamera}>
          <g id="campus-boundary" className={styles.boundary}>
            <path d="M135 139 L421 73 L721 91 L1040 252 L1074 558 L951 691 L579 716 L246 647 L99 442 Z" />
            <path d="M153 157 L430 96 L710 111 L1018 266 L1049 550 L936 670 L582 693 L262 628 L123 435 Z" />
          </g>

          <g clipPath="url(#campus-clip)">
            <rect x="85" y="64" width="1010" height="665" fill="url(#campus-micro-grid)" className={styles.microGrid} />

            <g id="minor-roads" className={styles.minorRoads}>
              <path d="M193 214 C311 228 420 221 520 184 C619 147 749 160 866 229" />
              <path d="M176 339 C310 326 409 337 493 380 C585 427 667 431 755 397" />
              <path d="M221 516 C351 489 470 500 579 566 C655 611 733 629 833 620" />
              <path d="M336 143 C350 243 378 342 424 434 C466 519 491 604 489 676" />
              <path d="M599 101 C588 208 600 304 638 394 C675 482 682 574 662 695" />
              <path d="M873 183 C834 278 819 362 832 438 C847 518 894 592 963 650" />
            </g>

            <g id="major-roads" className={styles.majorRoads} filter="url(#road-glow)">
              <path d="M1007 690 C981 661 961 633 931 610 C889 576 842 552 794 535 C753 521 728 493 715 451 C700 403 696 353 702 296 C709 225 750 179 831 153" />
              <path d="M197 591 C329 566 433 532 530 482 C615 439 700 412 809 401 C889 392 965 405 1031 443" />
              <path d="M220 277 C356 292 477 290 584 267 C682 246 772 245 881 270" />
              <path d="M703 298 C765 320 818 340 889 369" />
            </g>

            <g id="landmarks" className={styles.landmarks}>
              <path className={styles.ground} d="M690 239 L832 244 L874 336 L736 350 L672 307 Z" />
              <text x="755" y="286">OVAL CRICKET PARK</text>
              <path className={styles.ground} d="M740 572 L902 553 L953 642 L799 675 L718 629 Z" />
              <text x="858" y="651">LORDS PARK</text>
              <path className={styles.water} d="M276 284 C318 263 342 276 369 319 C390 355 412 370 445 381" />
              <path className={styles.water} d="M441 381 C469 395 489 428 481 464 C472 503 443 532 414 556" />
            </g>

            <g id="buildings" className={styles.buildings}>
              <g className={styles.building} transform="translate(760 514)">
                <path d="M0 0 L72 -8 L85 29 L14 39 Z" /><path className={styles.buildingEdge} d="M14 39 L85 29 L85 37 L14 47 Z" />
                <text x="12" y="60">CENTRAL LIBRARY</text>
              </g>
              <g className={styles.building} transform="translate(757 558)">
                <path d="M0 0 L61 -9 L77 25 L18 35 Z" /><path className={styles.buildingEdge} d="M18 35 L77 25 L77 33 L18 43 Z" />
                <text x="4" y="57">ADMIN BLOCK</text>
              </g>
              <g className={styles.building} transform="translate(820 375)">
                <path d="M0 0 L77 -7 L91 30 L12 39 Z" /><path className={styles.buildingEdge} d="M12 39 L91 30 L91 38 L12 47 Z" />
                <text x="7" y="59">ECE</text>
              </g>
              <g className={styles.building} transform="translate(865 425)">
                <path d="M0 0 L62 -5 L74 27 L10 34 Z" /><path className={styles.buildingEdge} d="M10 34 L74 27 L74 35 L10 42 Z" />
                <text x="4" y="53">DM SEN</text>
              </g>
              <g className={styles.building} transform="translate(618 338)">
                <path d="M0 0 L75 -12 L90 28 L14 40 Z" /><path className={styles.buildingEdge} d="M14 40 L90 28 L90 36 L14 48 Z" />
                <text x="6" y="60">SAC</text>
              </g>
              <g className={styles.building} transform="translate(525 506)">
                <path d="M0 0 L92 -10 L106 31 L15 43 Z" /><path className={styles.buildingEdge} d="M15 43 L106 31 L106 40 L15 52 Z" />
                <text x="9" y="65">MAIN ACADEMIC</text>
              </g>
              <g className={styles.building} transform="translate(862 490)">
                <path d="M0 0 L68 -7 L80 26 L10 34 Z" /><path className={styles.buildingEdge} d="M10 34 L80 26 L80 34 L10 42 Z" />
                <text x="3" y="54">HIGH VOLTAGE LAB</text>
              </g>
              <g className={styles.building} transform="translate(610 207)">
                <path d="M0 0 L88 -8 L102 31 L15 42 Z" /><path className={styles.buildingEdge} d="M15 42 L102 31 L102 40 L15 51 Z" />
                <text x="6" y="64">HEALTH CENTRE</text>
              </g>
              <g className={styles.buildingMuted} transform="translate(333 208)"><path d="M0 0 L95 -8 L108 30 L13 42 Z" /></g>
              <g className={styles.buildingMuted} transform="translate(284 410)"><path d="M0 0 L112 -9 L123 35 L14 48 Z" /></g>
              <g className={styles.buildingMuted} transform="translate(377 590)"><path d="M0 0 L105 -9 L118 33 L14 46 Z" /></g>
              <g className={styles.buildingMuted} transform="translate(498 139)"><path d="M0 0 L82 -7 L94 29 L12 39 Z" /></g>
            </g>

            <g ref={cseRef} id="cse-building" className={styles.cseBuilding} transform="translate(706 411)">
              <path className={styles.cseFootprint} d="M0 12 L72 0 L96 38 L81 68 L17 76 L-7 42 Z" />
              <path className={styles.cseEdge} d="M17 76 L81 68 L81 77 L17 85 Z" />
              <path className={styles.cseDetail} d="M17 26 L70 17 M9 42 L83 30 M19 58 L72 49" />
              <circle className={styles.targetRing} cx="33" cy="37" r="48" />
              <circle className={styles.targetRing} cx="33" cy="37" r="64" />
              <text className={styles.cseLabel} x="10" y="105">CSE DEPARTMENT</text>
              <text className={styles.cseSubLabel} x="10" y="120">COMPUTER SCIENCE + ENGINEERING</text>
            </g>

            <CampusRoute ref={routeRef} progress={routeProgress} />

            <g id="main-gate" className={styles.mainGate} transform="translate(962 628)">
              <path d="M-12 11 L0 -11 L12 11 M-18 11 L18 11" />
              <circle r="3" />
              <text x="16" y="25">MAIN GATE</text>
              <text x="16" y="38">MG AVENUE / EAST EDGE</text>
            </g>

            <g className={styles.mapLights} aria-hidden="true">
              <circle cx="702" cy="297" r="2" /><circle cx="829" cy="403" r="2" /><circle cx="798" cy="538" r="2" />
              <circle cx="619" cy="377" r="2" /><circle cx="526" cy="493" r="2" /><circle cx="886" cy="454" r="2" />
            </g>
          </g>

          <path className={styles.externalRoad} d="M1084 735 C1010 660 1000 571 1038 480 C1063 421 1087 357 1085 282" />
          <text className={styles.externalRoadLabel} x="1046" y="671" transform="rotate(-65 1046 671)">MAHATMA GANDHI AVENUE</text>
        </g>

        <rect ref={focusVeilRef} className={styles.focusVeil} width="1200" height="760" />
        <g className={styles.mapHud} aria-hidden="true">
          <text x="45" y="48">NITDGP / CAMPUS SYSTEM</text>
          <text x="45" y="66">23.5491 N / 87.2909 E</text>
          <text x="1155" y="48" textAnchor="end">NORTH / 000</text>
          <path d="M1139 86 L1154 61 L1169 86 Z M1154 61 L1154 104" />
          <text x="1154" y="119" textAnchor="middle">N</text>
        </g>
        <g className={styles.scanner} aria-hidden="true">
          <line x1="160" y1="0" x2="160" y2="760" />
        </g>
      </svg>

      <div className={styles.mapReadout} aria-hidden="true">
        <span>CSS / CAMPUS RESOLUTION</span>
        <strong>MAIN GATE → CSE</strong>
        <small>ORIGINAL SCHEMATIC / NOT TO SCALE</small>
      </div>
    </section>
  );
});
