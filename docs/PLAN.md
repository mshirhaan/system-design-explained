# System Design Explained: product plan

Status: planning finished, Phase 1 not started.
Domain: **systemdesignexplained.com** (chosen; `.dev` and `.app` were also free at the time of checking).

## 1. What we are building

A paid (freemium) website that teaches system design from zero to interview-ready mastery.
What makes it different: **every lesson is an animated scene you step through**, showing what
happens *inside* the system (packets, DNS, B-tree splits, Redis eviction, Kafka partitions,
Kubernetes rescheduling) instead of static boxes and arrows.

Each lesson has:
- an animated isometric scene with 6–12 steps (Play / Pause / Replay / Back / Next)
- a narration panel per step plus a "key idea" box
- "break it" controls (sliders and buttons: 10× traffic, kill a node, drop an index…)
- a 3-question quiz and a recap card
- a written explanation rendered as real text (for SEO and AI crawlers)

Each track ends with a **checkpoint** challenge.

## 2. Curriculum

Full list: [`curriculum.json`](./curriculum.json). Browsable version: [`prototypes/curriculum-map.html`](./prototypes/curriculum-map.html).

- 8 stages, 19 tracks, 227 lessons, 19 checkpoints, about 55 hours.
- 37 free lessons, 190 Pro.

| Stage | Tracks |
|---|---|
| 1. Foundations | How the Internet Works |
| 2. Building blocks | APIs & Communication · Napkin Math · Scaling the Web Tier |
| 3. Data | Inside a Database · Transactions & Concurrency · Scaling Databases · Beyond SQL |
| 4. Speed & async | Caching & Redis · Queues, Streams & Async Work |
| 5. Distributed | Distributed Systems Theory |
| 6. Production | Reliability · Microservices · Containers & Kubernetes · Observability · Security |
| 7. Interview | The System Design Interview |
| 8. Case studies & labs | 30 Case Studies · Mastery Labs |

## 3. Freemium rules

Free:
- All of Foundations (track 1).
- The first lesson of every Pro track, as a taste.
- Interview basics (lessons 18.1–18.3).
- The URL shortener case study.

Pro: everything else.

**Testing phase:** a single setting, `PAYWALL_ENABLED=false`, keeps every lesson open.
Turning it on locks Pro lessons. The lock must be enforced **on the server** (Pro lesson
content is never sent to a user without access), not only hidden in the browser.

Pricing, a starting guess to check against competitors:
- about $12/month
- $79/year
- about $149 lifetime for early users

## 4. Visual theme: Paper Isometrics

Working demo: [`prototypes/paper-isometrics-demo.html`](./prototypes/paper-isometrics-demo.html).

The look combines:
- **Isometric illustration (2:1 projection):** world (X, Y, Z) maps to screen `x = X − Y`, `y = (X + Y)/2 − Z`.
- **Soft neo-brutalism:** ink-bordered buttons and pills with a hard, unblurred offset shadow (`1.5px 2.5px 0 ink`).
- **Clay-like blocks on paper:** rounded corners everywhere (quadratic curves), two-tone pastel gradients, warm brown blurred shadows, and a white highlight under the front edge.
- **Background:** warm paper with a faint isometric grid that fades out at the edges.
- **Font:** JetBrains Mono everywhere.
- **Motion:** packets hop along arrows with ease-in-out; labels pop in with a small overshoot.

Core tokens: paper `#f4ebe0`, sheet `#f9f2e8`, ink `#1d1b18`, line `#ddd3c5`, muted `#6f6961`;
pastel accents green `#cfe3b2`, violet `#e7ddf5`, orange `#fcdcbd`, yellow `#fee7b8`, blue `#d6e5f6`;
shadow `#6b5236`. Block gradients per colour (top / side) are defined in the demo file (`COLORS`).

Scene kit, from the demo: `box()` (slab or cube), `cylinder()` (database or store), `phone()` (device),
`pill()` (label), `packet()` (request, response, empty, message, heartbeat), `link()` / `pipe()` (arrows),
plus a pausable clock with `tween()` and `wait()`.

We keep the *style* but must not copy designed-to-scale.vercel.app's lessons, branding or layouts.

## 5. Technology

- **Next.js (App Router) + TypeScript**, hosted on **Vercel**.
- **Scene engine:** React + SVG components ported from the demo; each lesson is a scene script plus data.
- **Supabase:** authentication (Google and email) and Postgres for progress and entitlements.
- **Payments:** Lemon Squeezy or Paddle (merchant of record, so they handle global tax). Stripe is the alternative.
- **Lesson content:** typed data / MDX in the repo, with `curriculum.json` as the source of the course map.

## 6. SEO and AI discoverability

- Every lesson page renders its explanation as real HTML text, not only animation.
- One page per searched topic (for example "Redis vs Memcached", "how database indexing works", "consistent hashing explained").
- Free cheatsheets and the interview framework, as content people link to.
- Sitemap, structured data marking pages as courses, good titles and fast pages.
- Distribution: Reddit (r/systemdesign, r/cscareerquestions), Hacker News, LinkedIn and YouTube clips of the animations, and a public GitHub repo of free diagrams.

## 7. Build phases

1. **Foundation:** project setup, design system, scene engine, lesson player, course map, and lesson 1.1 "What happens when you press Enter". Paywall off.
2. **Beginner path:** the rest of track 1, plus tracks 2, 3, 4 and 18 (basics). All open, then test with real people.
3. **Accounts and progress** (Supabase).
4. **Payments, then switch the paywall on.**
5. **Deep dives:** Inside a Database first (most visual, rarest elsewhere), then Redis, Kafka, Kubernetes…
6. **Case studies, Mastery Labs** (sandbox, drills, mock interviews).

## 8. Housekeeping

- Delete the leftover `access-check` branch on GitHub and set the default branch to `main`.
