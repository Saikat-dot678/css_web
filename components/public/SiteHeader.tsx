"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const links = [
  ["Home", "/"],
  ["Events", "/events"],
  ["Projects", "/projects"],
  ["Team", "/team"],
  ["Resources", "/resources"],
] as const;

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.classList.toggle("menu-open", open);
    return () => document.body.classList.remove("menu-open");
  }, [open]);

  const active = (href: string) =>
    href === "/" ? pathname === "/" || pathname === "/home" : pathname.startsWith(href);

  return (
    <header className="site-header">
      <div className="utility">
        <span>CSE Students’ Society</span>
        <span>National Institute of Technology Durgapur</span>
        <span>Est. 2023</span>
      </div>
      <div className="nav-shell">
        <Link className="brand" href="/" aria-label="CSS home">
          <span className="brand-box">CSS</span>
          <span className="brand-issue">DEPT. 23<br />ISSUE 04</span>
        </Link>
        <nav className="main-nav" aria-label="Primary">
          {links.map(([label, href]) => (
            <Link className={active(href) ? "active" : ""} href={href} key={href}>{label}</Link>
          ))}
        </nav>
        <div className="nav-end">
          <Link href="/achievements" className="text-link">Archive</Link>
          <Link href="/admin" className="text-link">Admin</Link>
          <Link className="solid-link" href="/team#recruitment">Join the team</Link>
          <button
            className="menu-toggle"
            type="button"
            aria-expanded={open}
            aria-controls="mobileNav"
            aria-label={open ? "Close navigation" : "Open navigation"}
            onClick={() => setOpen((value) => !value)}
          >
            <span /><span /><span /><b>Menu</b>
          </button>
        </div>
      </div>
      <nav className={`mobile-nav ${open ? "open" : ""}`} id="mobileNav" aria-label="Mobile primary">
        {links.map(([label, href]) => (
          <Link className={active(href) ? "active" : ""} href={href} key={href} onClick={() => setOpen(false)}>{label}</Link>
        ))}
        <Link href="/achievements" onClick={() => setOpen(false)}>Achievements</Link>
        <Link href="/admin" onClick={() => setOpen(false)}>Admin</Link>
      </nav>
    </header>
  );
}
