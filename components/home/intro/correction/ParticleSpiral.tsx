"use client";

import { useEffect, useRef } from "react";

import styles from "./correction.module.css";

type ParticleSpiralProps = {
  className?: string;
  progress?: number;
};

type Particle = {
  alpha: number;
  arm: number;
  birth: number;
  depth: number;
  gridX: number;
  gridY: number;
  noise: number;
  radius: number;
  signal: -1 | 0 | 1 | 2;
  size: number;
  velocity: number;
};

const TAU = Math.PI * 2;
const ARM_COUNT = 5;
const BASE_COLORS = ["#e9fbff", "#b9edf5", "#79cddd", "#f6f1e8"];
const SIGNAL_COLORS = ["#ef4b2f", "#f2c84b", "#8e75ed"];
const clamp = (value: number) => Math.min(1, Math.max(0, value));
const smoothstep = (from: number, to: number, value: number) => {
  const normalized = clamp((value - from) / (to - from));
  return normalized * normalized * (3 - 2 * normalized);
};

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

function signalFor(index: number): Particle["signal"] {
  if (index % 293 === 0) return 2;
  if (index % 211 === 0) return 1;
  if (index % 157 === 0) return 0;
  return -1;
}

export function ParticleSpiral({ className = "", progress }: ParticleSpiralProps) {
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
    const start = performance.now();
    let visible = !document.hidden;
    let inViewport = true;
    let particles: Particle[] = [];
    const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };

    const rebuild = () => {
      const compact = width < 700;
      const tablet = width < 1050;
      const area = Math.sqrt((width * height) / (1440 * 900));
      const base = compact ? 650 : tablet ? 1150 : 2100;
      const count = Math.round(Math.min(compact ? 850 : 3000, Math.max(compact ? 420 : 900, base * area)));
      const random = seededRandom(90427 + count * 17 + Math.round(width));
      const columns = Math.ceil(Math.sqrt(count * (width / height) * 1.05));
      const rows = Math.ceil(count / columns);
      particles = Array.from({ length: count }, (_, index) => {
        const column = index % columns;
        const row = Math.floor(index / columns);
        return {
          alpha: 0.25 + random() * 0.7,
          arm: index % ARM_COUNT,
          birth: 0.035 + Math.pow(random(), 1.55) * 0.43,
          depth: random(),
          gridX: (column + 0.3 + random() * 0.4) / columns,
          gridY: (row + 0.25 + random() * 0.5) / rows,
          noise: (random() - 0.5) * 0.22,
          radius: Math.pow(random(), 0.68),
          signal: signalFor(index),
          size: 0.32 + random() * 1.45,
          velocity: 0.72 + random() * 1.7,
        };
      });
    };

    const resize = () => {
      const bounds = scene.getBoundingClientRect();
      width = Math.max(1, Math.round(bounds.width));
      height = Math.max(1, Math.round(bounds.height));
      dpr = Math.min(window.devicePixelRatio || 1, width < 700 ? 1.2 : 1.55);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      rebuild();
    };

    const drawGuides = (centerX: number, centerY: number, sequence: number, time: number) => {
      const spiralVisibility = smoothstep(0.22, 0.48, sequence) * (1 - smoothstep(0.74, 0.92, sequence));
      if (spiralVisibility > 0.002) {
        context.save();
        context.globalCompositeOperation = "lighter";
        context.strokeStyle = `rgba(119,204,220,${spiralVisibility * 0.055})`;
        context.lineWidth = 0.6;
        for (let arm = 0; arm < ARM_COUNT; arm += 1) {
          context.beginPath();
          for (let step = 0; step < 82; step += 1) {
            const radius = step / 81;
            const angle = arm * (TAU / ARM_COUNT) + radius * TAU * 1.22 + time * 0.00008;
            const scale = Math.min(width, height) * 0.45;
            const x = centerX + Math.cos(angle) * scale * radius;
            const y = centerY + Math.sin(angle) * scale * radius * 0.66;
            if (!step) context.moveTo(x, y); else context.lineTo(x, y);
          }
          context.stroke();
        }
        context.restore();
      }

      const gridVisibility = smoothstep(0.78, 0.98, sequence);
      if (gridVisibility > 0.002) {
        const gridWidth = width * (width < 700 ? 0.92 : 0.86);
        const gridHeight = height * 0.58;
        const left = centerX - gridWidth * 0.5;
        const top = centerY - gridHeight * 0.5;
        context.save();
        context.strokeStyle = `rgba(116,202,220,${gridVisibility * 0.085})`;
        context.lineWidth = 0.65;
        for (let column = 0; column <= 18; column += 1) {
          const x = left + gridWidth * (column / 18);
          context.beginPath(); context.moveTo(x - 25, top); context.lineTo(x + 25, top + gridHeight); context.stroke();
        }
        for (let row = 0; row <= 10; row += 1) {
          const y = top + gridHeight * (row / 10);
          context.beginPath(); context.moveTo(left, y); context.lineTo(left + gridWidth, y); context.stroke();
        }
        context.restore();
      }
    };

    const draw = (time: number) => {
      const sequence = progress === undefined
        ? clamp(((time - start) % 6200) / 5000)
        : clamp(progress);
      pointer.x += (pointer.targetX - pointer.x) * 0.04;
      pointer.y += (pointer.targetY - pointer.y) * 0.04;
      const centerX = width * 0.5 + pointer.x * 9;
      const centerY = height * 0.5 + pointer.y * 6;
      const flatten = smoothstep(0.73, 0.98, sequence);
      const spiralScale = Math.min(width, height) * (width < 700 ? 0.43 : 0.47);
      const planeWidth = width * (width < 700 ? 0.94 : 0.86);
      const planeHeight = height * 0.58;

      context.fillStyle = "#02050a";
      context.fillRect(0, 0, width, height);
      drawGuides(centerX, centerY, sequence, time);

      context.save();
      context.globalCompositeOperation = "lighter";
      for (const particle of particles) {
        const age = clamp((sequence - particle.birth) / 0.42);
        if (age <= 0) continue;
        const curved = smoothstep(0.08, 0.72, age);
        const expansion = smoothstep(0, 0.86, age);
        const angle = particle.arm * (TAU / ARM_COUNT)
          + particle.radius * TAU * 1.28
          + curved * (1.35 + particle.velocity * 0.38)
          + time * 0.00008 * (1.7 - particle.radius)
          + particle.noise;
        const radialDistance = spiralScale * (0.025 + particle.radius * 0.975) * expansion;
        const depthWave = Math.sin(angle * 1.3 + particle.noise * 10 + time * 0.00018 * particle.velocity);
        const burstAngle = particle.arm * (TAU / ARM_COUNT) + particle.noise * 2.2;
        const burstRadius = spiralScale * 0.24 * age * (0.35 + particle.radius);
        const burstX = centerX + Math.cos(burstAngle) * burstRadius;
        const burstY = centerY + Math.sin(burstAngle) * burstRadius * 0.72;
        const spiralX = centerX + Math.cos(angle) * radialDistance;
        const spiralY = centerY + Math.sin(angle) * radialDistance * (0.6 + particle.depth * 0.16) + depthWave * 5 * particle.depth;
        let x = burstX + (spiralX - burstX) * curved;
        let y = burstY + (spiralY - burstY) * curved;
        const skew = (particle.gridY - 0.5) * width * 0.055;
        const planeX = centerX + (particle.gridX - 0.5) * planeWidth + skew;
        const planeY = centerY + (particle.gridY - 0.5) * planeHeight;
        x += (planeX - x) * flatten;
        y += (planeY - y) * flatten;

        const depth = 0.28 + particle.depth * 0.72;
        const alpha = particle.alpha * depth * smoothstep(0, 0.16, age) * (1 - flatten * 0.16);
        const color = particle.signal < 0 ? BASE_COLORS[particle.arm % BASE_COLORS.length] : SIGNAL_COLORS[particle.signal];
        const size = particle.size * (0.55 + depth * 0.85) * (1 - flatten * 0.24);
        context.globalAlpha = alpha;
        context.fillStyle = color;
        if (particle.signal >= 0) {
          context.shadowColor = color;
          context.shadowBlur = 8;
        } else if (size > 1.2) {
          context.shadowColor = "rgba(144,222,236,.52)";
          context.shadowBlur = 3;
        } else {
          context.shadowBlur = 0;
        }
        context.beginPath();
        context.arc(x, y, size, 0, TAU);
        context.fill();
      }
      context.restore();

      const coreVisibility = 1 - smoothstep(0.82, 1, sequence);
      if (coreVisibility > 0.002) {
        const halo = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, 31);
        halo.addColorStop(0, `rgba(255,255,246,${coreVisibility})`);
        halo.addColorStop(0.14, `rgba(176,235,246,${coreVisibility * 0.66})`);
        halo.addColorStop(1, "rgba(4,11,18,0)");
        context.fillStyle = halo;
        context.fillRect(centerX - 34, centerY - 34, 68, 68);
        context.fillStyle = `rgba(255,255,247,${coreVisibility})`;
        context.beginPath(); context.arc(centerX, centerY, 1.8, 0, TAU); context.fill();
      }
    };

    const animate = (time: number) => {
      draw(time);
      if (progress === undefined && visible && inViewport && !reducedQuery.matches) frame = window.requestAnimationFrame(animate);
    };
    const sync = () => {
      if (frame) window.cancelAnimationFrame(frame);
      frame = 0;
      if (progress !== undefined || reducedQuery.matches) draw(performance.now());
      else if (visible && inViewport) frame = window.requestAnimationFrame(animate);
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!finePointer.matches) return;
      const bounds = scene.getBoundingClientRect();
      pointer.targetX = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
      pointer.targetY = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
    };
    const onVisibility = () => { visible = !document.hidden; sync(); };
    const resizeObserver = new ResizeObserver(() => { resize(); sync(); });
    const intersectionObserver = new IntersectionObserver(([entry]) => { inViewport = entry?.isIntersecting ?? true; sync(); });

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
    <section ref={sceneRef} className={`${styles.scene} ${className}`.trim()} aria-label="Corrected particle emission and spiral preview">
      <canvas ref={canvasRef} aria-hidden="true" />
      <div className={styles.frameMarks} aria-hidden="true"><i /><i /></div>
      <div className={styles.spiralStatus} aria-hidden="true"><span>FIELD / 02</span><strong>CORE EMISSION</strong></div>
    </section>
  );
}
