"use client";

import { useEffect, useRef } from "react";

import styles from "./intro.module.css";

type ParticleSpiralProps = {
  active?: boolean;
  className?: string;
  density?: number;
  durationMs?: number;
  progress?: number;
  showHud?: boolean;
};

type SpiralParticle = {
  alpha: number;
  arm: number;
  depth: number;
  jitter: number;
  phase: number;
  radius: number;
  signal: -1 | 0 | 1 | 2;
  size: number;
  speed: number;
  startAngle: number;
  startRadius: number;
};

const TAU = Math.PI * 2;
const ARMS = 4;
const BASE_COLORS = ["#dffaff", "#a7e9f1", "#f6f1e6", "#78cbd8"];
const SIGNAL_COLORS = ["#e84a27", "#f2c14e", "#8b78e6"];

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const smoothstep = (from: number, to: number, value: number) => {
  const normalized = clamp((value - from) / (to - from), 0, 1);
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

function signalFor(index: number): SpiralParticle["signal"] {
  if (index % 113 === 0) return 2;
  if (index % 79 === 0) return 1;
  if (index % 47 === 0) return 0;
  return -1;
}

export function ParticleSpiral({
  active = true,
  className = "",
  density = 1,
  durationMs = 6200,
  progress,
  showHud = true,
}: ParticleSpiralProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<HTMLElement>(null);
  const phaseRef = useRef<HTMLSpanElement>(null);
  const statusRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current;
    const scene = sceneRef.current;
    const context = canvas?.getContext("2d", { alpha: false });
    if (!canvas || !scene || !context) {
      window.dispatchEvent(new CustomEvent("css:intro-canvas-failed"));
      return;
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    let reduced = reducedMotion.matches;
    let documentVisible = !document.hidden;
    let inViewport = true;
    let frame = 0;
    let startTime = 0;
    let lastTime = performance.now();
    let lastPhase = "";
    let width = 1;
    let height = 1;
    let dpr = 1;
    let particles: SpiralParticle[] = [];
    let gridColumns = 1;
    let gridRows = 1;

    const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };

    const rebuildParticles = () => {
      const mobile = width < 700;
      const areaScale = Math.sqrt((width * height) / (1440 * 900));
      const baseCount = mobile ? 350 : 930;
      const count = clamp(Math.round(baseCount * areaScale * density), mobile ? 240 : 520, mobile ? 480 : 1250);
      const random = seededRandom(198704 + count * 13 + Math.round(width) * 3 + Math.round(height));
      const aspect = Math.max(0.7, width / height);
      gridColumns = Math.max(12, Math.ceil(Math.sqrt(count * aspect * 1.18)));
      gridRows = Math.ceil(count / gridColumns);

      particles = Array.from({ length: count }, (_, index) => {
        const radius = Math.pow(random(), 0.72);
        return {
          alpha: 0.25 + random() * 0.68,
          arm: index % ARMS,
          depth: random(),
          jitter: (random() - 0.5) * 0.16,
          phase: random() * TAU,
          radius,
          signal: signalFor(index),
          size: 0.35 + random() * 1.3,
          speed: 0.74 + random() * 1.65,
          startAngle: random() * TAU,
          startRadius: (0.18 + Math.pow(random(), 0.54) * 0.9) * Math.hypot(width, height) * 0.54,
        };
      });
    };

    const sizeCanvas = () => {
      const bounds = scene.getBoundingClientRect();
      width = Math.max(1, Math.round(bounds.width));
      height = Math.max(1, Math.round(bounds.height));
      dpr = Math.min(window.devicePixelRatio || 1, width < 700 ? 1.35 : 1.75);
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      rebuildParticles();
    };

    const updateReadout = (sequenceProgress: number) => {
      let phase = "COLLAPSE / 01";
      let status = "CONCENTRATING FIELD";
      if (sequenceProgress >= 0.2) {
        phase = "ROTATION / 02";
        status = "RESOLVING ARMS";
      }
      if (sequenceProgress >= 0.5) {
        phase = "EXPANSION / 03";
        status = "DISTRIBUTING SIGNALS";
      }
      if (sequenceProgress >= 0.76) {
        phase = "PLANE / 04";
        status = "ORDERING NODES";
      }
      if (sequenceProgress >= 0.985) {
        phase = "PLANE / READY";
        status = "CAMPUS PLANE READY";
      }
      if (phase === lastPhase) return;
      lastPhase = phase;
      if (phaseRef.current) phaseRef.current.textContent = phase;
      if (statusRef.current) statusRef.current.textContent = status;
    };

    const drawSpiralGuides = (centerX: number, centerY: number, time: number, visibility: number) => {
      if (visibility <= 0.001) return;
      const scale = Math.min(width, height) * (width < 700 ? 0.4 : 0.43);
      context.save();
      context.globalCompositeOperation = "lighter";
      context.strokeStyle = `rgba(118,205,219,${0.05 * visibility})`;
      context.lineWidth = 0.7;
      for (let arm = 0; arm < ARMS; arm += 1) {
        context.beginPath();
        for (let step = 0; step <= 64; step += 1) {
          const radius = step / 64;
          const angle = arm * (TAU / ARMS) + radius * TAU * 1.28 + time * 0.000055;
          const x = centerX + Math.cos(angle) * scale * radius;
          const y = centerY + Math.sin(angle) * scale * radius * 0.72;
          if (step === 0) context.moveTo(x, y);
          else context.lineTo(x, y);
        }
        context.stroke();
      }
      context.restore();
    };

    const drawPlaneGuides = (centerX: number, centerY: number, time: number, visibility: number) => {
      if (visibility <= 0.001) return;
      const planeWidth = width * (width < 700 ? 0.92 : 0.84);
      const planeHeight = height * (width < 700 ? 0.56 : 0.52);
      const left = centerX - planeWidth * 0.5;
      const top = centerY - planeHeight * 0.5;
      const skew = width * 0.055;

      context.save();
      context.globalAlpha = visibility;
      context.strokeStyle = "rgba(116,207,222,.07)";
      context.lineWidth = 0.7;
      for (let column = 0; column <= gridColumns; column += 4) {
        const x = left + (column / gridColumns) * planeWidth;
        context.beginPath();
        context.moveTo(x - skew * 0.5, top);
        context.lineTo(x + skew * 0.5, top + planeHeight);
        context.stroke();
      }
      for (let row = 0; row <= gridRows; row += 4) {
        const y = top + (row / gridRows) * planeHeight;
        const offset = ((y - centerY) / planeHeight) * skew;
        context.beginPath();
        context.moveTo(left + offset, y);
        context.lineTo(left + planeWidth + offset, y);
        context.stroke();
      }

      const scanX = left + ((time * 0.000055) % 1) * planeWidth;
      const scanner = context.createLinearGradient(scanX - 42, 0, scanX + 10, 0);
      scanner.addColorStop(0, "rgba(124,217,232,0)");
      scanner.addColorStop(0.82, `rgba(124,217,232,${0.1 * visibility})`);
      scanner.addColorStop(1, `rgba(242,193,78,${0.22 * visibility})`);
      context.fillStyle = scanner;
      context.fillRect(scanX - 42, top, 52, planeHeight);
      context.restore();
    };

    const drawFrame = (time: number, sequenceProgress: number) => {
      const collapse = smoothstep(0.02, 0.19, sequenceProgress);
      const spiralReveal = smoothstep(0.14, 0.58, sequenceProgress);
      const expansion = smoothstep(0.22, 0.68, sequenceProgress);
      const flatten = smoothstep(0.72, 0.98, sequenceProgress);
      const centerX = width * 0.5 + pointer.x * 13;
      const centerY = height * 0.5 + pointer.y * 8;
      const spiralScale = Math.min(width, height) * (width < 700 ? 0.4 : 0.43);
      const planeWidth = width * (width < 700 ? 0.92 : 0.84);
      const planeHeight = height * (width < 700 ? 0.56 : 0.52);

      context.globalCompositeOperation = "source-over";
      context.globalAlpha = 1;
      context.fillStyle = "#020609";
      context.fillRect(0, 0, width, height);

      const coreStrength = 1 - smoothstep(0.34, 0.7, sequenceProgress);
      const backgroundGlow = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, 190);
      backgroundGlow.addColorStop(0, `rgba(150,230,242,${0.075 + coreStrength * 0.075})`);
      backgroundGlow.addColorStop(0.36, "rgba(62,131,146,.025)");
      backgroundGlow.addColorStop(1, "rgba(2,6,9,0)");
      context.fillStyle = backgroundGlow;
      context.fillRect(centerX - 195, centerY - 195, 390, 390);

      const guideVisibility = spiralReveal * (1 - flatten);
      drawSpiralGuides(centerX, centerY, time, guideVisibility);
      drawPlaneGuides(centerX, centerY, time, flatten);

      if (sequenceProgress > 0.04 && sequenceProgress < 0.34) {
        const shock = smoothstep(0.04, 0.16, sequenceProgress) * (1 - smoothstep(0.21, 0.34, sequenceProgress));
        context.strokeStyle = `rgba(188,238,245,${shock * 0.16})`;
        context.lineWidth = 0.8;
        for (let ring = 0; ring < 3; ring += 1) {
          const radius = 18 + ring * 21 + shock * 38;
          context.beginPath();
          context.ellipse(centerX, centerY, radius * 1.24, radius * 0.56, 0, ring * 0.5, Math.PI * (1.55 + ring * 0.08));
          context.stroke();
        }
      }

      context.globalCompositeOperation = "lighter";
      particles.forEach((particle, index) => {
        const startX = centerX + Math.cos(particle.startAngle) * particle.startRadius;
        const startY = centerY + Math.sin(particle.startAngle) * particle.startRadius;
        const collapsedRadius = 0.35 + particle.depth * 2.2;
        const collapsedAngle = particle.startAngle + collapse * (0.7 + particle.speed * 0.28);
        const collapsedX = centerX + Math.cos(collapsedAngle) * collapsedRadius;
        const collapsedY = centerY + Math.sin(collapsedAngle) * collapsedRadius * 0.62;
        const collapsedMix = collapse;
        const fieldX = startX + (collapsedX - startX) * collapsedMix;
        const fieldY = startY + (collapsedY - startY) * collapsedMix;

        const rotation = time * 0.000055 * particle.speed;
        const spiralAngle = particle.arm * (TAU / ARMS) + particle.radius * TAU * 1.34 + rotation + particle.jitter;
        const depthWave = 0.5 + 0.5 * Math.sin(spiralAngle * 0.82 + particle.phase + time * 0.00019 * particle.speed);
        const expandedRadius = spiralScale * (0.03 + Math.pow(particle.radius, 0.82) * 0.97) * expansion;
        const spiralX = centerX + Math.cos(spiralAngle) * expandedRadius;
        const spiralY = centerY
          + Math.sin(spiralAngle) * expandedRadius * (0.62 + depthWave * 0.16)
          + (depthWave - 0.5) * 12 * (1 - particle.radius);
        let x = fieldX + (spiralX - fieldX) * spiralReveal;
        let y = fieldY + (spiralY - fieldY) * spiralReveal;

        const column = index % gridColumns;
        const row = Math.floor(index / gridColumns);
        const gridX = gridColumns <= 1 ? 0.5 : column / (gridColumns - 1);
        const gridY = gridRows <= 1 ? 0.5 : row / (gridRows - 1);
        const skew = (gridY - 0.5) * width * 0.055;
        const planeX = centerX + (gridX - 0.5) * planeWidth + skew;
        const planeY = centerY + (gridY - 0.5) * planeHeight;
        x += (planeX - x) * flatten;
        y += (planeY - y) * flatten;

        if (finePointer.matches && !flatten) {
          const pointerX = width * (0.5 + pointer.x * 0.44);
          const pointerY = height * (0.5 + pointer.y * 0.44);
          const deltaX = x - pointerX;
          const deltaY = y - pointerY;
          const distance = Math.hypot(deltaX, deltaY);
          if (distance < 150 && distance > 0.01) {
            const influence = (1 - distance / 150) * 8;
            x += (deltaX / distance) * influence;
            y += (deltaY / distance) * influence;
          }
        }

        const depth = particle.depth * 0.44 + depthWave * 0.56;
        const signalPulse = particle.signal >= 0
          ? 0.45 + 0.55 * Math.sin(time * 0.0042 * particle.speed + particle.phase)
          : 0;
        const compression = collapse * (1 - spiralReveal);
        const opacity = clamp(
          (particle.alpha * (0.26 + depth * 0.82) * (0.35 + spiralReveal * 0.65) + signalPulse * 0.16)
            * (1 - compression * 0.66),
          0.08,
          0.96,
        );
        const size = particle.size * (0.52 + depth * 1.16) * (1 - flatten * 0.36);
        const color = particle.signal >= 0 ? SIGNAL_COLORS[particle.signal] : BASE_COLORS[index % BASE_COLORS.length];

        if (particle.signal >= 0) {
          context.globalAlpha = opacity * (0.09 + signalPulse * 0.14);
          context.fillStyle = color;
          context.beginPath();
          context.arc(x, y, size * 3.15, 0, TAU);
          context.fill();
        }

        context.globalAlpha = opacity;
        context.fillStyle = color;
        context.beginPath();
        context.arc(x, y, Math.max(0.34, size), 0, TAU);
        context.fill();
      });

      const coreAlpha = clamp(1 - expansion * 0.94, 0.04, 1);
      context.globalAlpha = coreAlpha;
      const core = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, 34);
      core.addColorStop(0, "rgba(255,255,244,1)");
      core.addColorStop(0.11, "rgba(209,248,255,.85)");
      core.addColorStop(0.36, "rgba(102,211,230,.23)");
      core.addColorStop(1, "rgba(102,211,230,0)");
      context.fillStyle = core;
      context.fillRect(centerX - 36, centerY - 36, 72, 72);
      context.globalAlpha = 1;
    };

    const renderStatic = () => {
      pointer.x = 0;
      pointer.y = 0;
      updateReadout(1);
      drawFrame(0, 1);
    };

    const tick = (time: number) => {
      frame = 0;
      if (!documentVisible || !inViewport || reduced) return;
      if (!startTime) startTime = time;
      const delta = Math.min((time - lastTime) / 1000, 0.035);
      lastTime = time;
      pointer.x += (pointer.targetX - pointer.x) * Math.min(1, delta * 3.6);
      pointer.y += (pointer.targetY - pointer.y) * Math.min(1, delta * 3.6);
      const sequenceProgress = progress === undefined
        ? clamp((time - startTime) / durationMs, 0, 1)
        : clamp(progress, 0, 1);
      updateReadout(sequenceProgress);
      drawFrame(time, sequenceProgress);
      frame = window.requestAnimationFrame(tick);
    };

    const syncAnimation = () => {
      if (reduced) {
        if (frame) window.cancelAnimationFrame(frame);
        frame = 0;
        renderStatic();
        return;
      }
      if (documentVisible && inViewport && !frame) {
        lastTime = performance.now();
        frame = window.requestAnimationFrame(tick);
      } else if ((!documentVisible || !inViewport) && frame) {
        window.cancelAnimationFrame(frame);
        frame = 0;
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!finePointer.matches) return;
      const bounds = scene.getBoundingClientRect();
      pointer.targetX = clamp(((event.clientX - bounds.left) / bounds.width - 0.5) * 2, -1, 1);
      pointer.targetY = clamp(((event.clientY - bounds.top) / bounds.height - 0.5) * 2, -1, 1);
    };

    const onPointerLeave = () => {
      pointer.targetX = 0;
      pointer.targetY = 0;
    };

    const onVisibilityChange = () => {
      documentVisible = !document.hidden;
      syncAnimation();
    };

    const onReducedMotionChange = () => {
      reduced = reducedMotion.matches;
      syncAnimation();
    };

    const resizeObserver = new ResizeObserver(() => {
      sizeCanvas();
      if (reduced) renderStatic();
    });
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      inViewport = entry?.isIntersecting ?? true;
      syncAnimation();
    });

    resizeObserver.observe(scene);
    intersectionObserver.observe(scene);
    scene.addEventListener("pointermove", onPointerMove, { passive: true });
    scene.addEventListener("pointerleave", onPointerLeave, { passive: true });
    document.addEventListener("visibilitychange", onVisibilityChange);
    reducedMotion.addEventListener("change", onReducedMotionChange);
    sizeCanvas();
    syncAnimation();

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      scene.removeEventListener("pointermove", onPointerMove);
      scene.removeEventListener("pointerleave", onPointerLeave);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      reducedMotion.removeEventListener("change", onReducedMotionChange);
    };
  }, [active, density, durationMs, progress]);

  return (
    <section
      ref={sceneRef}
      className={`${styles.scene} ${styles.spiralScene} ${className}`.trim()}
      data-intro-scene="spiral"
      aria-label="CSS particle spiral system"
    >
      <h1 className={styles.srOnly}>CSS particle spiral intro preview</h1>
      <div className={styles.spiralFallback} aria-hidden="true" />
      <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />

      <div className={styles.frame} aria-hidden="true">
        <span className={`${styles.register} ${styles.registerTopLeft}`} />
        <span className={`${styles.register} ${styles.registerBottomRight}`} />
      </div>

      {showHud && (
        <>
          <div className={`${styles.readout} ${styles.readoutTopLeft}`} aria-hidden="true">
            <span>SYS / CSS</span>
            <strong>PARTICLE SPIRAL</strong>
            <small ref={phaseRef}>COLLAPSE / 01</small>
          </div>
          <div className={`${styles.readout} ${styles.readoutTopRight}`} aria-hidden="true">
            <span>FIELD 002</span>
            <small>DATA VORTEX / NITDGP</small>
          </div>
          <div className={`${styles.readout} ${styles.readoutBottomLeft}`} aria-hidden="true">
            <i />
            <span ref={statusRef}>CONCENTRATING FIELD</span>
          </div>
          <div className={styles.signalLegend} aria-hidden="true">
            <span><i className={styles.signalOrange} />SIGNAL</span>
            <span><i className={styles.signalYellow} />NODE</span>
            <span><i className={styles.signalViolet} />ISSUE 04</span>
          </div>
        </>
      )}
    </section>
  );
}
