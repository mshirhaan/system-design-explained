# System Design Explained

Freemium website teaching system design with step-through animated isometric scenes.
Domain: systemdesignexplained.com.

Read before working:
- `docs/PLAN.md`: product decisions, theme, tech stack, freemium rules, build phases. Keep it up to date when decisions change.
- `docs/curriculum.json`: the full course (19 tracks, 227 lessons). This is the source of truth for the course map.
- `docs/prototypes/paper-isometrics-demo.html`: reference implementation of the Paper Isometrics look and the scene engine (box, cylinder, phone, pill, packet, pausable clock).

Rules:
- Match the Paper Isometrics theme exactly (tokens in docs/PLAN.md §4).
- Keep the style, but never copy designed-to-scale.vercel.app's lessons, branding or layouts.
- Pro content must be gated server-side. `PAYWALL_ENABLED=false` during testing keeps everything open.
- The site owner is new to system design: explain choices in plain language and propose the next step.
