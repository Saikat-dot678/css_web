"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

import type { CampusScreenMapHandle } from "./CampusScreenMap";
import type { LaptopBootHandle } from "./LaptopBoot";
import type { LaptopRevealHandle } from "./LaptopReveal";
import type { ScreenTakeoverHandle } from "./ScreenTakeover";

export type IntroPhase = "PRELOAD" | "POINT" | "ASSEMBLE" | "OPEN" | "BOOT" | "MAP_READY" | "ROUTE" | "TAKEOVER" | "COMPLETE";

const SESSION_KEY = "css-nitdgp:laptop-intro-seen:v2";
const clamp = (value: number) => Math.min(1, Math.max(0, value));
const range = (from: number, to: number, value: number) => clamp((value - from) / (to - from));
const easeOut = (value: number) => 1 - (1 - value) ** 3;
const smoothstep = (from: number, to: number, value: number) => {
  const normalized = range(from, to, value);
  return normalized * normalized * (3 - 2 * normalized);
};

export function useIntroTimeline(
  rootRef: RefObject<HTMLElement | null>,
  laptopRef: RefObject<LaptopRevealHandle | null>,
  bootRef: RefObject<LaptopBootHandle | null>,
  mapRef: RefObject<CampusScreenMapHandle | null>,
  takeoverRef: RefObject<ScreenTakeoverHandle | null>,
) {
  const [phase, setPhase] = useState<IntroPhase>("PRELOAD");
  const [reduced, setReduced] = useState(false);
  const [skipVisible, setSkipVisible] = useState(false);
  const phaseRef = useRef<IntroPhase>("PRELOAD");
  const completedRef = useRef(false);
  const autoFrameRef = useRef(0);
  const skipTimerRef = useRef(0);

  const changePhase = useCallback((next: IntroPhase) => {
    if (phaseRef.current === next) return;
    phaseRef.current = next;
    setPhase(next);
  }, []);

  const cancelAuto = useCallback(() => {
    if (autoFrameRef.current) cancelAnimationFrame(autoFrameRef.current);
    if (skipTimerRef.current) window.clearTimeout(skipTimerRef.current);
    autoFrameRef.current = 0;
    skipTimerRef.current = 0;
  }, []);

  const setDeviceState = useCallback((assembly: number, open: number, boot: number, map: number) => {
    const root = rootRef.current;
    root?.style.setProperty("--assembly", String(assembly));
    root?.style.setProperty("--open", String(open));
    root?.style.setProperty("--boot", String(boot));
    root?.style.setProperty("--map", String(map));
    laptopRef.current?.setAssemblyProgress(assembly);
    laptopRef.current?.setOpenProgress(open);
    bootRef.current?.setProgress(boot);
    mapRef.current?.setRevealProgress(map);
  }, [bootRef, laptopRef, mapRef, rootRef]);

  const showMap = useCallback(() => {
    if (completedRef.current) return;
    cancelAuto();
    setDeviceState(1, 1, 1, 1);
    mapRef.current?.setRouteProgress(0);
    mapRef.current?.setFocusProgress(0);
    laptopRef.current?.setTakeoverProgress(0);
    takeoverRef.current?.setProgress(0);
    document.documentElement.classList.remove("intro-running");
    changePhase("MAP_READY");
    setSkipVisible(false);
    window.requestAnimationFrame(() => takeoverRef.current?.syncSourceRect());
  }, [cancelAuto, changePhase, laptopRef, mapRef, setDeviceState, takeoverRef]);

  const retireScrollStory = useCallback((compensate: boolean) => {
    const root = rootRef.current;
    if (!root || root.dataset.bypassed === "true") return;
    const anchor = root.nextElementSibling instanceof HTMLElement ? root.nextElementSibling : null;
    const beforeTop = compensate && anchor ? anchor.getBoundingClientRect().top : 0;
    root.dataset.bypassed = "true";
    // Force layout so the same post-intro anchor can be used to compensate for
    // the removed cinematic scroll height without a visible document jump.
    root.getBoundingClientRect();
    if (compensate && anchor) {
      const afterTop = anchor.getBoundingClientRect().top;
      const delta = afterTop - beforeTop;
      if (Number.isFinite(delta) && Math.abs(delta) > 0.5) window.scrollBy({ top: delta, behavior: "auto" });
    }
  }, [rootRef]);

  const finishExperience = useCallback((remember = true, compensate = true) => {
    if (completedRef.current) return;
    // The latch is set before any DOM-height or scroll compensation work. Any
    // scroll event caused by the collapse is therefore unable to reverse state.
    completedRef.current = true;
    cancelAuto();
    setDeviceState(1, 1, 1, 1);
    mapRef.current?.setRouteProgress(1);
    mapRef.current?.setFocusProgress(1);
    laptopRef.current?.setTakeoverProgress(1);
    takeoverRef.current?.setProgress(1);
    rootRef.current?.style.setProperty("--intro-scroll", "1");
    rootRef.current?.style.setProperty("--intro-arrival", "1");
    retireScrollStory(compensate);
    document.documentElement.classList.remove("intro-running");
    changePhase("COMPLETE");
    setSkipVisible(false);
    if (remember) {
      try { sessionStorage.setItem(SESSION_KEY, "1"); } catch { /* Storage may be unavailable. */ }
    }
  }, [cancelAuto, changePhase, laptopRef, mapRef, retireScrollStory, rootRef, setDeviceState, takeoverRef]);

  const skipIntro = useCallback(() => showMap(), [showMap]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    completedRef.current = false;
    root.dataset.bypassed = "false";
    const reducedQuery = matchMedia("(prefers-reduced-motion: reduce)");
    const motionReduced = reducedQuery.matches;
    setReduced(motionReduced);
    root.dataset.reduced = String(motionReduced);
    let seen = false;
    try { seen = sessionStorage.getItem(SESSION_KEY) === "1"; } catch { /* Storage may be unavailable. */ }

    const onCanvasFailure = () => showMap();
    window.addEventListener("css:intro-canvas-failed", onCanvasFailure);
    const initialFrame = requestAnimationFrame(() => {
      if (motionReduced || seen) {
        finishExperience(!seen, false);
        return;
      }

      document.documentElement.classList.add("intro-running");
      window.scrollTo(0, 0);
      changePhase("POINT");
      setDeviceState(0, 0, 0, 0);
      skipTimerRef.current = window.setTimeout(() => setSkipVisible(true), 1000);
      const compact = window.innerWidth < 700;
      const timing = compact
        ? { assemblyStart: 500, assemblyEnd: 1550, openStart: 1750, openEnd: 2750, bootStart: 2600, bootEnd: 3500, mapStart: 3350, mapEnd: 4100, duration: 4200 }
        : { assemblyStart: 650, assemblyEnd: 1900, openStart: 2150, openEnd: 3400, bootStart: 3200, bootEnd: 4250, mapStart: 4000, mapEnd: 4950, duration: 5100 };
      const started = performance.now();

      const animate = (now: number) => {
        if (completedRef.current) return;
        const elapsed = now - started;
        const assembly = easeOut(range(timing.assemblyStart, timing.assemblyEnd, elapsed));
        const open = smoothstep(timing.openStart, timing.openEnd, elapsed);
        const boot = smoothstep(timing.bootStart, timing.bootEnd, elapsed);
        const map = smoothstep(timing.mapStart, timing.mapEnd, elapsed);
        setDeviceState(assembly, open, boot, map);
        if (elapsed >= timing.assemblyStart && phaseRef.current === "POINT") changePhase("ASSEMBLE");
        if (elapsed >= timing.openStart && phaseRef.current === "ASSEMBLE") changePhase("OPEN");
        if (elapsed >= timing.bootStart && phaseRef.current === "OPEN") changePhase("BOOT");
        if (elapsed < timing.duration) autoFrameRef.current = requestAnimationFrame(animate);
        else showMap();
      };
      autoFrameRef.current = requestAnimationFrame(animate);
    });

    return () => {
      cancelAnimationFrame(initialFrame);
      window.removeEventListener("css:intro-canvas-failed", onCanvasFailure);
      cancelAuto();
      document.documentElement.classList.remove("intro-running");
    };
  }, [cancelAuto, changePhase, finishExperience, rootRef, setDeviceState, showMap]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || reduced || completedRef.current || (phase !== "MAP_READY" && phase !== "ROUTE" && phase !== "TAKEOVER")) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      if (completedRef.current) return;
      const bounds = root.getBoundingClientRect();
      const distance = Math.max(1, root.offsetHeight - innerHeight);
      const holdVh = Number.parseFloat(getComputedStyle(root).getPropertyValue("--arrival-hold-vh")) || 0;
      const holdDistance = innerHeight * holdVh / 100;
      const storyDistance = Math.max(1, distance - holdDistance);
      const scrolled = Math.max(0, -bounds.top);
      const progress = clamp(scrolled / storyDistance);
      const arrival = holdDistance > 0 ? clamp((scrolled - storyDistance) / holdDistance) : 1;
      const route = smoothstep(.015, .68, progress);
      const focus = smoothstep(.53, .7, progress);
      const takeover = smoothstep(.7, .985, progress);
      root.style.setProperty("--intro-scroll", String(progress));
      root.style.setProperty("--intro-arrival", String(arrival));
      mapRef.current?.setRouteProgress(route);
      mapRef.current?.setFocusProgress(focus);
      laptopRef.current?.setTakeoverProgress(takeover);
      takeoverRef.current?.setProgress(takeover);
      if (progress > .015 && progress < .7) changePhase("ROUTE");
      if (progress >= .7) changePhase("TAKEOVER");
      // Completion occurs only after the existing arrival hold is consumed.
      if (progress >= .999 && arrival >= .999) finishExperience(true, true);
    };
    const queueUpdate = () => { if (!frame && !completedRef.current) frame = requestAnimationFrame(update); };
    window.addEventListener("scroll", queueUpdate, { passive: true });
    window.addEventListener("resize", queueUpdate, { passive: true });
    update();
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", queueUpdate);
      window.removeEventListener("resize", queueUpdate);
    };
  }, [changePhase, finishExperience, laptopRef, mapRef, phase, reduced, rootRef, takeoverRef]);

  return { phase, reduced, skipIntro, skipVisible };
}
