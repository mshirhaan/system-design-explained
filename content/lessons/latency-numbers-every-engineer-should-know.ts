import type { LessonContent } from "@/components/scene/types";

const lesson: LessonContent = {
  slug: "latency-numbers-every-engineer-should-know",
  intro:
    "Reading memory and calling a server overseas differ by a factor of a million. Those numbers are too small to feel, so we stretch them: if one CPU step took a second, how long would everything else take?",
  learn: [
    "The rough cost of memory, SSD, network and cross-ocean calls",
    "How to make these numbers feel real with human time",
    "Why caching in memory is so powerful",
    "Why chatty calls across regions hurt",
  ],
  keyIdea:
    "Memory is fast, disks are slower, networks are much slower, and distance is the slowest of all. Good designs keep hot data in memory and keep round trips short and few.",
  scene: {
    viewBox: [-500, -235, 1000, 570],
    entities: [
      { id: "ssd", kind: "box", at: [-80, -70], w: 52, h: 26, color: "orange", name: "SSD" },
      { id: "ocean", kind: "box", at: [360, -40], w: 62, h: 72, color: "purple", text: ["far"], textSize: 15, name: "server across an ocean", nameOffset: [-30, 66] },
      { id: "code", kind: "box", at: [-300, 70], w: 72, h: 84, color: "blue", text: ["your", "code"], textSize: 16, name: "your server" },
      { id: "dc", kind: "box", at: [170, 190], w: 60, h: 70, color: "blue", text: ["near"], textSize: 15, name: "server, same datacenter" },
      { id: "ram", kind: "box", at: [-110, 230], w: 50, h: 22, color: "green", name: "memory (RAM)" },
    ],
    points: {
      codeR: [-238, 52],
      codeTop: [-280, -10],
      codeLow: [-260, 100],
      ram: [-110, 200],
      ssd: [-80, -100],
      dc: [130, 150],
      ocean: [310, -60],
      ramLabel: [-60, 140],
      ssdLabel: [-80, -190],
      dcLabel: [150, 70],
      oceanLabel: [330, -180],
      codeLabel: [-300, -110],
      scale: [60, 318],
    },
  },
  steps: [
    {
      title: "Your server and its neighbours",
      body:
        "Your code runs on a server. To do anything useful it reaches out: to memory, to its SSD, to other servers in the same datacenter and sometimes to servers on another continent. Each trip has a very different cost.",
      focus: ["code"],
      labels: [
        { at: "codeLabel", text: "1 CPU step ≈ 0.3 ns", icon: "bolt", from: 0.3 },
        { at: "scale", text: "let's pretend 1 CPU step = 1 second", icon: "clock", tone: "yellow", from: 1.2 },
      ],
      hold: 3,
    },
    {
      title: "Memory: ~100 nanoseconds",
      body:
        "Reading from RAM takes about 100 ns, a ten-millionth of a second. In our stretched time where a CPU step is one second, that's about 6 minutes: a coffee break.",
      links: [{ from: "codeLow", to: "ram", both: true }],
      packets: [
        { path: ["codeLow", "ram"], kind: "request", at: 0.3, dur: 0.5 },
        { path: ["ram", "codeLow"], kind: "response", at: 0.9, dur: 0.5 },
      ],
      labels: [{ at: "ramLabel", text: "100 ns  ≈  6 minutes", icon: "clock", tone: "green", from: 1.4 }],
    },
    {
      title: "SSD: ~100 microseconds",
      body:
        "A random read from a fast SSD takes about 100 µs, a thousand times slower than memory. In stretched time: about 4 days. Spinning hard disks are 100× slower again.",
      links: [{ from: "codeTop", to: "ssd", both: true }],
      packets: [
        { path: ["codeTop", "ssd"], kind: "request", at: 0.3, dur: 0.9 },
        { path: ["ssd", "codeTop"], kind: "response", at: 1.3, dur: 0.9 },
      ],
      labels: [{ at: "ssdLabel", text: "100 µs  ≈  4 days", icon: "clock", tone: "orange", from: 2.2 }],
    },
    {
      title: "Same datacenter: ~0.5 milliseconds",
      body:
        "A round trip to another server in the same datacenter, such as your database or a cache, takes about half a millisecond. Stretched: about 3 weeks.",
      links: [{ from: "codeR", to: "dc", both: true }],
      packets: [
        { path: ["codeR", "dc"], kind: "request", at: 0.3, dur: 1.3 },
        { path: ["dc", "codeR"], kind: "response", at: 1.7, dur: 1.3 },
      ],
      labels: [{ at: "dcLabel", text: "0.5 ms  ≈  3 weeks", icon: "clock", tone: "blue", from: 3 }],
    },
    {
      title: "Across an ocean: ~150 milliseconds",
      body:
        "A round trip from Europe to the US west coast takes around 150 ms, limited by the speed of light in fibre. Stretched: about 16 years. No amount of money makes light faster.",
      links: [{ from: "codeR", to: "ocean", both: true }],
      packets: [
        { path: ["codeR", "ocean"], kind: "request", at: 0.3, dur: 3 },
        { path: ["ocean", "codeR"], kind: "response", at: 3.4, dur: 3 },
      ],
      labels: [{ at: "oceanLabel", text: "150 ms  ≈  16 years", icon: "clock", tone: "violet", from: 6.4 }],
    },
    {
      title: "All together",
      body:
        "Side by side, the gaps are enormous: minutes, days, weeks, years. Reading 1 MB from memory is faster than a single round trip to the next server. That's why so many designs revolve around keeping data close.",
      packets: [
        { path: ["codeLow", "ram"], kind: "request", at: 0.2, dur: 0.5 },
        { path: ["codeTop", "ssd"], kind: "request", at: 0.2, dur: 0.9 },
        { path: ["codeR", "dc"], kind: "request", at: 0.2, dur: 1.3 },
        { path: ["codeR", "ocean"], kind: "request", at: 0.2, dur: 3 },
      ],
      labels: [
        { at: "ramLabel", text: "≈ 6 min", icon: "clock", tone: "green", from: 0.7 },
        { at: "ssdLabel", text: "≈ 4 days", icon: "clock", tone: "orange", from: 1.1 },
        { at: "dcLabel", text: "≈ 3 weeks", icon: "clock", tone: "blue", from: 1.5 },
        { at: "oceanLabel", text: "≈ 16 years", icon: "clock", tone: "violet", from: 3.2 },
      ],
    },
    {
      title: "What this means for design",
      body:
        "Keep hot data in memory with a cache. Batch small calls into big ones instead of making many round trips. Put servers near users, and avoid cross-region calls on the critical path of a request.",
      note: "In interviews, quoting these orders of magnitude when you justify a cache or a CDN is a strong signal.",
      focus: ["code"],
      labels: [
        { at: "ramLabel", text: "cache it in memory", icon: "bolt", tone: "green", from: 0.3 },
        { at: "dcLabel", text: "batch, don't chat", icon: "chat", tone: "blue", from: 1 },
        { at: "oceanLabel", text: "move servers to users", icon: "globe", tone: "violet", from: 1.7 },
      ],
      hold: 3,
    },
  ],
  quiz: [
    {
      q: "Roughly how much slower is a same-datacenter network round trip than a memory read?",
      options: ["About the same", "About 5,000 times slower", "10 times slower", "A million times slower"],
      answer: 1,
      explain: "100 ns vs 500 µs is a factor of about 5,000. That gap is why in-memory caches pay off so well.",
    },
    {
      q: "Why can't you make a London–San Francisco round trip much faster than ~150 ms?",
      options: ["Old routers", "The speed of light in fibre over that distance", "HTTP overhead", "DNS"],
      answer: 1,
      explain: "Physics sets the floor. The only real fix is to move the data or the server closer to the user.",
    },
    {
      q: "A page makes 40 sequential calls to a service in another region. What's the best fix?",
      options: ["Buy faster CPUs", "Batch the calls into one, or move the service closer", "Use a bigger SSD", "Add more RAM to the browser"],
      answer: 1,
      explain: "40 × 150 ms is 6 seconds of pure waiting. Fewer, closer round trips are the cure.",
    },
  ],
  article: [
    {
      heading: "The numbers",
      paragraphs: [
        "These are rough orders of magnitude, and exact values vary by hardware: a CPU cycle is about 0.3 ns; an L1 cache read about 1 ns; a main-memory read about 100 ns; reading 1 MB sequentially from memory about 10–50 µs; a random SSD read about 100 µs; a round trip within a datacenter about 0.5 ms; a hard-disk seek about 5–10 ms; and a round trip between continents about 100–150 ms.",
        "You don't need to memorise exact figures. What matters is the ladder: each step down is 10× to 1,000× slower than the one above.",
      ],
    },
    {
      heading: "Making them feel real",
      paragraphs: [
        "Scale everything so one CPU cycle takes a second. A memory read becomes about 6 minutes, an SSD read about 4 days, a datacenter round trip about 3 weeks, and a cross-ocean round trip about 16 years. Suddenly it's obvious why a design that makes ten network calls per request is slow, however fast the code is.",
      ],
    },
    {
      heading: "Design consequences",
      paragraphs: [
        "Caching: serving hot data from memory (in-process or in Redis) avoids disk and network trips. Batching: one request for 100 items beats 100 requests. Locality: CDNs and multi-region deployments put data near users. Asynchrony: work that doesn't need to finish before the response can be pushed to a queue.",
        "Latency also adds up through layers. A request that calls service A, which calls B, which queries a database, pays every round trip in sequence. Drawing that chain and adding up the numbers is a quick way to check whether a design can meet its latency target.",
      ],
    },
  ],
};

export default lesson;
