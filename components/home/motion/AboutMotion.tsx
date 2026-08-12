"use client";

import { animateSectionHeading, type HomeGsap, useHomeGsap } from "./useHomeGsap";

function setup(gsap: HomeGsap, section: HTMLElement) {
  animateSectionHeading(gsap, section);
  const sheet = section.querySelector<HTMLElement>(".about-v4-layout");
  if (sheet) {
    gsap.fromTo(sheet, { y: 90, scale: 1.055, rotation: .7 }, {
      y: 0, scale: 1, rotation: 0, ease: "none",
      scrollTrigger: { trigger: section, start: "top 92%", end: "top 24%", scrub: true },
    });
  }
  const statement = section.querySelector<HTMLElement>(".about-v4-statement");
  if (statement) gsap.fromTo(statement, { x: -110 }, { x: 0, ease: "none", scrollTrigger: { trigger: statement, start: "top 94%", end: "top 52%", scrub: true } });
  gsap.utils.toArray<HTMLElement>(".about-v4-principles article", section).forEach((card, index) => {
    gsap.fromTo(card,
      { x: 90 - index * 24, y: 58 - index * 18, rotation: [5, -3, 4][index] },
      { x: 0, y: 0, rotation: 0, ease: "none", scrollTrigger: { trigger: card, start: "top 96%", end: "top 56%", scrub: true } },
    );
  });
}

export function AboutMotion() { useHomeGsap("about", setup); return null; }

