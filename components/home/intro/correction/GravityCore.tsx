"use client";

import { useEffect, useRef } from "react";

import styles from "./correction.module.css";

type GravityCoreProps = {
  className?: string;
  progress?: number;
};

type Dust = {
  angle: number;
  delay: number;
  drift: number;
  radius: number;
  size: number;
};

const TAU = Math.PI * 2;
const clamp = (value: number) => Math.min(1, Math.max(0, value));

function seededRandom(seed: number) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let next = value;
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

export function GravityCore({ className = "", progress }: GravityCoreProps) {
  const sceneRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const scene = sceneRef.current;
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d", { alpha: false });
    if (!scene || !canvas || !context) return;

    const reducedQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    let width = 1;
    let height = 1;
    let dpr = 1;
    let frame = 0;
    let visible = !document.hidden;
    let inViewport = true;
    let start = performance.now();
    let dust: Dust[] = [];
    const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };

    const rebuild = () => {
      const random = seededRandom(401 + Math.round(width) * 7 + Math.round(height));
      const count = width < 700 ? 28 : 48;
      dust = Array.from({ length: count }, () => ({
        angle: random() * TAU,
        delay: 0.18 + random() * 0.5,
        drift: (random() - 0.5) * 0.7,
        radius: 24 + random() * Math.min(width, height) * 0.2,
        size: 0.25 + random() * 0.8,
      }));
    };

    const resize = () => {
      const bounds = scene.getBoundingClientRect();
      width = Math.max(1, Math.round(bounds.width));
      height = Math.max(1, Math.round(bounds.height));
      dpr = Math.min(window.devicePixelRatio || 1, width < 700 ? 1.25 : 1.65);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      rebuild();
    };

    const draw = (time: number) => {
      const sequence = progress === undefined
        ? clamp(((time - start) % 2600) / 1900)
        : clamp(progress);
      const centerX = width * 0.5 + pointer.x * 5;
      const centerY = height * 0.5 + pointer.y * 3;
      const pulse = 0.82 + Math.sin(time * 0.0042) * 0.12;

      context.fillStyle = "#02050a";
      context.fillRect(0, 0, width, height);

      pointer.x += (pointer.targetX - pointer.x) * 0.045;
      pointer.y += (pointer.targetY - pointer.y) * 0.045;

      if (sequence > 0.12) {
        for (const particle of dust) {
          const local = clamp((sequence - particle.delay) / 0.34);
          if (local <= 0) continue;
          const radius = particle.radius * (1 - local * 0.86);
          const angle = particle.angle + local * (0.42 + particle.drift);
          const x = centerX + Math.cos(angle) * radius;
          const y = centerY + Math.sin(angle) * radius * 0.72;
          context.beginPath();
          context.fillStyle = `rgba(176,224,236,${(0.08 + local * 0.42) * (1 - local * 0.35)})`;
          context.arc(x, y, particle.size, 0, TAU);
          context.fill();
        }
      }

      const lens = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.min(width, height) * 0.15);
      lens.addColorStop(0, `rgba(180,238,250,${0.11 * pulse})`);
      lens.addColorStop(0.12, "rgba(83,157,183,.035)");
      lens.addColorStop(1, "rgba(2,5,10,0)");
      context.fillStyle = lens;
      context.fillRect(0, 0, width, height);

      context.save();
      context.translate(centerX, centerY);
      context.globalCompositeOperation = "lighter";
      context.strokeStyle = "rgba(171,225,236,.13)";
      context.lineWidth = 0.55;
      context.beginPath();
      context.ellipse(0, 0, 21 + sequence * 8, 7 + sequence * 3, pointer.x * 0.12, 0, TAU);
      context.stroke();
      context.setLineDash([2, 4]);
      context.strokeStyle = "rgba(130,113,222,.13)";
      context.beginPath();
      context.ellipse(0, 0, 43 + sequence * 12, 25 + sequence * 5, -0.18, 0, TAU);
      context.stroke();
      context.setLineDash([]);

      const rayLength = 19 + sequence * 26;
      for (let ray = 0; ray < 8; ray += 1) {
        const angle = (ray / 8) * TAU + (ray % 2 ? 0.08 : 0);
        const gradient = context.createLinearGradient(0, 0, Math.cos(angle) * rayLength, Math.sin(angle) * rayLength);
        gradient.addColorStop(0, "rgba(230,252,255,.48)");
        gradient.addColorStop(1, "rgba(110,198,220,0)");
        context.strokeStyle = gradient;
        context.lineWidth = ray % 2 ? 0.45 : 0.8;
        context.beginPath();
        context.moveTo(Math.cos(angle) * 2, Math.sin(angle) * 2);
        context.lineTo(Math.cos(angle) * rayLength, Math.sin(angle) * rayLength);
        context.stroke();
      }
      context.restore();

      const halo = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, 19 + sequence * 8);
      halo.addColorStop(0, "rgba(255,255,246,1)");
      halo.addColorStop(0.08, "rgba(218,250,255,.98)");
      halo.addColorStop(0.24, "rgba(105,204,228,.46)");
      halo.addColorStop(1, "rgba(4,12,18,0)");
      context.fillStyle = halo;
      context.beginPath();
      context.arc(centerX, centerY, 19 + sequence * 8, 0, TAU);
      context.fill();
      context.fillStyle = "#fffef5";
      context.beginPath();
      context.arc(centerX, centerY, 1.25 + sequence * 0.55, 0, TAU);
      context.fill();
    };

    const animate = (time: number) => {
      draw(time);
      if (progress === undefined && visible && inViewport && !reducedQuery.matches) {
        frame = window.requestAnimationFrame(animate);
      }
    };

    const sync = () => {
      if (frame) window.cancelAnimationFrame(frame);
      frame = 0;
      if (progress !== undefined || reducedQuery.matches) {
        draw(performance.now());
      } else if (visible && inViewport) {
        frame = window.requestAnimationFrame(animate);
      }
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!finePointer.matches) return;
      const bounds = scene.getBoundingClientRect();
      pointer.targetX = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
      pointer.targetY = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
    };
    const onVisibility = () => {
      visible = !document.hidden;
      if (visible) start = performance.now();
      sync();
    };
    const resizeObserver = new ResizeObserver(() => {
      resize();
      sync();
    });
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      inViewport = entry?.isIntersecting ?? true;
      sync();
    });

    resizeObserver.observe(scene);
    intersectionObserver.observe(scene);
    scene.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    reducedQuery.addEventListener("change", sync);
    resize();
    sync();

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      scene.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("visibilitychange", onVisibility);
      reducedQuery.removeEventListener("change", sync);
    };
  }, [progress]);

  return (
    <section ref={sceneRef} className={`${styles.scene} ${className}`.trim()} aria-label="Corrected gravitational core preview">
      <canvas ref={canvasRef} aria-hidden="true" />
      <div className={styles.frameMarks} aria-hidden="true"><i /><i /></div>
      <div className={styles.coreStatus} aria-hidden="true"><span>FIELD / 01</span><strong>CORE CONTAINED</strong></div>
    </section>
  );
}
