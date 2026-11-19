# Prompt: write one lesson for System Design Explained

Copy everything below the line into another AI. To use it for a different lesson, replace the
"LESSON BRIEF" and "SCENE" sections; everything else stays the same.

---

You are writing one lesson for **System Design Explained**, a paid website that teaches system design to
complete beginners through animated, step-by-step scenes. Learners are new to the topic and pay for depth
and clarity. A lesson that is short, vague, or assumes prior knowledge is a failure.

Your output is **one TypeScript file** that exports a `LessonContent` object (format below). Output only the
file contents in a single ```ts code block, nothing before or after it.

## LESSON BRIEF

- Lesson: **2.5 Webhooks** (track "APIs & Communication", level: intermediate)
- Slug (must be exactly this): `webhooks`
- What the learner should understand: how a service tells your server that something happened (a payment
  succeeded) by calling a URL you registered, instead of your server asking over and over. Cover: why polling
  another company's API is wasteful; registering a webhook URL; the event delivery (an HTTP POST to your
  server); verifying the signature with a shared secret so fakes are rejected; replying 200 quickly and doing
  slow work later via a queue; what happens when your server is down (the provider retries with backoff);
  duplicate deliveries and why you must deduplicate by event ID; ordering is not guaranteed; trade-offs versus
  polling.
- Things learners already know from earlier lessons (you may use them, but re-explain briefly): client/server,
  HTTP requests and status codes, REST, idempotency and retries with backoff.

## SCENE (use exactly this; do not add entities or invent coordinates)

Paste this `scene` object into your lesson unchanged:

```ts
scene: {
  viewBox: [-500, -235, 1000, 570],
  entities: [
    { id: "custSlab", kind: "slab", at: [-370, 212], w: 80, h: 12, name: "customer", nameIcon: "user" },
    { id: "customer", kind: "phone", at: [-370, 200] },
    { id: "provider", kind: "box", at: [300, -10], w: 80, h: 96, color: "purple", text: ["Payment", "provider"], textSize: 15, name: "pay.example", nameIcon: "globe" },
    { id: "server", kind: "box", at: [-80, 40], w: 86, h: 104, color: "blue", text: ["Your", "server"], textSize: 18, name: "shop.example", nameIcon: "globe" },
    { id: "db", kind: "cylinder", at: [180, 220], rx: 44, h: 60, color: "yellow", name: "orders database", nameIcon: "db" },
  ],
  points: {
    cust: [-342, 155],      // the customer's phone
    srvL: [-140, 30],       // left side of your server (towards the customer)
    srvR: [-20, 20],        // right side of your server (towards the provider)
    srvLow: [-40, 90],      // bottom of your server (towards the database)
    prov: [245, -20],       // the payment provider
    db: [148, 190],         // the database
    queue: [-160, -120],    // start of a row of waiting jobs (use with tokens, gap [26, 0])
    custLabel: [-320, 40],  // label positions:
    srvLabel: [-80, -165],
    provLabel: [300, -170],
    midLabel: [110, -70],
    dbLabel: [320, 290],
  },
},
```

Packets travel between points by name, e.g. `path: ["srvR", "prov"]` or `path: ["prov", "srvR"]`.
Labels may only use the label points above (`custLabel`, `srvLabel`, `provLabel`, `midLabel`, `dbLabel`).
Use at most one label per label point at any moment (use `from`/`until` to swap them).

## THE DATA FORMAT

```ts
import type { LessonContent } from "@/components/scene/types";

const lesson: LessonContent = { /* ... */ };
export default lesson;
```

```ts
type XY = [number, number];

interface PacketDef {
  path: string[];          // point names; the packet hops through each in order
  kind: "request" | "response" | "empty" | "message" | "secure" | "heartbeat" | "row";
  at: number;              // start time in seconds from the start of the step
  dur?: number;            // travel time in seconds (default 0.9; use 0.8–1.6)
  tag?: string;            // short tag riding on the packet, max ~22 chars, e.g. "POST /webhooks"
  lost?: boolean | number; // the packet is dropped partway (red cross); number = fraction of the path
}
// Packet colours: request = orange, response = green, empty = white (an empty answer),
// message = yellow envelope (an event or message), secure = purple lock (signed/encrypted),
// heartbeat = green ring, row = a database row.

interface TokenRowDef {    // packets standing still in a row (a queue, a buffer, stored rows)
  at: string | XY;
  gap?: XY;                // offset between items, e.g. [26, 0]
  items: { kind: PacketKind; tag?: string; from?: number; until?: number }[];
}

interface LabelDef {       // a pill-shaped label inside the animation
  at: string | XY;
  text: string;
  icon?: "info" | "user" | "chat" | "clock" | "bolt" | "lock" | "globe" | "search" | "key" | "check" | "db" | "page";
  tone?: "plain" | "violet" | "green" | "orange" | "yellow" | "blue" | "muted";
  size?: number;           // default 15; don't change
  from?: number;           // appear time (s)
  until?: number;          // disappear time (s); omit to stay
}

interface LinkDef {        // a line/arrow drawn between two points
  from: string; to: string;
  style?: "solid" | "muted" | "dashed" | "pipe";  // pipe = thick green open connection
  from_t?: number;         // appear time (s)
  both?: boolean;          // arrowheads at both ends
}

