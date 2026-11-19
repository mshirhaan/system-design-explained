import type { LessonContent } from "@/components/scene/types";

const arrive = ["users", "qTail"];
const serve = ["q0", "srv"];

const queue = (times: number[], untils: (number | undefined)[] = []) => ({
  at: "q0",
  gap: [-26, 13] as [number, number],
  items: times.map((t, i) => ({ kind: "request" as const, from: t, until: untils[i] })),
});

const lesson: LessonContent = {
  slug: "throughput-bandwidth-and-queues",
  intro:
    "A server that answers in 100 ms can still make users wait seconds. When requests arrive faster than they're served, a queue forms, and as the server gets close to full, waiting time explodes.",
  learn: [
    "The difference between latency, throughput and bandwidth",
    "Why queues form even below full capacity",
    "Why waiting time explodes as utilisation nears 100%",
    "Little's law, and how to use it",
    "The three ways out: more capacity, faster work, less load",
  ],
  keyIdea:
    "Latency is how long one request takes; throughput is how many finish per second. When arrivals approach throughput, queues grow and waiting dominates. Keep systems comfortably below full.",
  scene: {
    viewBox: [-500, -235, 1000, 570],
    entities: [
      { id: "crowd", kind: "slab", at: [-320, 150], w: 150, h: 12, name: "users", nameIcon: "user" },
      { id: "p1", kind: "phone", at: [-360, 118] },
      { id: "p2", kind: "phone", at: [-310, 143] },
      { id: "p3", kind: "phone", at: [-260, 168] },
      { id: "server", kind: "box", at: [280, 40], w: 84, h: 100, color: "blue", text: ["Server"], textSize: 18, name: "10 requests / second" },
    ],
    points: {
      users: [-222, 110],
      q0: [175, 85],
      qTail: [20, 162],
      srv: [212, 10],
      srvLabel: [280, -150],
      usersLabel: [-320, -40],
      qLabel: [10, 260],
      law: [-40, -170],
    },
  },
  steps: [
    {
      title: "Latency vs throughput",
      body:
        "Latency is how long one request takes: here 100 ms. Throughput is how many requests the server completes per second: 10. They're related but not the same. A system can have low latency and still be overwhelmed by volume.",
      focus: ["server"],
      links: [{ from: "users", to: "srv", both: true }],
      packets: [
        { path: ["users", "srv"], kind: "request", at: 0.3, dur: 1.5 },
        { path: ["srv", "users"], kind: "response", at: 2.1, dur: 1.5 },
      ],
      labels: [
        { at: "srvLabel", text: "latency: 100 ms each", icon: "clock", from: 0.3 },
        { at: "usersLabel", text: "throughput: 10 / s", icon: "bolt", tone: "yellow", from: 1.6 },
      ],
    },
    {
      title: "Bandwidth: the width of the pipe",
      body:
        "Bandwidth is how much data a link can carry per second, say 100 Mbit/s. A wide pipe lets lots of data flow at once, but it doesn't make any single trip faster. Latency is the pipe's length; bandwidth is its width.",
      links: [{ from: "users", to: "srv", style: "pipe" }],
      packets: [0, 1, 2, 3, 4, 5].map((i) => ({ path: ["users", "srv"], kind: "message" as const, at: 0.2 + i * 0.25, dur: 1.6 })),
      labels: [{ at: "law", text: "bandwidth = width · latency = length", icon: "bolt", tone: "muted", from: 0.3 }],
    },
    {
      title: "Light traffic: no waiting",
      body:
        "5 requests arrive per second and the server can do 10. It's busy half the time. Most requests find it free and are served straight away. The queue stays empty.",
      links: [{ from: "users", to: "srv", style: "muted" }],
      packets: [0, 1, 2, 3].map((i) => ({ path: ["users", "q0", "srv"], kind: "request" as const, at: 0.2 + i * 1.3, dur: 1.2 })),
      labels: [
        { at: "srvLabel", text: "50% busy", icon: "check", tone: "green", from: 0.2 },
        { at: "qLabel", text: "queue: 0 · wait ≈ 0", icon: "clock", tone: "green", from: 0.5 },
      ],
    },
    {
      title: "Busy: a queue forms",
      body:
        "Now 9 requests arrive per second. That's still below 10, yet a queue builds. Arrivals are bursty: several land at once, and the server can only take one at a time. The rest wait in line.",
      links: [{ from: "users", to: "qTail", style: "muted" }],
      packets: [
        ...[0.2, 0.5, 0.7, 1.3, 1.6, 1.8].map((t) => ({ path: arrive, kind: "request" as const, at: t, dur: 1 })),
        ...[1.4, 2.4, 3.4].map((t) => ({ path: serve, kind: "request" as const, at: t, dur: 0.5 })),
      ],
      tokens: [queue([1.2, 1.5, 1.7, 2.3, 2.6, 2.8], [2.4, 3.4, 4.4])],
      labels: [
        { at: "srvLabel", text: "90% busy", icon: "clock", tone: "orange", from: 0.2 },
        { at: "qLabel", text: "queue grows · wait ≈ 0.9 s", icon: "clock", tone: "orange", from: 2.4 },
      ],
    },
    {
      title: "Overloaded: waits explode",
      body:
        "At 12 requests per second, more arrive than can ever be served. The queue grows without limit. Users wait seconds, requests time out, and retries make it worse. This is how outages start.",
      note: "Waiting time rises gently at first, then shoots up as utilisation nears 100%. Going from 80% to 95% busy can multiply waits several times.",
      links: [{ from: "users", to: "qTail", style: "muted" }],
      packets: [
        ...[0.1, 0.3, 0.5, 0.8, 1, 1.2, 1.5, 1.7].map((t) => ({ path: arrive, kind: "request" as const, at: t, dur: 1 })),
        { path: arrive, kind: "request", at: 2.3, dur: 1.2, lost: 0.85, tag: "timeout" },
        { path: arrive, kind: "request", at: 2.7, dur: 1.2, lost: 0.85, tag: "timeout" },
      ],
      tokens: [queue([1.1, 1.3, 1.5, 1.8, 2, 2.2, 2.5, 2.7])],
      labels: [
        { at: "srvLabel", text: "100% busy", icon: "bolt", tone: "orange", from: 0.2 },
        { at: "qLabel", text: "queue never drains", icon: "clock", tone: "orange", from: 2.2 },
      ],
    },
    {
      title: "Little's law",
      body:
        "One simple rule ties it together: the number of requests in the system equals the arrival rate times the time each spends there. 10 per second, each spending 0.5 s, means 5 requests in flight on average. Use it to size queues, threads and connection pools.",
      links: [{ from: "users", to: "qTail", style: "muted" }],
      tokens: [queue([0.3, 0.6, 0.9, 1.2, 1.5])],
      labels: [
        { at: "law", text: "in system = arrival rate × time inside", icon: "bolt", tone: "violet", from: 0.2, size: 16 },
        { at: "qLabel", text: "10 /s × 0.5 s = 5 inside", icon: "check", tone: "violet", from: 1.8 },
      ],
      hold: 3,
    },
    {
      title: "The three ways out",
      body:
        "When queues grow, you have three levers: add capacity (more servers), make each request cheaper (caching, better queries), or reduce or smooth the load (rate limits, shedding low-priority work, queues for background jobs).",
      focus: ["server"],
      labels: [
        { at: "srvLabel", text: "add servers", icon: "bolt", tone: "green", from: 0.3 },
        { at: "law", text: "make each request faster", icon: "clock", tone: "blue", from: 1 },
        { at: "usersLabel", text: "limit or shed load", icon: "user", tone: "yellow", from: 1.7 },
      ],
      hold: 3,
    },
  ],
  quiz: [
    {
      q: "A server handles 10 requests per second. 9 arrive per second. Will requests ever wait?",
      options: ["Never, it's under capacity", "Yes: arrivals are bursty, so queues form even below capacity", "Only if the network is slow", "Only on weekends"],
      answer: 1,
      explain: "Random arrivals bunch up. At 90% utilisation, queueing is common and waits can be several times the service time.",
    },
    {
      q: "Using Little's law: 200 requests/s arrive and each spends 0.1 s in the system. How many are in the system on average?",
      options: ["2", "20", "200", "2,000"],
      answer: 1,
      explain: "L = λ × W = 200 × 0.1 = 20. That's roughly how many threads or connections you need busy at once.",
    },
    {
      q: "Which statement is true?",
      options: [
        "More bandwidth always lowers latency",
        "Latency is per request; throughput is requests per unit time",
        "Throughput and latency are the same thing",
        "Queues only form above 100% utilisation",
      ],
      answer: 1,
      explain: "They measure different things. A wider pipe raises throughput but doesn't shorten each trip.",
    },
  ],
  article: [
    {
      heading: "Latency, throughput and bandwidth",
      paragraphs: [
        "Latency is the time for one operation to complete, such as 100 ms for a request. Throughput is the rate of completed operations, such as 10 requests per second. Bandwidth is a link's maximum data rate, such as 1 Gbit/s. Bandwidth caps throughput for data-heavy work; latency decides how responsive each action feels.",
      ],
    },
    {
      heading: "Why queues form",
      paragraphs: [
        "Requests don't arrive evenly; they come in bursts. While the server is busy with one request, others wait. The fraction of time a server is busy is its utilisation. Queueing theory shows that average waiting time grows slowly at low utilisation and then explodes as utilisation approaches 100%. For a simple single-server queue, waiting time is proportional to u / (1 − u): at 50% busy that's 1×, at 90% it's 9×, at 99% it's 99×.",
        "That's why production systems are usually run at 50–70% of capacity, leaving headroom for bursts and failures.",
      ],
    },
    {
      heading: "Little's law",
      paragraphs: [
        "Little's law states L = λ × W: the average number of items in a system (L) equals the arrival rate (λ) times the average time each spends in it (W). It holds for any stable system. If a service receives 500 requests per second and each takes 40 ms, about 20 are in progress at any moment, so a pool of 20 workers is the bare minimum, and you'd plan for more.",
      ],
    },
    {
      heading: "Handling overload",
      paragraphs: [
        "When arrivals exceed capacity for long, queues grow without bound and latency becomes unacceptable. Remedies: scale out (more servers), speed up the work (caches, indexes, less work per request), limit input (rate limiting, load shedding, backpressure) and move non-urgent work to background queues. Timeouts and bounded queues are essential: an unbounded queue just converts overload into very slow failure.",
      ],
    },
  ],
};

export default lesson;
