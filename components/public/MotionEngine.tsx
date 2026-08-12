"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function MotionEngine() {
  const pathname = usePathname();

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncReducedClass = () => document.documentElement.classList.toggle("v4-reduced-motion", reduced.matches);
    syncReducedClass();
    reduced.addEventListener("change", syncReducedClass);

    const resetFrame = window.requestAnimationFrame(() => {
      if (!window.location.hash) window.scrollTo(0, 0);
    });

    const home = pathname === "/" || pathname === "/home";
    if (home || reduced.matches) {
      return () => {
        window.cancelAnimationFrame(resetFrame);
        reduced.removeEventListener("change", syncReducedClass);
      };
    }

    let cancelled = false;
    let context: { revert: () => void } | undefined;
    const boot = async () => {
      const [gsapModule, scrollModule] = await Promise.all([import("gsap"), import("gsap/ScrollTrigger")]);
      if (cancelled) return;
      const gsap = gsapModule.gsap;
      const ScrollTrigger = scrollModule.ScrollTrigger;
      gsap.registerPlugin(ScrollTrigger);

      context = gsap.context(() => {
        document.querySelectorAll<HTMLElement>("[data-motion-hero]").forEach((hero) => {
          const copy = hero.querySelector<HTMLElement>(".v4-page-hero-copy");
          const visual = hero.querySelector<HTMLElement>(".v4-page-hero-visual");
          const ticket = hero.querySelector<HTMLElement>(".v4-hero-paper-ticket");
          const intro = gsap.timeline({ defaults: { ease: "power3.out" } });
          if (copy) intro.fromTo(copy, { autoAlpha: 0, x: -68, y: 32 }, { autoAlpha: 1, x: 0, y: 0, duration: .68 });
          if (visual) intro.fromTo(visual, { autoAlpha: 0, x: 72, y: 42, rotation: 5, scale: .91 }, { autoAlpha: 1, x: 0, y: 0, rotation: 0, scale: 1, duration: .78 }, .05);
          if (ticket) intro.fromTo(ticket, { autoAlpha: 0, x: 38, rotation: 8 }, { autoAlpha: 1, x: 0, rotation: -3, duration: .52 }, .17);
          if (visual) {
            gsap.to(visual, { y: -56, rotation: -1.5, ease: "none", scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true } });
            gsap.to(visual, { y: "+=8", duration: 4.2, repeat: -1, yoyo: true, ease: "sine.inOut" });
          }
        });

        gsap.utils.toArray<HTMLElement>(
          ".v4-page .poster-card, .v4-page .member-card, .v4-page .resource-card, .v4-page .project-row, .v4-page .timeline-year article, .v4-archive-event",
        ).forEach((item, index) => {
          gsap.fromTo(item,
            { x: index % 2 ? 52 : -52, y: 30, rotation: index % 2 ? 1.2 : -1.2, autoAlpha: .18 },
            { x: 0, y: 0, rotation: 0, autoAlpha: 1, ease: "none", scrollTrigger: { trigger: item, start: "top 94%", end: "top 60%", scrub: true } },
          );
        });

        const atmosphere = document.querySelector<HTMLElement>(".route-atmosphere");
        const page = document.querySelector<HTMLElement>(".v4-page");
        if (atmosphere) {
          const glyph = atmosphere.querySelector<HTMLElement>(".route-glyph");
          const card = atmosphere.querySelector<HTMLElement>(".route-index-card");
          const notes = atmosphere.querySelectorAll<HTMLElement>(".route-floating-note");
          const bar = atmosphere.querySelector<HTMLElement>(".route-trace-progress");
          const cursor = atmosphere.querySelector<HTMLElement>(".route-trace-cursor");
          if (glyph) gsap.to(glyph, { rotation: 11, y: -12, duration: 6.5, repeat: -1, yoyo: true, ease: "sine.inOut" });
          if (card) gsap.to(card, { y: -8, rotation: -1.4, duration: 4.8, repeat: -1, yoyo: true, ease: "sine.inOut" });
          notes.forEach((note, index) => gsap.to(note, { y: index ? 9 : -9, rotation: index ? 7 : -8, duration: 3.5 + index, repeat: -1, yoyo: true, ease: "sine.inOut" }));
          if (page && bar) gsap.to(bar, { scaleY: 1, ease: "none", transformOrigin: "top", scrollTrigger: { trigger: page, start: "top top", end: "bottom bottom", scrub: true } });
          if (page && cursor) gsap.to(cursor, { y: () => Math.max(window.innerHeight - 260, 260), ease: "none", scrollTrigger: { trigger: page, start: "top top", end: "bottom bottom", scrub: true } });
        }
      });
      window.requestAnimationFrame(() => ScrollTrigger.refresh());
    };

    void boot();
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(resetFrame);
      reduced.removeEventListener("change", syncReducedClass);
      context?.revert();
    };
  }, [pathname]);

  return null;
}
