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

## Adding a lesson
1. Create `content/lessons/<slug>.ts` exporting a `LessonContent` (see `what-happens-when-you-press-enter.ts`). The slug must match
   the lesson's slug from the curriculum (its title, slugified).
2. Register it in `content/lessons/index.ts`.
3. Entities draw in the order listed (put back-most first). Points are named screen coordinates used by packets, links and labels.
   Packets can be `lost` (dropped partway with a red cross); `tokens` draw rows of still packets for queues and buffers.
4. Check it in a browser at desktop and phone width (no horizontal page scroll; the scene may scroll inside its own box).

## Rules
- Match the Paper Isometrics theme (tokens in `app/globals.css` and docs/PLAN.md §4).
- Keep the style, but never copy designed-to-scale.vercel.app's lessons, branding or layouts.
- Pro content must be gated server-side via `lib/access.ts`. `PAYWALL_ENABLED=false` (default) keeps everything open.
- Every lesson page must include its written explanation as real text (SEO and AI crawlers).
- The site owner is new to system design: explain choices in plain language and propose the next step.
