"use client";

import { useEffect, useRef } from "react";

import styles from "./intro.module.css";

type GravityCoreProps = {
  active?: boolean;
  className?: string;
  density?: number;
  showHud?: boolean;
};

type DustParticle = {
  alpha: number;
  angle: number;
  color: string;
  drift: number;
  phase: number;
  radius: number;
  size: number;
  speed: number;
  spin: number;
};

const TAU = Math.PI * 2;
const ICE = ["#dffaff", "#9ee9f2", "#f4efe3", "#80cbd8"];
const SIGNALS = ["#e84a27", "#f2c14e", "#8b78e6"];

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

function particleColor(index: number) {
  if (index % 67 === 0) return SIGNALS[2];
  if (index % 43 === 0) return SIGNALS[1];
  if (index % 29 === 0) return SIGNALS[0];
  return ICE[index % ICE.length];
}

export function GravityCore({ active = true, className = "", density = 1, showHud = true }: GravityCoreProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<HTMLElement>(null);

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
    let lastTime = performance.now();
    let width = 1;
    let height = 1;
    let dpr = 1;
    let maxRadius = 1;
    let particles: DustParticle[] = [];

    const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };

    const resetParticle = (particle: DustParticle, outerOnly = false) => {
      particle.angle = Math.random() * TAU;
      particle.radius = outerOnly
        ? maxRadius * (0.86 + Math.random() * 0.22)
        : Math.pow(Math.random(), 0.58) * maxRadius;
      particle.speed = 3.4 + Math.random() * 8.6;
      particle.spin = (Math.random() > 0.18 ? 1 : -1) * (0.024 + Math.random() * 0.052);
      particle.size = 0.32 + Math.random() * 1.05;
      particle.alpha = 0.2 + Math.random() * 0.62;
      particle.phase = Math.random() * TAU;
      particle.drift = 1.5 + Math.random() * 8;
    };

    const rebuildParticles = () => {
      const mobile = width < 700;
      const areaScale = Math.sqrt((width * height) / (1440 * 900));
      const baseCount = mobile ? 220 : 520;
      const count = clamp(Math.round(baseCount * areaScale * density), mobile ? 130 : 260, mobile ? 300 : 760);
      particles = Array.from({ length: count }, (_, index) => {
        const particle: DustParticle = {
          alpha: 0,
          angle: 0,
          color: particleColor(index),
          drift: 0,
          phase: 0,
          radius: 0,
          size: 0,
          speed: 0,
          spin: 0,
        };
        resetParticle(particle);
        return particle;
      });
    };

    const sizeCanvas = () => {
      const bounds = scene.getBoundingClientRect();
      width = Math.max(1, Math.round(bounds.width));
      height = Math.max(1, Math.round(bounds.height));
      dpr = Math.min(window.devicePixelRatio || 1, width < 700 ? 1.4 : 1.8);
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      maxRadius = Math.hypot(width, height) * 0.58;
      rebuildParticles();
    };

    const drawField = (time: number, delta: number, advance: boolean) => {
      const centerX = width * 0.5 + pointer.x * 16;
      const centerY = height * 0.5 + pointer.y * 10;

      context.globalCompositeOperation = "source-over";
      context.fillStyle = "#020609";
      context.fillRect(0, 0, width, height);

      const fieldGlow = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, 118);
      fieldGlow.addColorStop(0, "rgba(226,250,255,.13)");
      fieldGlow.addColorStop(0.1, "rgba(111,211,228,.055)");
      fieldGlow.addColorStop(0.42, "rgba(31,91,108,.018)");
      fieldGlow.addColorStop(1, "rgba(2,6,9,0)");
      context.fillStyle = fieldGlow;
      context.fillRect(centerX - 120, centerY - 120, 240, 240);

      context.save();
      context.translate(pointer.x * 3, pointer.y * 2);
      context.strokeStyle = "rgba(133,216,230,.055)";
      context.lineWidth = 0.7;
      for (let ring = 0; ring < 6; ring += 1) {
        const radius = 22 + ring * 22;
        context.beginPath();
        context.ellipse(
          centerX,
          centerY,
          radius * (1.1 + ring * 0.018),
          radius * (0.56 + ring * 0.012),
          pointer.x * 0.12,
          -Math.PI * 0.82 + ring * 0.08,
          Math.PI * 0.7 + ring * 0.08,
        );
        context.stroke();
      }
      context.restore();

      context.globalCompositeOperation = "lighter";
      for (const particle of particles) {
        if (advance) {
          const normalizedRadius = clamp(particle.radius / maxRadius, 0, 1);
          const pull = 0.24 + Math.pow(1 - normalizedRadius, 2.7) * 4.8;
          particle.radius -= particle.speed * delta * pull;
          particle.angle += particle.spin * delta * (0.6 + Math.pow(1 - normalizedRadius, 2) * 5.4);
          if (particle.radius < 4) resetParticle(particle, true);
        }

        const normalizedRadius = clamp(particle.radius / maxRadius, 0, 1);
        const nearness = 1 - normalizedRadius;
        const wave = Math.sin(time * 0.00034 + particle.phase) * particle.drift;
        const lens = 1 + nearness * nearness * 0.075;
        const x = centerX + Math.cos(particle.angle) * particle.radius * lens + Math.cos(particle.angle * 2.4) * wave;
        const y = centerY + Math.sin(particle.angle) * particle.radius * lens + Math.sin(particle.angle * 1.7) * wave * 0.54;
        const opacity = clamp(particle.alpha * (0.38 + nearness * 0.92), 0.08, 0.92);
        const tail = 0.8 + nearness * 4.6;

        context.strokeStyle = particle.color;
        context.globalAlpha = opacity * 0.2;
        context.lineWidth = Math.max(0.35, particle.size * 0.45);
        context.beginPath();
        context.moveTo(x, y);
        context.lineTo(x + Math.cos(particle.angle) * tail, y + Math.sin(particle.angle) * tail);
        context.stroke();

        context.globalAlpha = opacity;
        context.fillStyle = particle.color;
        context.beginPath();
        context.arc(x, y, particle.size * (0.72 + nearness * 0.42), 0, TAU);
        context.fill();
      }

      context.globalAlpha = 1;
      const halo = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, 32);
      halo.addColorStop(0, "rgba(255,255,246,1)");
      halo.addColorStop(0.08, "rgba(215,249,255,.84)");
      halo.addColorStop(0.23, "rgba(104,211,231,.25)");
      halo.addColorStop(1, "rgba(104,211,231,0)");
      context.fillStyle = halo;
      context.fillRect(centerX - 34, centerY - 34, 68, 68);
      context.fillStyle = "#fffdf2";
      context.beginPath();
      context.arc(centerX, centerY, 1.55, 0, TAU);
      context.fill();
    };

    const renderStatic = () => {
      pointer.x = 0;
      pointer.y = 0;
      drawField(0, 0, false);
    };

    const tick = (time: number) => {
      frame = 0;
      if (!documentVisible || !inViewport || reduced) return;
      const delta = Math.min((time - lastTime) / 1000, 0.035);
      lastTime = time;
      pointer.x += (pointer.targetX - pointer.x) * 0.035;
      pointer.y += (pointer.targetY - pointer.y) * 0.035;
      drawField(time, delta, true);
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
  }, [active, density]);

  return (
    <section
      ref={sceneRef}
      className={`${styles.scene} ${styles.gravityScene} ${className}`.trim()}
      data-intro-scene="gravity"
      aria-label="CSS gravitational core system"
    >
      <h1 className={styles.srOnly}>CSS gravitational core intro preview</h1>
      <div className={styles.gravityFallback} aria-hidden="true" />
      <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />

      <div className={styles.frame} aria-hidden="true">
        <span className={`${styles.register} ${styles.registerTopLeft}`} />
        <span className={`${styles.register} ${styles.registerBottomRight}`} />
      </div>

      {showHud && (
        <>
          <div className={`${styles.readout} ${styles.readoutTopLeft}`} aria-hidden="true">
            <span>SYS / CSS</span>
            <strong>GRAVITY FIELD</strong>
            <small>CORE 001</small>
          </div>
          <div className={`${styles.readout} ${styles.readoutTopRight}`} aria-hidden="true">
            <span>NITDGP.CSE</span>
            <small>23.5491 N / 87.2909 E</small>
          </div>
          <div className={`${styles.readout} ${styles.readoutBottomLeft}`} aria-hidden="true">
            <i />
            <span>FIELD ACTIVE</span>
          </div>
        </>
      )}
      <div className={styles.coreAxis} aria-hidden="true">
        <span />
        <i />
      </div>
    </section>
  );
}
