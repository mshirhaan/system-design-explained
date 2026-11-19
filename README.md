# System Design Explained

Learn system design by watching it happen. Every lesson is an animated, step-by-step scene of what goes on inside real systems: networks, databases, caches, queues, Kubernetes and more.

- Plan and decisions: [docs/PLAN.md](docs/PLAN.md)
- Full curriculum (227 lessons): [content/curriculum.json](content/curriculum.json)
- Prototypes: [docs/prototypes](docs/prototypes)

## Run it locally

Needs Node.js 20 or newer.

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

Other commands:

```bash
npm run build      # production build
npm run start      # serve the production build
npm run typecheck  # TypeScript check
```

## Settings

Copy `.env.example` to `.env.local` to change these:

| Variable | Default | What it does |
|---|---|---|
| `PAYWALL_ENABLED` | `false` | `true` locks Pro lessons. Keep `false` while testing. |
| `NEXT_PUBLIC_SITE_URL` | `https://systemdesignexplained.com` | Used for the sitemap, canonical links and social previews. |

## Deploy

The site deploys to Vercel with no extra configuration: import the GitHub repo in Vercel and press Deploy.
