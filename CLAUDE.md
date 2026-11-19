# System Design Explained

Freemium website teaching system design with step-through animated isometric scenes.
Domain: systemdesignexplained.com. Stack: Next.js 16 (App Router) + React 19 + TypeScript, deployed on Vercel.

Read before working:
- `docs/PLAN.md`: product decisions, theme, freemium rules, build phases. Keep it up to date when decisions change.
- `content/curriculum.json`: the full course (19 tracks, 227 lessons). Source of truth for the course map and lesson URLs.
- `docs/prototypes/paper-isometrics-demo.html`: the original theme prototype.

## Layout
- `app/`: pages. `/` home, `/course` course map, `/lessons/[slug]` lesson page (all lessons statically generated), plus `sitemap.ts`, `robots.ts`.
- `app/globals.css`: the whole Paper Isometrics design system (tokens at the top). No CSS framework.
- `components/scene/`: the scene engine. `geometry.ts` (isometric maths, rounded paths), `primitives.tsx` (Box, Cylinder, Laptop, Phone, Router, Pill), `Scene.tsx` (renders a scene step: links, entities, packets, labels), `types.ts` (scene and lesson data types), `palette.ts`, `icons.tsx`.
- `components/player/`: `LessonPlayer` (steps, controls, narration), `useSceneClock` (drives the SVG timeline), `TimingBar`, `Quiz`, `LoopingScene` (preview loops).
- `content/lessons/`: one file per finished lesson, registered in `content/lessons/index.ts` by slug.
- `lib/curriculum.ts` (typed curriculum, slugs), `lib/access.ts` (server-only paywall check), `lib/site.ts`.

## How animation works
Scenes are SVG. Every timed element uses SVG's built-in timeline (SMIL: `<animate>`, `<animateMotion>`, `<set>`), with times in
seconds from the start of a step. The player restarts, pauses and resumes a step with `setCurrentTime(0)`, `pauseAnimations()` and
`unpauseAnimations()`, so steps are declarative data, and Back/Next/Replay always show the same thing.
Each step loops until the learner moves on. The first play pops everything in; repeat plays render with `steady`, where
labels, links and token rows without an `until` stay still and only packets (and timed labels) replay. Auto-play is optional
and off by default. Design every step so its packets make sense when they repeat.

## Adding a lesson
1. Create `content/lessons/<slug>.ts` exporting a `LessonContent` (see `what-happens-when-you-press-enter.ts`). The slug must match
   the lesson's slug from the curriculum (its title, slugified).
2. Register it in `content/lessons/index.ts`.
3. Entities draw in the order listed (put back-most first). Points are named screen coordinates used by packets, links and labels.
   Packets can be `lost` (dropped partway with a red cross); `tokens` draw rows of still packets for queues and buffers.
4. Check it in a browser at desktop and phone width (no horizontal page scroll; the scene may scroll inside its own box).
5. Before shipping, check the lesson against the quality bar below, point by point.

## Lesson quality bar (mandatory)
Learners are beginners who pay for depth. A lesson that is short, vague or needs prior knowledge is a bug.

Scene labels (the pills inside the animation)
- Each label is a complete, plain-language phrase that makes sense on its own: "each trip still takes 1.5 s", not "latency = length".
- No shorthand: no "=" or "·" as connectors, no unexplained abbreviations, no analogy that the step text hasn't explained first.
- At most 3 labels visible at once, never overlapping objects, names or each other.
- Numbers in labels carry units (ms, req/s, MB) and match the step text.

Step text (the narration panel)
- 7–10 steps per lesson, telling a story: the setup, the problem, how the mechanism works, a failure or edge case, the fix, trade-offs, a recap.
- Each step is 3–5 sentences and covers what is happening, why it happens and a concrete example with real numbers.
- Define every technical term the first time it appears, in everyday words. Also list it in `terms`.
- Introduce an analogy in words before any label relies on it (for example, "think of a network link as a road…").
- Use `note` for one extra insight (a real-world fact, a common mistake or an interview tip), not to repeat the body.

Written article (below the player; this is also what Google and AI assistants read)
- 6–9 sections, roughly 900–1,500 words, including:
  1. a plain definition;
  2. how it works, step by step;
  3. a worked example with numbers;
  4. common mistakes or misconceptions;
  5. trade-offs and when to use or avoid it;
  6. how it shows up in real systems (name real products where helpful);
  7. how to talk about it in a system design interview.
- Short paragraphs, concrete numbers, no filler sentences.

Quiz and terms
- 4–5 questions, including at least one scenario question ("your API does X, what happens?"). Every explanation says why the
  right answer is right.
- `terms`: 4–8 key terms, each with a one-sentence plain definition.

Review
- Read every label and step as a total beginner would. If anything needs knowledge from a later lesson, explain it or cut it.
- Check all steps visually (step previews at desktop width) for overlaps and clipped text.

## Rules
- Match the Paper Isometrics theme (tokens in `app/globals.css` and docs/PLAN.md §4).
- Keep the style, but never copy designed-to-scale.vercel.app's lessons, branding or layouts.
- Pro content must be gated server-side via `lib/access.ts`. `PAYWALL_ENABLED=false` (default) keeps everything open.
- Every lesson page must include its written explanation as real text (SEO and AI crawlers).
- The site owner is new to system design: explain choices in plain language and propose the next step.
