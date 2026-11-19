import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LessonPlayer } from "@/components/player/LessonPlayer";
import { Quiz } from "@/components/player/Quiz";
import { Scene } from "@/components/scene/Scene";
import type { SceneDef } from "@/components/scene/types";
import { TrackCube } from "@/components/site/TrackCube";
import { builtSlugs, hasContent, loadLesson } from "@/content/lessons";
import { canAccess, getViewer, paywallEnabled } from "@/lib/access";
import { getLessonBySlug, getStage, getTrack, lessons, levelLabel, neighbours, type TrackColor } from "@/lib/curriculum";
import { site } from "@/lib/site";

export function generateStaticParams() {
  return lessons.map((l) => ({ slug: l.slug }));
}
export const dynamicParams = false;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const lesson = getLessonBySlug(slug);
  if (!lesson) return {};
  const content = await loadLesson(slug);
  const track = getTrack(lesson.trackId);
  const description = content?.intro ?? `${lesson.title}: ${lesson.animation}. An animated, step-by-step lesson from the ${track.name} track.`;
  return {
    title: `${lesson.title} (animated explanation)`,
    description,
    alternates: { canonical: `/lessons/${slug}` },
    openGraph: { title: lesson.title, description, url: `${site.url}/lessons/${slug}`, type: "article" },
  };
}

export default async function LessonPage({ params }: Props) {
  const { slug } = await params;
  const lesson = getLessonBySlug(slug);
  if (!lesson) notFound();
  const track = getTrack(lesson.trackId);
  const stage = getStage(track.stage);
  const viewer = await getViewer();
  const allowed = canAccess(lesson, viewer);
  // Content is only loaded (and so only sent to the browser) when the viewer may see it.
  const content = allowed ? await loadLesson(slug) : null;
  const { prev, next } = neighbours(lesson);
  const firstReady = builtSlugs[0];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    name: lesson.title,
    description: content?.intro ?? lesson.animation,
    educationalLevel: levelLabel[lesson.level],
    learningResourceType: "Interactive lesson",
    isAccessibleForFree: lesson.access === "free" || !paywallEnabled(),
    isPartOf: { "@type": "Course", name: site.name, url: site.url },
  };

  return (
    <div className="wrap">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <header className="lesson-head">
        <nav className="crumbs" aria-label="Breadcrumb">
          <Link href="/course">Course</Link>
          <span aria-hidden="true">/</span>
          <Link href={`/course#stage-${stage.id}`}>{stage.name}</Link>
          <span aria-hidden="true">/</span>
          <Link href={`/course#track-${track.id}`}>
            {track.id}. {track.name}
          </Link>
          <span aria-hidden="true">/</span>
          <span>Lesson {lesson.id}</span>
        </nav>
        <div className="lesson-head-row">
          <h1>{lesson.title}</h1>
          <div className="lesson-tags-row">
            <span className="tag">{levelLabel[lesson.level]}</span>
            <span className={`tag ${lesson.access === "free" ? "tag-green" : "tag-violet"}`}>{lesson.access === "free" ? "Free" : "Pro"}</span>
            {content && <span className="tag tag-yellow">{content.steps.length} steps</span>}
          </div>
        </div>
        <p className="lede">{content?.intro ?? lesson.animation}</p>
      </header>

      {!allowed ? (
        <Locked color={track.color} title={lesson.title} animation={lesson.animation} />
      ) : content ? (
        <>
          <LessonPlayer
            lesson={content}
            title={lesson.title}
            nextLesson={next && hasContent(next.slug) ? { href: `/lessons/${next.slug}`, title: next.title } : undefined}
          />
          <div className="lesson-body">
            <div style={{ display: "grid", gap: 16, minWidth: 0 }}>
              <article className="article card">
                {content.article.map((sec) => (
                  <section key={sec.heading}>
                    <h2>{sec.heading}</h2>
                    {sec.paragraphs.map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                  </section>
                ))}
              </article>
              <Quiz questions={content.quiz} />
            </div>
            <aside className="lesson-side">
              <div className="learn card">
                <h2>You'll learn</h2>
                <ul>
                  {content.learn.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </div>
              <div className="idea-card card">
                <h2>Key idea</h2>
                <p>{content.keyIdea}</p>
              </div>
              {content.terms && content.terms.length > 0 && (
                <div className="terms card">
                  <h2>Key terms</h2>
                  <dl>
                    {content.terms.map((t) => (
                      <div key={t.term}>
                        <dt>{t.term}</dt>
                        <dd>{t.meaning}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}
            </aside>
          </div>
        </>
      ) : (
        <ComingSoon color={track.color} animation={lesson.animation} firstReady={firstReady} />
      )}

      <nav className="lesson-next" aria-label="More lessons">
        {prev ? (
          <Link href={`/lessons/${prev.slug}`} className="next-card card-pop">
            <small>← Previous · {prev.id}</small>
            <b>{prev.title}</b>
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link href={`/lessons/${next.slug}`} className="next-card card-pop is-next">
            <small>Next · {next.id} →</small>
            <b>{next.title}</b>
          </Link>
        )}
      </nav>
    </div>
  );
}

function artScene(color: TrackColor): SceneDef {
  return {
    viewBox: [-260, -150, 520, 300],
    entities: [
      { id: "base", kind: "slab", at: [0, 60], w: 210, d: 150, h: 14 },
      { id: "a", kind: "box", at: [-60, 40], w: 60, h: 70, color },
      { id: "b", kind: "cylinder", at: [70, 50], rx: 34, h: 52, color: "yellow" },
      { id: "c", kind: "box", at: [10, 92], w: 40, h: 34, color: "purple" },
    ],
    points: { label: [0, -110] },
  };
}

function ComingSoon({ color, animation, firstReady }: { color: TrackColor; animation: string; firstReady: string }) {
  return (
    <section className="soon card-pop">
      <div style={{ display: "grid", gap: 14 }}>
        <span className="tag tag-yellow" style={{ justifySelf: "start" }}>
          Animation in production
        </span>
        <h2>This lesson's scene is being built.</h2>
        <div className="soon-anim">
          <small>WHAT YOU'LL WATCH</small>
          {animation}
        </div>
        <p>New lessons ship every week, in course order. Meanwhile, start with the first lesson.</p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link href={`/lessons/${firstReady}`} className="btn btn-primary">
            Go to a ready lesson →
          </Link>
          <Link href="/course" className="btn">
            Course map
          </Link>
        </div>
      </div>
      <div className="soon-art">
        <Scene scene={artScene(color)} step={{ title: "", body: "", labels: [{ at: "label", text: "coming soon", icon: "clock", tone: "yellow" }] }} label="Illustration" />
      </div>
    </section>
  );
}

function Locked({ color, title, animation }: { color: TrackColor; title: string; animation: string }) {
  return (
    <section className="soon card-pop" style={{ background: "var(--violet)" }}>
      <div style={{ display: "grid", gap: 14 }}>
        <span className="tag" style={{ justifySelf: "start" }}>
          Pro lesson
        </span>
        <h2>Unlock "{title}" with Pro.</h2>
        <div className="soon-anim" style={{ background: "var(--sheet)" }}>
          <small>WHAT YOU'LL WATCH</small>
          {animation}
        </div>
        <p>Pro opens every lesson, case study and lab.</p>
        <Link href="/#pricing" className="btn btn-primary" style={{ justifySelf: "start" }}>
          See Pro plans
        </Link>
      </div>
      <div className="soon-art" style={{ display: "grid", placeItems: "center" }}>
        <TrackCube color={color} className="track-ico" />
      </div>
    </section>
  );
}
