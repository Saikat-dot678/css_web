"use client";

import { animateSectionHeading, type HomeGsap, useHomeGsap } from "./useHomeGsap";

function setup(gsap: HomeGsap, section: HTMLElement) {
  animateSectionHeading(gsap, section);
  gsap.utils.toArray<HTMLElement>(".gallery-v4-shot", section).forEach((shot, index) => {
    const scatterX = [-130, 120, -88, 106, -112][index] ?? 0;
    const scatterY = [120, 76, 150, 98, 132][index] ?? 0;
    const rotation = [-8, 6, -5, 8, -6][index] ?? 0;
    gsap.fromTo(shot, { x: scatterX, y: scatterY, rotation, scale: .84 }, { x: 0, y: 0, rotation: rotation * .16, scale: 1, ease: "none", scrollTrigger: { trigger: section, start: "top 90%", end: "top 18%", scrub: true } });
  });
}

export function GalleryMotion() { useHomeGsap("gallery", setup); return null; }

