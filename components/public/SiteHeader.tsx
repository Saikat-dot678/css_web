"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type CSSProperties } from "react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

const links = [
  ["About", "/#about"],
  ["Events", "/events"],
  ["Archive", "/archive"],
  ["Projects", "/projects"],
  ["Team", "/team"],
  ["Resources", "/resources"],
] as const;

const brandLinkStyle: CSSProperties = {
  minHeight: 0,
  padding: 0,
};

const brandMarkStyle: CSSProperties = {
  width: "clamp(60px, 7vw, 78px)",
  aspectRatio: "837 / 343",
  display: "grid",
  placeItems: "center",
  flex: "0 0 auto",
  overflow: "hidden",
  lineHeight: 0,
  background: "#07011d",
};

const brandImageStyle: CSSProperties = {
  display: "block",
  width: "100%",
  height: "100%",
  objectFit: "contain",
  maxWidth: "100%",
};

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const home = pathname === "/" || pathname === "/home";

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const next = window.scrollY > 30;
      setScrolled((current) => current === next ? current : next);
    };
    const requestUpdate = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    requestUpdate();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", requestUpdate);
    };
  }, []);

  useEffect(() => {
    document.body.classList.toggle("menu-open", open);
    return () => document.body.classList.remove("menu-open");
  }, [open]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && open) setOpen(false);
    };
    if (open) window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [open]);

  const active = (href: string) => (href.startsWith("/#") ? home : pathname.startsWith(href));
  const handleNavClick = () => setOpen(false);

  return (
    <header className={`v4-site-header ${home ? "v4-header-home" : ""} ${scrolled ? "scrolled" : ""}`}>
      <div className="v4-nav-shell">
        <Link
          className="v4-brand"
          href="/"
          aria-label="CSE Students’ Society home"
          onClick={handleNavClick}
          style={brandLinkStyle}
        >
          <div className="v4-brand-mark" aria-hidden="true" style={brandMarkStyle}>
            <Image
              src="/brand/css-logo.jpg"
              alt=""
              width={837}
              height={343}
              sizes="(max-width: 480px) 60px, 78px"
              style={brandImageStyle}
              priority
            />
          </div>
          <span className="v4-brand-copy">
            CSE Students’ Society
            <br />
            NIT DURGAPUR
          </span>
        </Link>

        <nav className="v4-main-nav" aria-label="Primary navigation">
          {links.map(([label, href]) => (
            <Link className={active(href) ? "active" : ""} href={href} key={href}>
              {label}
            </Link>
          ))}
        </nav>

        <div className="v4-nav-actions">
          <ThemeToggle />
          <Link className="v4-nav-join" href="/team#recruitment">
            JOIN CSS ↗
          </Link>
          <button
            className="v4-menu-toggle"
            type="button"
            aria-expanded={open}
            aria-controls="v4MobileNav"
            aria-label={open ? "Close navigation menu" : "Open navigation menu"}
            onClick={() => setOpen((value) => !value)}
          >
            <span />
            <span />
            <b>{open ? "CLOSE" : "MENU"}</b>
          </button>
        </div>
      </div>

      <nav className={`v4-mobile-nav ${open ? "open" : ""}`} id="v4MobileNav" aria-label="Mobile navigation">
        <div>
          {links.map(([label, href], index) => (
            <Link href={href} key={href} onClick={handleNavClick}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <span style={{ flex: 1 }}>{label}</span>
              <b>↗</b>
            </Link>
          ))}
          <Link href="/achievements" onClick={handleNavClick}>
            <span>07</span>
            <span style={{ flex: 1 }}>Achievements</span>
            <b>↗</b>
          </Link>
        </div>
        <p>
          CSS / NIT DURGAPUR
          <br />
          23.5491° N · 87.2909° E
        </p>
      </nav>
    </header>
  );
}
