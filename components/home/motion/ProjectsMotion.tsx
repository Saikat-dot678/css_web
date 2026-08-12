"use client";

import { animateSectionHeading, type HomeGsap, useHomeGsap } from "./useHomeGsap";

function setup(gsap: HomeGsap, section: HTMLElement) {
  animateSectionHeading(gsap, section);
  gsap.utils.toArray<HTMLElement>(".project-showcase-row", section).forEach((row, index) => {
    const copy = row.querySelector<HTMLElement>(".project-copy");
    const visual = row.querySelector<HTMLElement>(".project-visual");
    const direction = index % 2 ? -1 : 1;
    if (copy) gsap.fromTo(copy, { x: -direction * 100, autoAlpha: .14 }, { x: 0, autoAlpha: 1, ease: "none", scrollTrigger: { trigger: row, start: "top 88%", end: "top 34%", scrub: true } });
    if (visual) {
      gsap.fromTo(visual, { x: direction * 120, y: 54, rotation: direction * 4, scale: .91 }, { x: 0, y: 0, rotation: 0, scale: 1, ease: "none", scrollTrigger: { trigger: row, start: "top 90%", end: "top 26%", scrub: true } });
      gsap.to(visual, { y: -5, duration: 4.2 + index * .4, repeat: -1, yoyo: true, ease: "sine.inOut" });
    }
  });
}

export function ProjectsMotion() { useHomeGsap("projects", setup); return null; }

