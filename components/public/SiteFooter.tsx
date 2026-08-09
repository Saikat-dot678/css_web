import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="v4-site-footer">
      <div className="v4-footer-grid">
        <div className="v4-footer-brand">
          <strong>CSS</strong>
          <p>
            CSE Students’ Society<br />
            National Institute of Technology Durgapur
          </p>
        </div>

        <div className="v4-footer-links">
          <strong>EXPLORE</strong>
          <Link href="/#about">About</Link>
          <Link href="/events">Events</Link>
          <Link href="/archive">Archive</Link>
          <Link href="/projects">Projects</Link>
          <Link href="/team">Team</Link>
        </div>

        <div className="v4-footer-links">
          <strong>USEFUL</strong>
          <Link href="/resources">Resources</Link>
          <Link href="/achievements">Achievements</Link>
          <a href="https://in.linkedin.com/company/cssnitdgp" target="_blank" rel="noreferrer">LinkedIn ↗</a>
          <a href="https://cssnitdgp.in" target="_blank" rel="noreferrer">Official site ↗</a>
        </div>

        <div className="v4-footer-system">
          <span><i /> SYSTEM ONLINE</span>
          <span>DURGAPUR / INDIA</span>
          <span>23.5491 N / 87.2909 E</span>
        </div>
      </div>

      <div className="v4-footer-bottom">
        <span>© 2026 CSS, NIT Durgapur</span>
        <span>ENGAGE · EDUCATE · INSPIRE</span>
      </div>
    </footer>
  );
}
