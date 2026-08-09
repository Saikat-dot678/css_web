"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const links = [
  ["About", "/#about"],
  ["Events", "/events"],
  ["Archive", "/archive"],
  ["Projects", "/projects"],
  ["Team", "/team"],
  ["Resources", "/resources"],
] as const;

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const home = pathname === "/" || pathname === "/home";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    const initialFrame = window.requestAnimationFrame(onScroll);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.cancelAnimationFrame(initialFrame);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  useEffect(() => {
    document.body.classList.toggle("menu-open", open);
    return () => document.body.classList.remove("menu-open");
  }, [open]);

  const active = (href: string) => {
    if (href.startsWith("/#")) return home;
    return pathname.startsWith(href);
  };

  return (
    <header className={`v4-site-header ${home ? "v4-header-home" : ""} ${scrolled ? "scrolled" : ""}`}>
      <div className="v4-nav-shell">
        <Link className="v4-brand" href="/" aria-label="CSS home" onClick={() => setOpen(false)}>
          <strong>CSS</strong>
          <span>CSE STUDENTS’ SOCIETY<br />NIT DURGAPUR</span>
        </Link>

        <nav className="v4-main-nav" aria-label="Primary navigation">
          {links.map(([label, href]) => (
            <Link className={active(href) ? "active" : ""} href={href} key={href}>
              {label}
            </Link>
          ))}
        </nav>

        <div className="v4-nav-actions">
          <Link className="v4-nav-join" href="/team#recruitment">JOIN CSS ↗</Link>
          <button
            className="v4-menu-toggle"
            type="button"
            aria-expanded={open}
            aria-controls="v4MobileNav"
            aria-label={open ? "Close navigation" : "Open navigation"}
            onClick={() => setOpen((value) => !value)}
          >
            <span /><span />
            <b>{open ? "CLOSE" : "MENU"}</b>
          </button>
        </div>
      </div>

      <nav className={`v4-mobile-nav ${open ? "open" : ""}`} id="v4MobileNav" aria-label="Mobile navigation">
        <div>
          {links.map(([label, href], index) => (
            <Link href={href} key={href} onClick={() => setOpen(false)}>
              <span>{String(index + 1).padStart(2, "0")}</span>{label}<b>↗</b>
            </Link>
          ))}
          <Link href="/achievements" onClick={() => setOpen(false)}>
            <span>07</span>Achievements<b>↗</b>
          </Link>
        </div>
        <p>CSS / NIT DURGAPUR<br />23.5491° N · 87.2909° E</p>
      </nav>
    </header>
  );
}
