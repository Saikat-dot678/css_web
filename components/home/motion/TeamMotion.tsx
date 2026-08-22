"use client";

import { animateSectionHeading, type HomeGsap, useHomeGsap } from "./useHomeGsap";

function setup(gsap: HomeGsap, section: HTMLElement) {
  animateSectionHeading(gsap, section);
  const photos = gsap.utils.toArray<HTMLElement>(".people-photo-stack figure", section);
  photos.forEach((photo, index) => {
    gsap.fromTo(photo,
      { x: (index - 1.5) * -42, y: index * -9, rotation: (index - 1.5) * 7, scale: .8 },
      { x: 0, y: 0, rotation: [-4, 3, -2, 4][index] ?? 0, scale: 1, ease: "none", scrollTrigger: { trigger: section, start: "top 86%", end: "top 28%", scrub: true } },
    );
  });
  gsap.utils.toArray<HTMLElement>(".people-group-row", section).forEach((row, index) => {
    gsap.fromTo(row, { x: 70 + index * 8, autoAlpha: .18 }, { x: 0, autoAlpha: 1, ease: "none", scrollTrigger: { trigger: row, start: "top 94%", end: "top 61%", scrub: true } });
  });
}

export function TeamMotion() { useHomeGsap("team", setup); return null; }

