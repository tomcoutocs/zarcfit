import Link from 'next/link';

export default function LandingFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="hm-foot-line">
      <div className="hm-container hm-foot-line__inner">
        <p>© {year} ZarcFit · Coaching platform for independent trainers</p>
        <nav className="hm-foot-line__links" aria-label="Footer">
          <Link href="/main/about">About</Link>
          <Link href="/main/contact">Contact</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
        </nav>
      </div>
    </footer>
  );
}
