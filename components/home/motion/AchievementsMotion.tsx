"use client";

import { animateSectionHeading, type HomeGsap, useHomeGsap } from "./useHomeGsap";

function setup(gsap: HomeGsap, section: HTMLElement) {
  animateSectionHeading(gsap, section);
  const line = section.querySelector<HTMLElement>(".achievement-trace");
  if (line) gsap.fromTo(line, { scaleY: 0 }, { scaleY: 1, ease: "none", scrollTrigger: { trigger: section, start: "top 78%", end: "bottom 30%", scrub: true } });
  gsap.utils.toArray<HTMLElement>(".achievement-v4-row", section).forEach((row) => {
    gsap.fromTo(row, { x: 54, autoAlpha: .16 }, { x: 0, autoAlpha: 1, ease: "none", scrollTrigger: { trigger: row, start: "top 94%", end: "top 62%", scrub: true } });
  });
}

export function AchievementsMotion() { useHomeGsap("achievements", setup); return null; }

