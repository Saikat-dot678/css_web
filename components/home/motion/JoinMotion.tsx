"use client";

import { type HomeGsap, useHomeGsap } from "./useHomeGsap";

function setup(gsap: HomeGsap, section: HTMLElement) {
  const words = gsap.utils.toArray<HTMLElement>("h2 > *", section);
  if (!words.length) words.push(...gsap.utils.toArray<HTMLElement>("h2", section));
  gsap.fromTo(words, { xPercent: -8, autoAlpha: .18 }, { xPercent: 0, autoAlpha: 1, stagger: .07, ease: "none", scrollTrigger: { trigger: section, start: "top 88%", end: "top 30%", scrub: true } });
}

export function JoinMotion() { useHomeGsap("contact", setup); return null; }

