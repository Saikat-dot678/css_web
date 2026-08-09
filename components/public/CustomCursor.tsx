"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

export function CustomCursor() {
  const arrowRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const [badgeText, setBadgeText] = useState("");
  const [cursorMode, setCursorMode] = useState<string>("default");
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const isFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!isFinePointer) return;

    document.body.classList.add("has-custom-cursor");

    const arrow = arrowRef.current;
    const badge = badgeRef.current;
    if (!arrow) return;

    // High performance GSAP quickTo setters for 60fps tracking
    const xArrowTo = gsap.quickTo(arrow, "x", { duration: 0.04, ease: "power3.out" });
    const yArrowTo = gsap.quickTo(arrow, "y", { duration: 0.04, ease: "power3.out" });

    const xBadgeTo = badge ? gsap.quickTo(badge, "x", { duration: 0.16, ease: "power2.out" }) : null;
    const yBadgeTo = badge ? gsap.quickTo(badge, "y", { duration: 0.16, ease: "power2.out" }) : null;

    const onMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      if (!isVisible) setIsVisible(true);

      xArrowTo(clientX);
      yArrowTo(clientY);

      if (xBadgeTo && yBadgeTo) {
        xBadgeTo(clientX + 22);
        yBadgeTo(clientY + 14);
      }
    };

    const onMouseDown = () => setIsPressed(true);
    const onMouseUp = () => setIsPressed(false);
    const onMouseLeave = () => setIsVisible(false);
    const onMouseEnter = () => setIsVisible(true);

    const onOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const interactive = target.closest<HTMLElement>(
        'a, button, input, select, textarea, [role="button"], .v4-button, .v4-text-link, .v4-brand, .poster-card, .event-line, .project-visual, .member-card, .resource-card, .gallery-v4-shot, .about-v4-principles article, .achievement-v4-row'
      );

      const section = target.closest<HTMLElement>(
        '.campus-story, #about, #events, #projects, #resources, #team, #achievements, #gallery, .v4-join, .v4-site-header, .v4-site-footer, .admin-content, .login-card'
      );

      if (interactive) {
        setIsHovered(true);
        const text = interactive.textContent?.trim() || "";
        const isInput = interactive.matches("input, textarea, select");

        if (isInput) {
          setCursorMode("input");
          setBadgeText("TYPE _");
        } else if (interactive.closest(".v4-brand")) {
          setCursorMode("brand");
          setBadgeText("CSS / HOME");
        } else if (interactive.closest(".event-line, .poster-card")) {
          setCursorMode("event-card");
          setBadgeText("EVENT ↗");
        } else if (interactive.closest(".project-visual, .project-showcase-row")) {
          setCursorMode("project-card");
          setBadgeText("BUILD ↗");
        } else if (interactive.closest(".member-card, .people-group-row")) {
          setCursorMode("team-card");
          setBadgeText("PROFILE ↗");
        } else if (interactive.closest(".gallery-v4-shot")) {
          setCursorMode("gallery-card");
          setBadgeText("PHOTO ↗");
        } else if (interactive.closest(".about-v4-principles article")) {
          setCursorMode("principle");
          setBadgeText("CONCEPT");
        } else if (interactive.closest(".resource-card, .resource-rail-row")) {
          setCursorMode("resource-card");
          setBadgeText("DESK ↗");
        } else if (text.includes("↗")) {
          setCursorMode("link");
          setBadgeText("OPEN ↗");
        } else if (text.includes("↓")) {
          setCursorMode("scroll");
          setBadgeText("EXPLORE ↓");
        } else {
          setCursorMode("action");
          setBadgeText("SELECT");
        }
        return;
      }

      if (section) {
        setIsHovered(false);
        if (section.matches(".campus-story, .campus-map-board")) {
          setCursorMode("map");
          setBadgeText("CAMPUS / MAP");
        } else if (section.id === "about") {
          setCursorMode("about");
          setBadgeText("SOCIETY / 01");
        } else if (section.id === "events") {
          setCursorMode("event");
          setBadgeText("EVENTS / 02");
        } else if (section.id === "projects") {
          setCursorMode("project");
          setBadgeText("PROJECTS / 03");
        } else if (section.id === "resources") {
          setCursorMode("resource");
          setBadgeText("DESK / 04");
        } else if (section.id === "team") {
          setCursorMode("team");
          setBadgeText("PEOPLE / 05");
        } else if (section.id === "achievements") {
          setCursorMode("achievement");
          setBadgeText("RECORD / 06");
        } else if (section.id === "gallery") {
          setCursorMode("gallery");
          setBadgeText("FIELD NOTES / 07");
        } else if (section.matches(".v4-join")) {
          setCursorMode("join");
          setBadgeText("JOIN CSS");
        } else if (section.matches(".admin-content, .login-card")) {
          setCursorMode("admin");
          setBadgeText("ADMIN / SYS");
        } else {
          setCursorMode("default");
          setBadgeText("");
        }
      } else {
        setIsHovered(false);
        setCursorMode("default");
        setBadgeText("");
      }
    };

    const onOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const interactive = target.closest<HTMLElement>(
        'a, button, input, select, textarea, [role="button"], .v4-button, .v4-text-link, .v4-brand, .poster-card, .event-line, .project-visual, .member-card, .resource-card, .gallery-v4-shot, .about-v4-principles article, .achievement-v4-row'
      );

      if (interactive) {
        setIsHovered(false);
      }
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("mousedown", onMouseDown, { passive: true });
    window.addEventListener("mouseup", onMouseUp, { passive: true });
    document.addEventListener("mouseleave", onMouseLeave);
    document.addEventListener("mouseenter", onMouseEnter);
    document.addEventListener("mouseover", onOver, { passive: true });
    document.addEventListener("mouseout", onOut, { passive: true });

    return () => {
      document.body.classList.remove("has-custom-cursor");
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("mouseleave", onMouseLeave);
      document.removeEventListener("mouseenter", onMouseEnter);
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("mouseout", onOut);
    };
  }, [isVisible]);

  return (
    <div
      className={`v4-custom-cursor cursor-mode-${cursorMode} ${isVisible ? "is-visible" : ""} ${
        isHovered ? "is-hovered" : ""
      } ${isPressed ? "is-pressed" : ""}`}
      aria-hidden="true"
    >
      {/* High-Contrast Bold Vector Arrow Pointer (Matching User Image) */}
      <div ref={arrowRef} className="v4-cursor-arrow">
        <svg width="28" height="34" viewBox="0 0 28 34" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Black Outer Shadow Outline */}
          <path
            d="M2 2 L24 18 L14.5 19.5 L19.5 30 L15.5 32 L10.5 21 L2 26 Z"
            fill="#000000"
          />
          {/* Thick Crisp White Border */}
          <path
            className="arrow-white-border"
            d="M4 5 L20.5 17 L12.5 18 L17.5 27.5 L15 28.8 L10 19 L4 23 Z"
            fill="#FFFFFF"
          />
          {/* Dark Solid Inner Core */}
          <path
            className="arrow-core"
            d="M5.5 7.5 L18 16.2 L11.2 17 L15.8 25.8 L14.2 26.6 L9.5 17.5 L5.5 20.8 Z"
            fill="#111315"
          />
        </svg>
      </div>

      {/* Dynamic Action Badge Tag */}
      {badgeText && (
        <div ref={badgeRef} className="v4-cursor-badge">
          <span>{badgeText}</span>
        </div>
      )}
    </div>
  );
}
