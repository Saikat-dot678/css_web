
"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function MotionEngine() {
  const pathname = usePathname();

  useEffect(() => {
    let cancelled = false;
    let cleanup: (() => void) | undefined;

    const boot = async () => {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
      if (reduced.matches) {
        document.documentElement.classList.add("v4-reduced-motion");
        return;
      }

      const [gsapModule, scrollModule, lenisModule] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
        import("lenis"),
      ]);
      if (cancelled) return;

      const gsap = gsapModule.gsap;
      const ScrollTrigger = scrollModule.ScrollTrigger;
      const Lenis = lenisModule.default;
      gsap.registerPlugin(ScrollTrigger);

      // Lenis smooth scroll engine synchronized with GSAP ScrollTrigger
      const lenis = new Lenis({
        duration: 1.2,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        touchMultiplier: 1.5,
      });

      lenis.on("scroll", () => {
        ScrollTrigger.update();
      });

      const tickerCallback = (time: number) => {
        lenis.raf(time * 1000);
      };
      gsap.ticker.add(tickerCallback);
      gsap.ticker.lagSmoothing(0);

      // Smooth scroll for anchor links
      const handleAnchorClick = (e: MouseEvent) => {
        const anchor = (e.target as HTMLElement)?.closest<HTMLAnchorElement>('a[href^="#"]');
        if (!anchor) return;
        const href = anchor.getAttribute("href");
        if (!href || href === "#") return;
        const targetEl = document.querySelector<HTMLElement>(href);
        if (targetEl) {
          e.preventDefault();
          lenis.scrollTo(targetEl, { offset: -70 });
        }
      };
      document.addEventListener("click", handleAnchorClick);

      // Reset scroll position on route change
      lenis.scrollTo(0, { immediate: true });

      const ctx = gsap.context(() => {
        const story = document.querySelector<HTMLElement>(".campus-story");
        if (story) {
          const q = gsap.utils.selector(story);
          const route = q(".campus-route-line");

          gsap.set(q(".campus-opening"), { autoAlpha: 1, y: 0 });
          gsap.set(q(".campus-poster-sheet"), { autoAlpha: 1, xPercent: 0, yPercent: 0, rotation: -1.2, scale: 1 });
          gsap.set(q(".campus-map-board"), { autoAlpha: 0.30, scale: 1.04, xPercent: -2, yPercent: 1, rotation: -0.6 });
          gsap.set(q(".campus-map-hud"), { autoAlpha: 0.22 });
          gsap.set(q(".campus-route-stop"), { autoAlpha: 0.15, scale: 0.8, transformOrigin: "50% 50%" });
          gsap.set(q(".campus-cse-building"), { fill: "#102738" });
          gsap.set(q(".campus-cse-pulse"), { autoAlpha: 0.20, scale: 0.9, transformOrigin: "50% 50%" });
          gsap.set(route, { strokeDashoffset: 1 });
          gsap.set(q(".scene-label-map, .scene-label-lock"), { autoAlpha: 0 });
          gsap.set(q(".cse-focus-card"), { autoAlpha: 0, scale: 0.76, rotation: 8, xPercent: -50, yPercent: -50, y: 42 });
          gsap.set(q(".society-reveal"), { autoAlpha: 0 });
          gsap.set(q(".society-word"), { yPercent: 115, autoAlpha: 0 });

          // Ambient motion exists even before the user scrolls.
          gsap.to(q(".campus-poster-sheet"), { y: -8, rotation: 0.4, duration: 4.8, repeat: -1, yoyo: true, ease: "sine.inOut" });
          gsap.to(q(".ambient-chip.chip-a"), { y: -10, x: 6, duration: 3.4, repeat: -1, yoyo: true, ease: "sine.inOut" });
          gsap.to(q(".ambient-chip.chip-b"), { y: 9, x: -4, duration: 4.1, repeat: -1, yoyo: true, ease: "sine.inOut" });
          gsap.to(q(".ambient-chip.chip-c"), { y: -7, duration: 2.9, repeat: -1, yoyo: true, ease: "sine.inOut" });
          gsap.to(q(".campus-cse-pulse circle"), { scale: 1.12, transformOrigin: "50% 50%", duration: 1.9, repeat: -1, yoyo: true, stagger: 0.18, ease: "sine.inOut" });
          gsap.to(q(".map-city-lights circle"), { opacity: 0.2, duration: 1.4, repeat: -1, yoyo: true, stagger: 0.13, ease: "sine.inOut" });

          // Pinning is handled by ScrollTrigger. This fixes the previous blank gap
          // when users wheel quickly past a CSS-sticky + scrubbed timeline.
          const hero = gsap.timeline({
            scrollTrigger: {
              trigger: story,
              start: "top top",
              end: () => `+=${Math.round(window.innerHeight * 3.65)}`,
              scrub: true,
              pin: story,
              pinSpacing: true,
              invalidateOnRefresh: true,
              anticipatePin: 1,
            },
          });

          hero
            // 00 → 22: poster world gives way to the map, without ever becoming empty.
            .to(q(".scroll-cue"), { autoAlpha: 0, duration: 0.05 }, 0.02)
            .to(q(".scene-label-map"), { autoAlpha: 1, duration: 0.07 }, 0.06)
            .to(q(".campus-map-board"), { autoAlpha: 0.72, scale: 1.01, xPercent: 0, yPercent: 0, rotation: 0, duration: 0.18, ease: "power1.out" }, 0.03)
            .to(q(".campus-opening"), { xPercent: -4, y: -22, autoAlpha: 0.55, duration: 0.18, ease: "power1.inOut" }, 0.04)
            .to(q(".campus-poster-sheet"), { xPercent: 30, yPercent: -1, scale: 0.82, rotation: 7, autoAlpha: 0.72, duration: 0.18, ease: "power1.inOut" }, 0.05)
            .to(q(".campus-map-hud"), { autoAlpha: 1, duration: 0.12 }, 0.10)
            .to(story, { "--map-scan-x": "82%", duration: 0.28, ease: "none" }, 0.11)

            // 22 → 58: route drawing and staged node activation.
            .to(route, { strokeDashoffset: 0, duration: 0.34, ease: "none" }, 0.20)
            .to(q(".route-stop-gate"), { autoAlpha: 1, scale: 1, duration: 0.06, ease: "back.out(2)" }, 0.20)
            .to(q(".route-stop-academic"), { autoAlpha: 1, scale: 1, duration: 0.06, ease: "back.out(2)" }, 0.30)
            .to(q(".route-stop-library"), { autoAlpha: 1, scale: 1, duration: 0.06, ease: "back.out(2)" }, 0.40)
            .to(q(".route-stop-cse"), { autoAlpha: 1, scale: 1.18, duration: 0.07, ease: "back.out(2)" }, 0.50)
            .to(q(".campus-cse-building"), { fill: "#ff5c3d", stroke: "#ffe08a", duration: 0.06 }, 0.50)
            .to(q(".campus-cse-pulse"), { autoAlpha: 1, scale: 1, duration: 0.08 }, 0.50)
            .to(q(".scene-label-map"), { autoAlpha: 0, duration: 0.05 }, 0.52)
            .to(q(".scene-label-lock"), { autoAlpha: 1, duration: 0.05 }, 0.53)

            // 58 → 78: cinematic zoom toward the target while keeping the map visible.
            .to(q(".campus-opening"), { autoAlpha: 0.08, duration: 0.10 }, 0.54)
            .to(q(".campus-poster-sheet"), { xPercent: 42, yPercent: -4, scale: 0.68, rotation: 10, autoAlpha: 0.34, duration: 0.14 }, 0.55)
            .to(q(".campus-map-board"), { xPercent: -16, yPercent: 8, scale: 1.30, rotation: -1.6, autoAlpha: 0.92, duration: 0.21, ease: "power1.inOut" }, 0.57)
            .to(q(".cse-focus-card"), { autoAlpha: 1, scale: 1, rotation: -4, y: 0, duration: 0.12, ease: "back.out(1.35)" }, 0.64)
            .to(q(".ambient-chip"), { autoAlpha: 0.15, duration: 0.09 }, 0.66)
            .to(q(".scene-label-lock"), { autoAlpha: 0, duration: 0.05 }, 0.72)

            // 78 → 100: map becomes texture; title assembles in four beats.
            .to(q(".society-reveal"), { autoAlpha: 1, duration: 0.08 }, 0.76)
            .to(q(".campus-map-board"), { xPercent: -19, yPercent: 10, scale: 1.36, autoAlpha: 0.34, duration: 0.18 }, 0.76)
            .to(q(".cse-focus-card"), { xPercent: -44, yPercent: -48, scale: 0.74, rotation: 5, autoAlpha: 0.55, duration: 0.15 }, 0.78)
            .to(q(".word-computer"), { yPercent: 0, autoAlpha: 1, duration: 0.08, ease: "power2.out" }, 0.79)
            .to(q(".word-science"), { yPercent: 0, autoAlpha: 1, duration: 0.08, ease: "power2.out" }, 0.83)
            .to(q(".word-students"), { yPercent: 0, autoAlpha: 1, duration: 0.08, ease: "power2.out" }, 0.87)
            .to(q(".word-society"), { yPercent: 0, autoAlpha: 1, duration: 0.08, ease: "power2.out" }, 0.91)
            .to(q(".society-reveal-bottom, .society-issue-tab, .society-reveal > .system-label"), { autoAlpha: 1, duration: 0.06 }, 0.92);
        }

        // Shared headings: the index, headline, copy and V3 stamp each arrive
        // on a different vector so the sections do not feel like template fades.
        gsap.utils.toArray<HTMLElement>("[data-motion-heading]").forEach((heading) => {
          const index = heading.querySelector<HTMLElement>(".v4-section-index");
          const title = heading.querySelector<HTMLElement>(".v4-section-title");
          const copy = heading.querySelector<HTMLElement>(".v4-section-copy");
          const stamp = heading.querySelector<HTMLElement>(".v4-section-stamp");
          const tl = gsap.timeline({ scrollTrigger: { trigger: heading, start: "top 92%", end: "top 46%", scrub: true } });
          if (index) tl.fromTo(index, { x: -55, autoAlpha: 0.05 }, { x: 0, autoAlpha: 1, ease: "none" }, 0);
          if (title) tl.fromTo(title, { y: 48, x: -18, autoAlpha: 0.35 }, { y: 0, x: 0, autoAlpha: 1, ease: "none" }, 0.02);
          if (copy) tl.fromTo(copy, { y: 36, x: 30, autoAlpha: 0.12 }, { y: 0, x: 0, autoAlpha: 1, ease: "none" }, 0.08);
          if (stamp) tl.fromTo(stamp, { y: 34, x: 42, rotation: 12, autoAlpha: 0.2 }, { y: 0, x: 0, rotation: -4, autoAlpha: 1, ease: "none" }, 0.06);
        });

        // HOME — section choreography. Replacing CPU clipPath with GPU scale/y transitions.
        const about = document.querySelector<HTMLElement>("#about");
        if (about) {
          gsap.fromTo(about, { autoAlpha: 0.85, scale: 0.96, y: 32 }, {
            autoAlpha: 1, scale: 1, y: 0,
            ease: "none",
            scrollTrigger: { trigger: about, start: "top 94%", end: "top 28%", scrub: true },
          });
          const statement = about.querySelector<HTMLElement>(".about-v4-statement");
          if (statement) gsap.fromTo(statement, { x: -100, y: 40 }, { x: 0, y: 0, ease: "none", scrollTrigger: { trigger: about, start: "top 84%", end: "top 32%", scrub: true } });
          const cards = gsap.utils.toArray<HTMLElement>(".about-v4-principles article");
          cards.forEach((card, index) => gsap.fromTo(card,
            { x: 120 + index * 20, y: 40 - index * 10, rotation: [5, -4, 6][index % 3] },
            { x: 0, y: 0, rotation: 0, ease: "none", scrollTrigger: { trigger: card, start: "top 96%", end: "top 54%", scrub: true } }
          ));
        }

        const events = document.querySelector<HTMLElement>("#events");
        if (events) {
          const list = events.querySelector<HTMLElement>(".events-list");
          const preview = events.querySelector<HTMLElement>(".event-preview");
          if (list) gsap.fromTo(list, { x: -80, autoAlpha: 0.25 }, { x: 0, autoAlpha: 1, ease: "none", scrollTrigger: { trigger: events, start: "top 86%", end: "top 30%", scrub: true } });
          if (preview) gsap.fromTo(preview, { x: 100, y: 70, rotation: 6, scale: 0.88 }, { x: 0, y: -26, rotation: -2, scale: 1, ease: "none", scrollTrigger: { trigger: events, start: "top 88%", end: "bottom 24%", scrub: true } });
          gsap.utils.toArray<HTMLElement>(".event-line").forEach((row, index) => {
            gsap.fromTo(row, { x: -30 - index * 8, autoAlpha: 0.2 }, { x: 0, autoAlpha: 1, ease: "none", scrollTrigger: { trigger: row, start: "top 92%", end: "top 58%", scrub: true } });
          });
        }

        gsap.utils.toArray<HTMLElement>(".project-showcase-row").forEach((row, index) => {
          const visual = row.querySelector<HTMLElement>(".project-visual");
          const copy = row.querySelector<HTMLElement>(".project-copy");
          if (visual) gsap.fromTo(visual,
            { x: index % 2 ? -110 : 110, y: 70, rotation: index % 2 ? -5 : 5, scale: 0.9 },
            { x: 0, y: -28, rotation: 0, scale: 1, ease: "none", scrollTrigger: { trigger: row, start: "top 90%", end: "bottom 22%", scrub: true } }
          );
          if (copy) gsap.fromTo(copy,
            { x: index % 2 ? 90 : -90, y: 28, autoAlpha: 0.25 },
            { x: 0, y: -10, autoAlpha: 1, ease: "none", scrollTrigger: { trigger: row, start: "top 88%", end: "bottom 28%", scrub: true } }
          );
        });

        const resources = document.querySelector<HTMLElement>("#resources");
        if (resources) {
          gsap.utils.toArray<HTMLElement>(".resource-rail-row").forEach((row, index) => {
            gsap.fromTo(row, { x: index % 2 ? 90 : -90, autoAlpha: 0.3 }, { x: 0, autoAlpha: 1, ease: "none", scrollTrigger: { trigger: row, start: "top 94%", end: "top 58%", scrub: true } });
          });
        }

        const team = document.querySelector<HTMLElement>("#team");
        if (team) {
          const number = team.querySelector<HTMLElement>(".people-number");
          if (number) gsap.fromTo(number, { scale: 0.82, rotation: -3 }, { scale: 1, rotation: 0, ease: "none", scrollTrigger: { trigger: team, start: "top 90%", end: "top 28%", scrub: true } });
          gsap.utils.toArray<HTMLElement>(".people-group-row").forEach((row, index) => gsap.fromTo(row,
            { x: 80 + index * 12, autoAlpha: 0.25 },
            { x: 0, autoAlpha: 1, ease: "none", scrollTrigger: { trigger: row, start: "top 92%", end: "top 58%", scrub: true } }
          ));
        }

        gsap.utils.toArray<HTMLElement>(".achievement-v4-row").forEach((row, index) => {
          gsap.fromTo(row, { x: index % 2 ? 46 : -46, autoAlpha: 0.25 }, { x: 0, autoAlpha: 1, ease: "none", scrollTrigger: { trigger: row, start: "top 94%", end: "top 60%", scrub: true } });
        });

        gsap.utils.toArray<HTMLElement>(".gallery-v4-grid > *").forEach((shot, index) => {
          const r = [-6, 5, -4, 6, -5][index % 5];
          gsap.fromTo(shot, { x: index % 2 ? 80 : -80, y: 90, rotation: r, scale: 0.88 }, { x: 0, y: -24, rotation: r * 0.25, scale: 1, ease: "none", scrollTrigger: { trigger: shot, start: "top 98%", end: "bottom 20%", scrub: true } });
        });

        const join = document.querySelector<HTMLElement>(".v4-join");
        if (join) {
          const words = join.querySelectorAll<HTMLElement>("h2, h2 span");
          gsap.fromTo(words, { xPercent: -6, autoAlpha: 0.3 }, { xPercent: 0, autoAlpha: 1, stagger: 0.05, ease: "none", scrollTrigger: { trigger: join, start: "top 90%", end: "top 32%", scrub: true } });
        }

        // Secondary-page heroes + content blocks.
        document.querySelectorAll<HTMLElement>("[data-motion-hero]").forEach((heroEl) => {
          const copy = heroEl.querySelector<HTMLElement>(".v4-page-hero-copy");
          const visual = heroEl.querySelector<HTMLElement>(".v4-page-hero-visual");
          const ticket = heroEl.querySelector<HTMLElement>(".v4-hero-paper-ticket");
          const intro = gsap.timeline({ defaults: { ease: "power3.out" } });
          if (copy) intro.fromTo(copy, { autoAlpha: 0, x: -70, y: 40 }, { autoAlpha: 1, x: 0, y: 0, duration: 0.7 });
          if (visual) intro.fromTo(visual, { autoAlpha: 0, x: 70, y: 45, rotation: 5, scale: 0.9 }, { autoAlpha: 1, x: 0, y: 0, rotation: 0, scale: 1, duration: 0.8 }, 0.06);
          if (ticket) intro.fromTo(ticket, { autoAlpha: 0, x: 40, rotation: 9 }, { autoAlpha: 1, x: 0, rotation: -3, duration: 0.55 }, 0.18);
          if (visual) {
            gsap.to(visual, { y: -60, rotation: -2, ease: "none", scrollTrigger: { trigger: heroEl, start: "top top", end: "bottom top", scrub: true } });
            gsap.to(visual, { y: "+=10", duration: 3.8, repeat: -1, yoyo: true, ease: "sine.inOut" });
          }
        });

        gsap.utils.toArray<HTMLElement>(
          ".v4-page .poster-card, .v4-page .member-card, .v4-page .resource-card, .v4-page .project-row, .v4-page .timeline-year article, .v4-archive-event"
        ).forEach((item, index) => {
          gsap.fromTo(item,
            { x: index % 2 ? 58 : -58, y: 34, rotation: index % 2 ? 1.4 : -1.4, autoAlpha: 0.2 },
            { x: 0, y: 0, rotation: 0, autoAlpha: 1, ease: "none", scrollTrigger: { trigger: item, start: "top 94%", end: "top 60%", scrub: true } }
          );
        });

        const routeAtmosphere = document.querySelector<HTMLElement>(".route-atmosphere");
        if (routeAtmosphere) {
          const glyph = routeAtmosphere.querySelector<HTMLElement>(".route-glyph");
          const card = routeAtmosphere.querySelector<HTMLElement>(".route-index-card");
          const notes = routeAtmosphere.querySelectorAll<HTMLElement>(".route-floating-note");
          const bar = routeAtmosphere.querySelector<HTMLElement>(".route-trace-progress");
          const cursor = routeAtmosphere.querySelector<HTMLElement>(".route-trace-cursor");
          const page = document.querySelector<HTMLElement>(".v4-page");
          if (glyph) gsap.to(glyph, { rotation: 12, y: -14, duration: 6.5, repeat: -1, yoyo: true, ease: "sine.inOut" });
          if (card) gsap.to(card, { y: -9, rotation: -1.5, duration: 4.7, repeat: -1, yoyo: true, ease: "sine.inOut" });
          notes.forEach((note, index) => gsap.to(note, { y: index ? 10 : -10, rotation: index ? 7 : -8, duration: 3.4 + index, repeat: -1, yoyo: true, ease: "sine.inOut" }));
          if (page && bar) {
            gsap.to(bar, { scaleY: 1, ease: "none", transformOrigin: "top", scrollTrigger: { trigger: page, start: "top top", end: "bottom bottom", scrub: true } });
          }
          if (page && cursor) {
            gsap.to(cursor, { y: () => Math.max(window.innerHeight - 260, 260), ease: "none", scrollTrigger: { trigger: page, start: "top top", end: "bottom bottom", scrub: true } });
          }
        }
      });

      requestAnimationFrame(() => ScrollTrigger.refresh());
      cleanup = () => {
        document.removeEventListener("click", handleAnchorClick);
        gsap.ticker.remove(tickerCallback);
        lenis.destroy();
        ctx.revert();
        ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
      };
    };

    boot();
    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [pathname]);

  return null;
}
