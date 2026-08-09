
/**
 * Original night-map illustration for the CSS homepage.
 * The composition follows the broad visual character of NIT Durgapur's
 * published guide map: an elongated campus footprint, strong perimeter roads,
 * internal cross-roads, green pockets and a water/stream line. It is a visual
 * navigation story, not a survey-accurate map.
 */
export function CampusMap() {
  const route = "M315 650 C350 604 395 570 438 526 C482 480 520 442 566 406 C620 366 666 338 718 304 C758 278 798 254 842 230";

  return (
    <div className="campus-map-sheet" aria-label="Stylised NIT Durgapur night campus map highlighting the CSE department">
      <svg className="campus-guide-svg" viewBox="0 0 1200 760" role="img" aria-label="Night campus schematic with a route to the CSE department">
        <defs>
          <linearGradient id="nightBg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#050b11" />
            <stop offset="58%" stopColor="#09141d" />
            <stop offset="100%" stopColor="#0b1f2b" />
          </linearGradient>
          <linearGradient id="routeGlow" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#ffd25c" />
            <stop offset="55%" stopColor="#ff8d55" />
            <stop offset="100%" stopColor="#ff5536" />
          </linearGradient>
          <pattern id="nightGrid" width="34" height="34" patternUnits="userSpaceOnUse">
            <path d="M34 0H0V34" fill="none" stroke="rgba(140,216,228,.065)" strokeWidth="1" />
          </pattern>
          <filter id="mapGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="7" result="g" />
            <feMerge><feMergeNode in="g" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="smallGlow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="3" result="g" />
            <feMerge><feMergeNode in="g" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        <rect width="1200" height="760" fill="url(#nightBg)" />
        <rect width="1200" height="760" fill="url(#nightGrid)" />

        <g className="map-north-mark" transform="translate(1070 104)">
          <circle r="34" fill="none" stroke="rgba(240,238,232,.22)" />
          <path d="M0 22V-22M-7-12L0-25L7-12" fill="none" stroke="#ffd25c" strokeWidth="2" />
          <text x="-5" y="-42">N</text>
        </g>

        <g className="campus-footprint" transform="rotate(-8 600 380)">
          <path className="campus-boundary" d="M280 680 L214 592 L232 504 L188 410 L230 318 L246 214 L350 112 L510 74 L672 94 L806 62 L938 130 L974 228 L930 314 L970 402 L928 502 L880 610 L710 676 L528 658 L390 706 Z" />

          <path className="campus-water" d="M402 676 C438 612 420 558 454 500 C492 434 470 384 510 326 C548 270 536 218 572 164 C596 128 606 104 608 78" />

          <g className="campus-road-major">
            <path d="M282 674 C324 604 358 560 412 500 C478 426 530 372 600 318 C680 258 768 206 912 150" />
            <path d="M238 536 C344 522 432 492 524 444 C628 390 720 346 918 324" />
            <path d="M272 334 C392 354 514 344 618 302 C736 254 814 216 934 214" />
            <path d="M366 132 C424 216 470 286 528 348 C590 414 664 492 842 594" />
            <path d="M714 88 C700 190 708 278 750 354 C798 440 842 500 892 574" />
          </g>

          <g className="campus-road-minor">
            <path d="M302 592 C390 566 472 548 574 552" />
            <path d="M340 454 C402 430 448 420 520 414" />
            <path d="M542 222 C616 206 690 198 770 194" />
            <path d="M620 518 C672 480 722 462 790 450" />
          </g>

          <g className="campus-green-zones">
            <path d="M278 468 C308 418 360 404 404 430 C440 452 434 508 396 536 C352 570 292 542 278 468Z" />
            <path d="M758 118 C814 94 870 120 892 166 C912 208 874 246 828 238 C780 230 742 182 758 118Z" />
            <path d="M770 500 C816 474 872 492 890 536 C906 576 868 610 824 602 C778 594 746 548 770 500Z" />
          </g>

          <g className="campus-buildings">
            <g transform="translate(270 604)"><rect width="126" height="54" rx="3" /><text x="18" y="34">MAIN GATE</text></g>
            <g transform="translate(432 444)"><rect width="156" height="72" rx="3" /><text x="18" y="42">ACADEMIC</text></g>
            <g transform="translate(570 366)"><rect width="124" height="64" rx="3" /><text x="18" y="38">LIBRARY</text></g>
            <g transform="translate(782 196)"><rect className="campus-cse-building" width="170" height="82" rx="4" /><text x="22" y="48">CSE DEPT.</text></g>
            <g transform="translate(756 392)"><rect width="124" height="62" rx="3" /><text x="18" y="38">SAC</text></g>
            <g transform="translate(650 118)"><rect width="136" height="58" rx="3" /><text x="18" y="35">ADMIN</text></g>
            <g transform="translate(870 286)"><rect width="110" height="56" rx="3" /><text x="18" y="34">ECE</text></g>
            <g transform="translate(310 214)"><rect width="126" height="58" rx="3" /><text x="18" y="35">HALL 12</text></g>
            <g transform="translate(504 154)"><rect width="116" height="54" rx="3" /><text x="18" y="33">DIC</text></g>
            <g transform="translate(550 562)"><rect width="150" height="56" rx="3" /><text x="18" y="34">AUDITORIUM</text></g>
          </g>

          <path className="campus-route-shadow" d={route} />
          <path pathLength="1" className="campus-route-line" d={route} />

          <g className="campus-route-stops" filter="url(#smallGlow)">
            <g className="campus-route-stop route-stop-gate" transform="translate(315 650)"><circle r="9" /><text x="16" y="4">01 / GATE</text></g>
            <g className="campus-route-stop route-stop-academic" transform="translate(490 474)"><circle r="9" /><text x="16" y="4">02 / ACADEMIC</text></g>
            <g className="campus-route-stop route-stop-library" transform="translate(632 370)"><circle r="9" /><text x="16" y="4">03 / LIBRARY</text></g>
            <g className="campus-route-stop route-stop-cse" transform="translate(842 230)"><circle r="11" /><text x="16" y="4">04 / CSE</text></g>
          </g>

          <g className="campus-cse-pulse" filter="url(#mapGlow)">
            <circle cx="866" cy="237" r="38" fill="none" stroke="#ff5f3e" strokeWidth="2" strokeDasharray="7 8" />
            <circle cx="866" cy="237" r="60" fill="none" stroke="#ffd25c" strokeOpacity=".7" strokeWidth="1.5" />
          </g>

          <g className="map-city-lights">
            <circle cx="354" cy="570" r="3" /><circle cx="412" cy="520" r="2.4" /><circle cx="470" cy="402" r="2.6" />
            <circle cx="610" cy="288" r="2.3" /><circle cx="692" cy="258" r="2.5" /><circle cx="740" cy="462" r="2.3" />
            <circle cx="836" cy="338" r="2.6" /><circle cx="912" cy="426" r="2.2" /><circle cx="522" cy="582" r="2.2" />
          </g>

          <circle className="route-runner" r="5" filter="url(#smallGlow)">
            <animateMotion dur="4.8s" repeatCount="indefinite" path={route} />
          </circle>
        </g>

        <g className="map-register-marks">
          <circle className="map-register-dot" cx="36" cy="36" r="4" />
          <circle className="map-register-dot" cx="1164" cy="36" r="4" />
          <circle className="map-register-dot" cx="36" cy="724" r="4" />
          <circle className="map-register-dot" cx="1164" cy="724" r="4" />
        </g>
      </svg>

      <div className="campus-map-caption">
        <span>GUIDE MAP / NIT DURGAPUR</span>
        <strong>TRACE 01 → 04 / CSE</strong>
        <small>STYLISED / NIGHT SCHEMATIC</small>
      </div>
    </div>
  );
}
