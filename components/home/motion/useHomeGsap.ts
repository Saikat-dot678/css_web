"use client";

import { useEffect } from "react";

export type HomeGsap = typeof import("gsap").gsap;
type SetupMotion = (gsap: HomeGsap, section: HTMLElement) => void;

export function animateSectionHeading(gsap: HomeGsap, section: HTMLElement) {
  const heading = section.querySelector<HTMLElement>("[data-motion-heading]");
  if (!heading) return;
  const index = heading.querySelector<HTMLElement>(".v4-section-index");
  const title = heading.querySelector<HTMLElement>(".v4-section-title");
  const copy = heading.querySelector<HTMLElement>(".v4-section-copy");
  const stamp = heading.querySelector<HTMLElement>(".v4-section-stamp");
  const timeline = gsap.timeline({
    scrollTrigger: { trigger: heading, start: "top 90%", end: "top 48%", scrub: true },
  });
  if (index) timeline.fromTo(index, { x: -56, autoAlpha: .08 }, { x: 0, autoAlpha: 1, ease: "none" }, 0);
  if (title) timeline.fromTo(title, { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", ease: "none" }, .03);
  if (copy) timeline.fromTo(copy, { x: 42, autoAlpha: .08 }, { x: 0, autoAlpha: 1, ease: "none" }, .08);
  if (stamp) timeline.fromTo(stamp, { x: 44, y: 24, rotation: 10, autoAlpha: .1 }, { x: 0, y: 0, rotation: -4, autoAlpha: 1, ease: "none" }, .06);
}

export function useHomeGsap(sectionId: string, setup: SetupMotion) {
  useEffect(() => {
    const section = document.getElementById(sectionId);
    if (!section) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      section.dataset.motionReady = "true";
      return;
    }

    let cancelled = false;
    let context: { revert: () => void } | undefined;
    const boot = async () => {
      const [gsapModule, scrollModule] = await Promise.all([import("gsap"), import("gsap/ScrollTrigger")]);
      if (cancelled) return;
      const gsap = gsapModule.gsap;
      gsap.registerPlugin(scrollModule.ScrollTrigger);
      context = gsap.context(() => setup(gsap, section), section);
      section.dataset.motionReady = "true";
      window.requestAnimationFrame(() => scrollModule.ScrollTrigger.refresh());
    };

    let observer: IntersectionObserver | undefined;
    if ("IntersectionObserver" in window) {
      observer = new IntersectionObserver(([entry]) => {
        if (!entry?.isIntersecting) return;
        observer?.disconnect();
        void boot();
      }, { rootMargin: "650px 0px" });
      observer.observe(section);
    } else {
      void boot();
    }

    return () => {
      cancelled = true;
      observer?.disconnect();
      context?.revert();
    };
  }, [sectionId, setup]);
}

