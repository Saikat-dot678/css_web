import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div>
          <div className="footer-mark">CSS / NIT DGP</div>
          <p>Official Computer Science and Engineering society of NIT Durgapur.<br />A student-run department community for learning, building, and representation.</p>
        </div>
        <div><strong>Public</strong><Link href="/events">Events</Link><Link href="/projects">Projects</Link><Link href="/team">Team</Link><Link href="/achievements">Achievements</Link></div>
        <div><strong>Useful</strong><Link href="/resources">Resources</Link><a href="https://cssnitdgp.in" target="_blank" rel="noreferrer">Official site</a><a href="https://in.linkedin.com/company/cssnitdgp" target="_blank" rel="noreferrer">LinkedIn</a><Link href="/admin">Admin</Link></div>
        <div className="footer-stamp">Engage<br />Educate<br />Inspire</div>
      </div>
      <div className="footer-bottom"><span>© 2026 CSS, NIT Durgapur</span><span>Department Dispatch — society website</span></div>
    </footer>
  );
}
