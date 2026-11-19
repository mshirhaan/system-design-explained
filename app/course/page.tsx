import type { Metadata } from "next";
import Link from "next/link";
import { TrackCube } from "@/components/site/TrackCube";
import { hasContent } from "@/content/lessons";
import { labPage, lessonHref, levelLabel, stages, stats, tracks } from "@/lib/curriculum";

export const metadata: Metadata = {
  title: "Course map: every system design lesson",
  description: `All ${stats.lessons} animated system design lessons in ${stats.tracks} tracks: networking, APIs, databases, caching and Redis, Kafka, distributed systems, Kubernetes, interviews and 30 case studies.`,
  alternates: { canonical: "/course" },
};

export default function CoursePage() {
  return (
    <div className="wrap">
      <header className="page-head">
        <span className="eyebrow">Course map</span>
        <h1>
          Every lesson, <mark>in order</mark>.
        </h1>
        <p>
          {stats.lessons} animated lessons in {stats.tracks} tracks, about {stats.hours} hours in total. Each track ends with a
          checkpoint challenge. Lessons marked "Ready" have their full animation; the rest are on the way.
        </p>
      </header>

      {stages.map((s) => (
        <section key={s.id} className="stage-block" id={`stage-${s.id}`} aria-labelledby={`stage-${s.id}-title`}>
          <div className="stage-title">
            <span className="eyebrow muted">Stage {s.id}</span>
            <h2 id={`stage-${s.id}-title`}>{s.name}</h2>
            <span className="muted" style={{ fontSize: 12.5 }}>
              {s.subtitle}
            </span>
          </div>
          {tracks
            .filter((t) => t.stage === s.id)
            .map((t) => {
              const free = t.lessons.filter((l) => l.access === "free").length;
              return (
                <details key={t.id} className="track card-pop" id={`track-${t.id}`} open={t.id === 1}>
                  <summary>
                    <TrackCube color={t.color} className="track-ico" />
                    <div className="track-head">
                      <small>Track {t.id}</small>
                      <h3>{t.name}</h3>
                      <p>{t.summary}</p>
                    </div>
                    <div className="track-meta">
                      <span>
                        {t.lessons.length} lessons · {free} free
                      </span>
                      <span className="chev" aria-hidden="true">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1d1b18" strokeWidth="3" strokeLinecap="round">
                          <path d="M6 9l6 6 6-6" />
                        </svg>
                      </span>
                    </div>
                  </summary>
                  <ol className="lesson-list">
                    {t.lessons.map((l) => {
                      const ready = hasContent(l.slug) || !!labPage(l.slug);
                      return (
                        <li key={l.id}>
                          <Link href={lessonHref(l)} className="lesson-row">
                            <span className="lesson-num">{l.id}</span>
                            <div>
                              <div className="lesson-title">{l.title}</div>
                              <div className="lesson-anim">▶ {l.animation}</div>
                            </div>
                            <div className="lesson-tags">
                              {ready && <span className="tag tag-yellow">Ready</span>}
                              <span className={`tag ${l.level === "beginner" ? "" : l.level === "intermediate" ? "tag-yellow" : "tag-orange"}`}>
                                {levelLabel[l.level]}
                              </span>
                              <span className={`tag ${l.access === "free" ? "tag-green" : "tag-violet"}`}>
                                {l.access === "free" ? "Free" : "Pro"}
                              </span>
                            </div>
                          </Link>
                        </li>
                      );
                    })}
                  </ol>
                  <div className="checkpoint">
                    <span className="lesson-num" style={{ color: "var(--ink)" }}>
                      ★
                    </span>
                    <div>
                      <b>Checkpoint:</b> {t.checkpoint}
                    </div>
                  </div>
                </details>
              );
            })}
        </section>
      ))}
    </div>
  );
}
