import Link from "next/link";
import { stages, tracks } from "@/lib/curriculum";
import { LogoMark } from "./Logo";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="wrap footer-grid">
        <div className="footer-brand">
          <div className="brand">
            <LogoMark size={26} />
            <span>System Design Explained</span>
          </div>
          <p>Learn system design by watching it happen, one animated step at a time.</p>
        </div>
        {stages.slice(0, 4).map((s) => (
          <div key={s.id}>
            <h3>{s.name}</h3>
            <ul>
              {tracks
                .filter((t) => t.stage === s.id)
                .map((t) => (
                  <li key={t.id}>
                    <Link href={`/course#track-${t.id}`}>{t.name}</Link>
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="wrap footer-base">
        <span>© {new Date().getFullYear()} System Design Explained</span>
        <Link href="/course">Full course map</Link>
      </div>
    </footer>
  );
}
