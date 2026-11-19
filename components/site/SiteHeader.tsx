import Link from "next/link";
import { LogoMark } from "./Logo";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="wrap site-header-inner">
        <Link href="/" className="brand" aria-label="System Design Explained, home">
          <LogoMark />
          <span>
            System Design <mark>Explained</mark>
          </span>
        </Link>
        <nav className="site-nav" aria-label="Main">
          <Link href="/course">Course</Link>
          <Link href="/#how-it-works">How it works</Link>
          <Link href="/#pricing">Pricing</Link>
          <Link href="/lessons/what-happens-when-you-press-enter" className="btn btn-primary btn-sm">
            Start free
          </Link>
        </nav>
      </div>
    </header>
  );
}
