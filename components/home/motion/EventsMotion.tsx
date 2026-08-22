"use client";

import { animateSectionHeading, type HomeGsap, useHomeGsap } from "./useHomeGsap";

function setup(gsap: HomeGsap, section: HTMLElement) {
  animateSectionHeading(gsap, section);
  const preview = section.querySelector<HTMLElement>(".event-preview");
  if (preview) {
    gsap.fromTo(preview, { x: 110, rotation: 7, scale: .88 }, {
      x: 0, rotation: -1.2, scale: 1, ease: "none",
      scrollTrigger: { trigger: section, start: "top 84%", end: "top 24%", scrub: true },
    });
    gsap.to(preview, { y: -4, rotation: "-=.35", duration: 3.8, repeat: -1, yoyo: true, ease: "sine.inOut" });
  }
  gsap.utils.toArray<HTMLElement>(".event-line", section).forEach((row, index) => {
    gsap.fromTo(row, { x: -54 - index * 7, autoAlpha: .16 }, { x: 0, autoAlpha: 1, ease: "none", scrollTrigger: { trigger: row, start: "top 94%", end: "top 58%", scrub: true } });
  });
}

export function EventsMotion() { useHomeGsap("events", setup); return null; }

