"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function ScrollMotionManager() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let items: HTMLElement[] = [];

    const collect = () => {
      items = Array.from(document.querySelectorAll<HTMLElement>("[data-parallax]"));
    };

    const update = () => {
      frame = 0;
      const max = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      const progress = Math.min(1, Math.max(0, window.scrollY / max));
      root.style.setProperty("--v4-page-progress", progress.toFixed(4));
      root.style.setProperty("--v4-progress-percent", `${(progress * 100).toFixed(2)}%`);
      root.style.setProperty("--v4-route-rotate", `${(progress * 230).toFixed(2)}deg`);
      root.style.setProperty("--v4-route-y", `${(progress * 110 - 32).toFixed(2)}px`);
      root.style.setProperty("--v4-route-x", `${(Math.sin(progress * Math.PI * 2) * 22).toFixed(2)}px`);
      root.style.setProperty("--v4-scroll-y", `${window.scrollY}px`);

      if (reduced.matches) {
        items.forEach((item) => item.style.setProperty("--parallax-y", "0px"));
        return;
      }

      const viewportMid = window.innerHeight / 2;
      for (const item of items) {
        const rect = item.getBoundingClientRect();
        if (rect.bottom < -240 || rect.top > window.innerHeight + 240) continue;
        const speed = Number.parseFloat(item.dataset.parallax || "0.08");
        const center = rect.top + rect.height / 2;
        const shift = (viewportMid - center) * speed;
        item.style.setProperty("--parallax-y", `${shift.toFixed(2)}px`);
      }
    };

    const request = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    collect();
    update();
    const onResize = () => {
      collect();
      request();
    };

    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", onResize);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", request);
      window.removeEventListener("resize", onResize);
    };
  }, [pathname]);

  return null;
}
