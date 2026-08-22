"use client";

import { animateSectionHeading, type HomeGsap, useHomeGsap } from "./useHomeGsap";

function setup(gsap: HomeGsap, section: HTMLElement) {
  animateSectionHeading(gsap, section);
  gsap.utils.toArray<HTMLElement>(".resource-rail-row", section).forEach((row, index) => {
    gsap.fromTo(row, { x: index % 2 ? 86 : -86, autoAlpha: .2 }, { x: 0, autoAlpha: 1, ease: "none", scrollTrigger: { trigger: row, start: "top 95%", end: "top 62%", scrub: true } });
  });
}

export function ResourcesMotion() { useHomeGsap("resources", setup); return null; }

