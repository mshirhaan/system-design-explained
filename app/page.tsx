import Link from "next/link";
import { LoopingScene } from "@/components/player/LoopingScene";
import { loadLesson } from "@/content/lessons";
import { stages, stats, tracks } from "@/lib/curriculum";
import { site } from "@/lib/site";

const FIRST = "what-happens-when-you-press-enter";

export default async function Home() {
  const first = await loadLesson(FIRST);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: site.name,
    description: site.description,
    provider: { "@type": "Organization", name: site.name, sameAs: site.url },
    url: site.url,
    hasCourseInstance: { "@type": "CourseInstance", courseMode: "online", courseWorkload: `PT${stats.hours}H` },
    offers: { "@type": "Offer", category: "Freemium", price: 0, priceCurrency: "USD" },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className="hero paper-grid">
        <div className="wrap hero-grid">
          <div>
            <span className="tag tag-violet">Free during beta · every lesson open</span>
            <h1 style={{ marginTop: 16 }}>
              System design, <mark>explained</mark> by watching it happen.
            </h1>
            <p className="hero-sub">
              Step inside real systems. Watch a request cross the internet, a database walk its index, Redis evict a key and
              Kubernetes replace a crashed pod, one animated step at a time. From zero to interview-ready.
            </p>
            <div className="hero-cta">
              <Link href={`/lessons/${FIRST}`} className="btn btn-primary btn-lg">
                Start the first lesson →
              </Link>
              <Link href="/course" className="btn btn-lg">
                See all {stats.lessons} lessons
              </Link>
            </div>
            <div className="hero-stats">
              <span>
                <b>{stats.lessons}</b>animated lessons
              </span>
              <span>
                <b>{stats.tracks}</b>tracks
              </span>
              <span>
                <b>30</b>case studies
              </span>
              <span>
                <b>~{stats.hours} h</b>of learning
              </span>
            </div>
          </div>
          {first?.preview && (
            <div className="hero-scene card-pop">
              <span className="tag hero-scene-tag">Lesson 1.1 · live preview</span>
              <LoopingScene scene={first.scene} step={first.preview} label="Animated preview: a page load travelling from a laptop through DNS and routers to a web server and database" className="scene" />
            </div>
          )}
        </div>
      </section>

      <section className="section" id="how-it-works">
        <div className="wrap">
          <div className="section-head">
            <span className="eyebrow">How a lesson works</span>
            <h2>Every concept is a scene you can step through.</h2>
            <p>
              Diagrams show boxes and arrows. We show what moves between them. Each lesson is a short animated story with a
              plain-language explanation for every step.
            </p>
          </div>
          <div className="features">
            <div className="feature card">
              <span className="feature-ico" style={{ background: "var(--blue)" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 4.5v15l12-7.5z" /></svg>
              </span>
              <h3>Step through it</h3>
              <p>Play, pause, rewind. Each step shows one thing happening, with the explanation right beside it.</p>
            </div>
            <div className="feature card">
              <span className="feature-ico" style={{ background: "var(--orange)" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M13 2 4 14h7l-1 8 9-12h-7z" /></svg>
              </span>
              <h3>See where time goes</h3>
              <p>Timing bars and counters show the cost of every hop, query and handshake, so trade-offs feel real.</p>
            </div>
            <div className="feature card">
              <span className="feature-ico" style={{ background: "var(--green)" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m5 12 5 5 9-10" /></svg>
              </span>
              <h3>Prove you've got it</h3>
              <p>Quick quizzes after every lesson, checkpoint challenges after every track, and timed mock interviews.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <span className="eyebrow">The path</span>
            <h2>From "what is a server?" to designing a stock exchange.</h2>
            <p>Eight stages, in order. Start at the beginning, or jump to what your next interview needs.</p>
          </div>
          <div className="path">
            {stages.map((s) => {
              const ts = tracks.filter((t) => t.stage === s.id);
              const n = ts.reduce((a, t) => a + t.lessons.length, 0);
              return (
                <Link key={s.id} href={`/course#stage-${s.id}`} className="path-stage card-pop">
                  <small>STAGE {s.id}</small>
                  <h3>{s.name}</h3>
                  <p>{ts.map((t) => t.name).join(" · ")}</p>
                  <span className="path-count">{n} lessons</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section" id="pricing">
        <div className="wrap">
          <div className="section-head">
            <span className="eyebrow">Pricing</span>
            <h2>Start free. Go Pro for the deep dives.</h2>
          </div>
          <div className="pricing">
            <div className="plan card-pop">
              <h3>Free</h3>
              <div className="plan-price">
                $0 <small>forever</small>
              </div>
              <ul>
                <li>All of Foundations: how the internet works</li>
                <li>The first lesson of every track</li>
                <li>Interview basics and the URL shortener case study</li>
                <li>Quizzes on every free lesson</li>
              </ul>
              <Link href={`/lessons/${FIRST}`} className="btn">
                Start free
              </Link>
            </div>
            <div className="plan plan-pro card-pop">
              <h3>Pro</h3>
              <div className="plan-price">
                $12 <small>/ month · or $79 / year</small>
              </div>
              <ul>
                <li>All {stats.lessons} lessons, including databases, Redis, Kafka and Kubernetes internals</li>
                <li>30 case studies with full walkthroughs</li>
                <li>Checkpoint challenges and Mastery Labs</li>
                <li>Timed mock interviews</li>
              </ul>
              <Link href="/course" className="btn btn-primary">
                Everything is open during beta
              </Link>
            </div>
          </div>
          <p className="beta-note">During the beta every lesson is free while we test. Pro launches once the deep-dive tracks are ready.</p>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="cta-band card-pop">
            <h2>Watch your first request travel the internet.</h2>
            <Link href={`/lessons/${FIRST}`} className="btn btn-primary btn-lg">
              Start lesson 1.1 →
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
