"use client";

import { useEffect, useRef } from "react";

import styles from "./laptop-intro.module.css";

type GravityPointProps = {
  active?: boolean;
  className?: string;
  progress?: number;
};

const TAU = Math.PI * 2;
const clamp = (value: number) => Math.min(1, Math.max(0, value));

export function GravityPoint({ active = true, className = "", progress }: GravityPointProps) {
  const rootRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!active) return;
    const root = rootRef.current;
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d", { alpha: false });
    if (!root || !canvas || !context) {
      window.dispatchEvent(new CustomEvent("css:intro-canvas-failed"));
      return;
    }

    const reducedQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    let width = 1;
    let height = 1;
    let dpr = 1;
    let frame = 0;
    let visible = !document.hidden;
    let inViewport = true;
    const start = performance.now();
    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };

    const resize = () => {
      const bounds = root.getBoundingClientRect();
      width = Math.max(1, Math.round(bounds.width));
      height = Math.max(1, Math.round(bounds.height));
      dpr = Math.min(window.devicePixelRatio || 1, width < 700 ? 1.2 : 1.6);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (time: number) => {
      const sequence = progress === undefined ? clamp((time - start) / 1500) : clamp(progress);
      pointer.x += (pointer.tx - pointer.x) * 0.035;
      pointer.y += (pointer.ty - pointer.y) * 0.035;
      const x = width * 0.5 + pointer.x * 5;
      const y = height * 0.5 + pointer.y * 3;
      const pulse = reducedQuery.matches ? 1 : 0.88 + Math.sin(time * 0.0038) * 0.12;

      context.fillStyle = "#02050a";
      context.fillRect(0, 0, width, height);

      const field = context.createRadialGradient(x, y, 0, x, y, 76 + sequence * 34);
      field.addColorStop(0, `rgba(198,243,250,${0.075 * pulse})`);
      field.addColorStop(0.22, "rgba(63,136,156,.018)");
      field.addColorStop(1, "rgba(2,5,10,0)");
      context.fillStyle = field;
      context.fillRect(x - 120, y - 120, 240, 240);

      context.save();
      context.translate(x, y);
      context.globalCompositeOperation = "lighter";
      context.strokeStyle = `rgba(149,218,231,${0.07 + sequence * 0.055})`;
      context.lineWidth = 0.55;
      context.beginPath();
      context.ellipse(0, 0, 20 + sequence * 9, 6 + sequence * 3, pointer.x * 0.08, 0, TAU);
      context.stroke();
      context.setLineDash([1.5, 5]);
      context.strokeStyle = `rgba(139,120,230,${0.055 + sequence * 0.045})`;
      context.beginPath();
      context.ellipse(0, 0, 42 + sequence * 13, 23 + sequence * 5, -0.16, 0, TAU);
      context.stroke();
      context.setLineDash([]);

      for (let index = 0; index < 8; index += 1) {
        const angle = index * TAU / 8 + (index % 2 ? 0.09 : 0);
        const length = 18 + sequence * 31;
        const ray = context.createLinearGradient(0, 0, Math.cos(angle) * length, Math.sin(angle) * length);
        ray.addColorStop(0, "rgba(235,253,255,.42)");
        ray.addColorStop(1, "rgba(112,205,222,0)");
        context.strokeStyle = ray;
        context.lineWidth = index % 2 ? 0.4 : 0.75;
        context.beginPath();
        context.moveTo(Math.cos(angle) * 2, Math.sin(angle) * 2);
        context.lineTo(Math.cos(angle) * length, Math.sin(angle) * length);
        context.stroke();
      }
      context.restore();

      const halo = context.createRadialGradient(x, y, 0, x, y, 23 + sequence * 7);
      halo.addColorStop(0, "rgba(255,255,244,1)");
      halo.addColorStop(0.09, "rgba(215,249,255,.92)");
      halo.addColorStop(0.28, "rgba(106,211,229,.31)");
      halo.addColorStop(1, "rgba(4,12,18,0)");
      context.fillStyle = halo;
      context.fillRect(x - 34, y - 34, 68, 68);
      context.fillStyle = "#fffdf1";
      context.beginPath();
      context.arc(x, y, 1.35 + sequence * 0.35, 0, TAU);
      context.fill();
    };

    const animate = (time: number) => {
      draw(time);
      if (progress === undefined && visible && inViewport && !reducedQuery.matches) frame = requestAnimationFrame(animate);
    };
    const sync = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      if (progress !== undefined || reducedQuery.matches) draw(performance.now());
      else if (visible && inViewport) frame = requestAnimationFrame(animate);
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!finePointer.matches) return;
      const bounds = root.getBoundingClientRect();
      pointer.tx = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
      pointer.ty = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
    };
    const onVisibility = () => { visible = !document.hidden; sync(); };
    const resizeObserver = new ResizeObserver(() => { resize(); sync(); });
    const intersectionObserver = new IntersectionObserver(([entry]) => { inViewport = entry?.isIntersecting ?? true; sync(); });

    resizeObserver.observe(root);
    intersectionObserver.observe(root);
    root.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    reducedQuery.addEventListener("change", sync);
    resize();
    sync();

    return () => {
      if (frame) cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      root.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("visibilitychange", onVisibility);
      reducedQuery.removeEventListener("change", sync);
    };
  }, [active, progress]);

  return (
    <section ref={rootRef} className={`${styles.pointScene} ${className}`.trim()} aria-label="Digital seed point">
      <canvas ref={canvasRef} aria-hidden="true" />
    </section>
  );
}