interface StepDef {
  title: string;           // short, plain title (max ~40 chars)
  body: string;            // 3–5 sentences (see quality bar)
  note?: string;           // optional "good to know": one extra insight, real-world fact or interview tip
  links?: LinkDef[];
  packets?: PacketDef[];
  tokens?: TokenRowDef[];
  labels?: LabelDef[];
  focus?: string[];        // entity ids that get a pulsing highlight ring
  hold?: number;           // extra seconds to hold at the end (default 1.8)
}

interface LessonContent {
  slug: string;
  intro: string;           // 2–3 sentences shown under the lesson title
  learn: string[];         // 4–6 bullet points: "You'll learn"
  keyIdea: string;         // 2–3 sentences: the one thing to remember
  terms: { term: string; meaning: string }[];  // 4–8 key terms, one plain sentence each
  scene: SceneDef;         // use the scene given above, unchanged
  steps: StepDef[];        // 7–10 steps
  quiz: { q: string; options: string[]; answer: number; explain: string }[];  // 4–5 questions; answer = index from 0
  article: { heading: string; paragraphs: string[] }[];  // the written explanation (see below)
}
```

### How the animation behaves (design for this)

- Each step is a short scene of 3–7 seconds. Times are in seconds from the start of the step.
- The step **loops** until the learner clicks Next. On repeat plays, labels, links and token rows without
  `until` stay still; only packets (and labels with `until`) replay. So each step's packets should tell a
  small, repeatable story (e.g. provider sends event, server replies 200).
- Space packets so they don't overlap confusingly: a reply should start after the request arrives
  (`reply.at ≥ request.at + request.dur`).
- A step with nothing moving should still have a label or a `focus` and a `hold` of about 3.

## QUALITY BAR (mandatory; this is how the lesson will be checked)

Scene labels (pills inside the animation)
- Each label is a complete, plain-language phrase that makes sense on its own, e.g. "signature checks out".
  Max ~40 characters.
- No shorthand: never use "=", "·", "→" or "≈" in labels, no unexplained abbreviations, no analogy that the
  step text hasn't explained first.
- At most 3 labels visible at the same moment.
- Numbers carry units (ms, s, req/s, MB) and match the step text.

Step text
- 7–10 steps telling a story: the setup, the problem, how the mechanism works, a failure or edge case, the
  fix, trade-offs, a recap.
- Each step body is 3–5 sentences: what is happening, why it happens, and a concrete example with real
  numbers (e.g. "polling every 10 seconds for 5,000 orders is 30 million requests a week").
- Define every technical term the first time it appears, in everyday words, and list it in `terms`.
- If you use an analogy, introduce it in words in the body before any label relies on it.
- `note` is optional: one extra insight (real-world fact, common mistake or interview tip), not a repeat.

Written article (shown below the animation; also read by Google and AI assistants)
- 7–9 sections, **1,000–1,400 words in total** (count them; most first drafts are too short).
- Must include sections covering: a plain definition; how it works step by step; a worked example with
  numbers; common mistakes or misconceptions; trade-offs and when to use or avoid it; how it shows up in real
  systems (name real products, e.g. Stripe, GitHub, Shopify, Slack); how to talk about it in a system design
  interview.
- Short paragraphs, concrete numbers, no filler, no marketing tone.

Quiz and terms
- 4–5 questions, including at least two scenario questions ("Your server is down for 2 hours. What happens to
  the events?"). Every `explain` says why the right answer is right.
- `terms`: 4–8 terms, each one plain sentence.

Writing style
- Plain, friendly, direct English, written for a smart beginner. Short sentences. Active voice.
- No em-dash asides, no "not X but Y" constructions, no hype words. Use straight quotes inside strings
  correctly escaped for TypeScript (\" inside double-quoted strings).

## EXAMPLE OF ONE GOOD STEP (from another lesson, for tone and level of detail)

```ts
{
  title: "Busy: a line forms below full capacity",
  body:
    "Now 9 requests arrive per second. That's still less than the 10 the server can handle, yet a line forms. Why? Requests don't arrive evenly spaced; they come in clumps, like shoppers after a train arrives. When three land at once, two must wait. On average each request now waits about 0.9 seconds before it even starts, nine times longer than the work itself.",
  labels: [
    { at: "top", text: "9 requests arrive per second, in bursts", icon: "user", from: 0.2 },
    { at: "srvLabel", text: "busy 90% of the time", icon: "clock", tone: "orange", from: 0.6 },
    { at: "qLabel", text: "average wait before service: 0.9 s", icon: "clock", tone: "orange", from: 2.4 },
  ],
}
```

## BEFORE YOU ANSWER, CHECK

1. Slug is exactly `webhooks`; the scene is pasted unchanged; every point name you use exists in `points`.
2. 7–10 steps; every body has 3–5 sentences; no label contains "=", "·", "→" or "≈"; never more than 3
   labels visible at once.
3. Article has 7–9 sections and 1,000–1,400 words.
4. Quiz has 4–5 questions with correct `answer` indexes; 4–8 terms.
5. The file is valid TypeScript (escaped quotes, trailing commas fine) and ends with `export default lesson;`.
