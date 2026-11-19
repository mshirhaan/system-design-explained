import type { LessonContent } from "@/components/scene/types";

const arrive = ["users", "qTail"];
const serve = ["q0", "srv"];
const direct = ["users", "srv"];

const queue = (times: number[], untils: (number | undefined)[] = []) => ({
  at: "q0",
  gap: [-26, 13] as [number, number],
  items: times.map((t, i) => ({ kind: "request" as const, from: t, until: untils[i] })),
});

const lesson: LessonContent = {
  slug: "throughput-bandwidth-and-queues",
  intro:
    "A server that answers in 100 ms can still leave users waiting for seconds. This lesson separates three ideas that are often mixed up (latency, throughput and bandwidth), then shows how waiting lines form and why they grow so fast when a server gets busy.",
  learn: [
    "The difference between latency, throughput and bandwidth, with everyday examples",
    "Why a wider network link doesn't make each trip faster",
    "Why a waiting line forms even when a server isn't fully busy",
    "Why waiting time shoots up as a server approaches 100% busy",
    "Little's law: a one-line formula for sizing systems",
    "The three ways to fix an overloaded system",
  ],
  keyIdea:
    "Latency is how long one request takes. Throughput is how many requests finish per second. Bandwidth is how much data a link can carry per second. When requests arrive almost as fast as a server can handle them, a waiting line forms and waiting time, not work, becomes most of what users feel.",
  terms: [
    { term: "Latency", meaning: "How long a single request takes from start to finish, measured in milliseconds (ms)." },
    { term: "Throughput", meaning: "How many requests a system finishes per second (req/s)." },
    { term: "Bandwidth", meaning: "The most data a network link can carry per second, such as 100 megabits per second." },
    { term: "Utilisation", meaning: "The share of time a server is busy. 90% utilisation means it's idle only 1 second in 10." },
    { term: "Queue", meaning: "A waiting line of requests that have arrived but haven't started being served yet." },
    { term: "Timeout", meaning: "A limit on how long a client waits before giving up on a request." },
    { term: "Little's law", meaning: "Requests inside a system = arrival rate × time each one spends inside." },
  ],
  scene: {
    viewBox: [-500, -235, 1000, 570],
    entities: [
      { id: "crowd", kind: "slab", at: [-320, 150], w: 150, h: 12, name: "users", nameIcon: "user" },
      { id: "p1", kind: "phone", at: [-360, 118] },
      { id: "p2", kind: "phone", at: [-310, 143] },
      { id: "p3", kind: "phone", at: [-260, 168] },
      { id: "server", kind: "box", at: [280, 40], w: 84, h: 100, color: "blue", text: ["Server"], textSize: 18, name: "handles 10 requests per second", nameOffset: [60, 76] },
    ],
    points: {
      users: [-222, 110],
      q0: [175, 85],
      qTail: [20, 162],
      srv: [212, 10],
      srvLabel: [280, -150],
      usersLabel: [-320, -40],
      top: [-30, -185],
      mid: [-30, -140],
      low: [-30, -95],
      qLabel: [10, 262],
    },
  },
  steps: [
    {
      title: "Latency: how long one request takes",
      body:
        "Start with a single request. Your phone sends it, the server works on it, and the answer comes back. The total time this takes is called latency. Here it's 100 milliseconds (ms), a tenth of a second. Latency is what one user feels when they tap a button and wait.",
      focus: ["server"],
      links: [{ from: "users", to: "srv", both: true }],
      packets: [
        { path: direct, kind: "request", at: 0.3, dur: 1.5 },
        { path: ["srv", "users"], kind: "response", at: 2.1, dur: 1.5 },
      ],
      labels: [{ at: "top", text: "one request takes 100 ms, start to finish", icon: "clock", from: 0.3 }],
    },
    {
      title: "Throughput: how many finish per second",
      body:
        "Now look at the server over a whole second. It can finish 10 requests every second, one after another. That rate is called throughput. Latency answers \"how long does one take?\"; throughput answers \"how many can we handle?\". A system can be quick for one user and still fall over when thousands arrive.",
      focus: ["server"],
      links: [{ from: "users", to: "srv" }],
      packets: [0, 1, 2, 3, 4, 5].map((i) => ({ path: direct, kind: "request" as const, at: 0.2 + i * 0.55, dur: 1.4 })),
      labels: [
        { at: "top", text: "throughput: 10 requests finished per second", icon: "bolt", tone: "yellow", from: 0.2 },
        { at: "mid", text: "each one still takes 100 ms", icon: "clock", from: 1.6 },
      ],
    },
    {
      title: "Bandwidth: a narrow link",
      body:
        "Bandwidth is about the network link, not the server. Think of the link as a road. Bandwidth is the number of lanes: how many cars (packets) can be on the road at once. Latency is how long the drive takes. On this narrow link only 2 packets fit on the road at a time.",
      links: [{ from: "users", to: "srv", style: "muted" }],
      packets: [0, 1, 2, 3].map((i) => ({ path: direct, kind: "message" as const, at: 0.2 + i * 1.5, dur: 3 })),
      labels: [
        { at: "top", text: "narrow link: 2 packets on the way at once", icon: "info", from: 0.2 },
        { at: "mid", text: "each packet takes 3 s to cross", icon: "clock", from: 1 },
      ],
    },
    {
      title: "Bandwidth: a wide link",
      body:
        "Now the road has more lanes: 6 packets can travel at once, so three times as much data arrives per second. But look closely: each packet still takes exactly 3 seconds to cross. More bandwidth moves more data per second; it does not make any single trip faster. Only shorter distances or fewer trips cut latency.",
      links: [{ from: "users", to: "srv", style: "pipe" }],
      packets: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => ({ path: direct, kind: "message" as const, at: 0.2 + i * 0.5, dur: 3 })),
      labels: [
        { at: "top", text: "wide link: 6 packets on the way at once", icon: "bolt", tone: "green", from: 0.2 },
        { at: "mid", text: "each packet still takes 3 s to cross", icon: "clock", from: 1 },
      ],
    },
    {
      title: "Light traffic: nobody waits",
      body:
        "Back to the server. Think of it as a single supermarket checkout that serves 10 customers a minute. If 5 arrive per minute, the checkout is busy half the time, and that share is called utilisation. Almost everyone walks straight up and gets served. Here, 5 requests arrive per second and none has to wait.",
      links: [{ from: "users", to: "srv", style: "muted" }],
      packets: [0, 1, 2, 3].map((i) => ({ path: ["users", "q0", "srv"], kind: "request" as const, at: 0.2 + i * 1.3, dur: 1.2 })),
      labels: [
        { at: "top", text: "5 requests arrive per second", icon: "user", from: 0.2 },
        { at: "srvLabel", text: "busy half the time (50%)", icon: "check", tone: "green", from: 0.6 },
        { at: "qLabel", text: "nobody waits in line", icon: "check", tone: "green", from: 1.2 },
      ],
    },
    {
      title: "Busy: a line forms below full capacity",
      body:
        "Now 9 requests arrive per second. That's still less than the 10 the server can handle, yet a line forms. Why? Requests don't arrive evenly spaced; they come in clumps, like shoppers after a train arrives. When three land at once, two must wait. On average each request now waits about 0.9 seconds before it even starts, nine times longer than the work itself.",
      links: [{ from: "users", to: "qTail", style: "muted" }],
      packets: [
        ...[0.2, 0.5, 0.7, 1.3, 1.6, 1.8].map((t) => ({ path: arrive, kind: "request" as const, at: t, dur: 1 })),
        ...[1.4, 2.4, 3.4].map((t) => ({ path: serve, kind: "request" as const, at: t, dur: 0.5 })),
      ],
      tokens: [queue([1.2, 1.5, 1.7, 2.3, 2.6, 2.8], [2.4, 3.4, 4.4])],
      labels: [
        { at: "top", text: "9 requests arrive per second, in bursts", icon: "user", from: 0.2 },
        { at: "srvLabel", text: "busy 90% of the time", icon: "clock", tone: "orange", from: 0.6 },
        { at: "qLabel", text: "average wait before service: 0.9 s", icon: "clock", tone: "orange", from: 2.4 },
      ],
    },
    {
      title: "Overloaded: the line never shrinks",
      body:
        "At 12 requests per second, more arrive than the server can ever finish. The line grows by about 2 requests every second, forever. Users wait longer and longer, then their apps give up (a timeout) and often retry, which adds even more requests. This is how many real outages begin.",
      links: [{ from: "users", to: "qTail", style: "muted" }],
      packets: [
        ...[0.1, 0.3, 0.5, 0.8, 1, 1.2, 1.5, 1.7].map((t) => ({ path: arrive, kind: "request" as const, at: t, dur: 1 })),
        { path: arrive, kind: "request", at: 2.3, dur: 1.2, lost: 0.85, tag: "gave up" },
        { path: arrive, kind: "request", at: 2.7, dur: 1.2, lost: 0.85, tag: "gave up" },
      ],
      tokens: [queue([1.1, 1.3, 1.5, 1.8, 2, 2.2, 2.5, 2.7])],
      labels: [
        { at: "top", text: "12 arrive per second, only 10 served", icon: "user", tone: "orange", from: 0.2 },
        { at: "qLabel", text: "the line grows by 2 every second", icon: "clock", tone: "orange", from: 2.2 },
      ],
    },
    {
      title: "Why waiting explodes near 100%",
      body:
        "Here are the average waits for this server (each request needs 0.1 s of work) at different levels of busyness. From 50% to 80% busy, the wait barely moves. From 90% to 99%, it jumps tenfold. That curve is why well-run systems keep servers around 50–70% busy: the spare room absorbs bursts.",
      note: "These numbers come from the classic single-server queue formula: wait = work time × busy ÷ (1 − busy). You don't need the formula, just the shape: gentle, then a cliff.",
      focus: ["server"],
      labels: [
        { at: "top", text: "50% busy: wait about 0.1 s", icon: "check", tone: "green", from: 0.3 },
        { at: "mid", text: "90% busy: wait about 0.9 s", icon: "clock", tone: "orange", from: 1.2 },
        { at: "low", text: "99% busy: wait about 9.9 s", icon: "info", tone: "orange", from: 2.1 },
      ],
      hold: 3.5,
    },
    {
      title: "Little's law: a sizing shortcut",
      body:
        "One simple rule links these ideas: the number of requests inside a system equals the arrival rate times how long each one stays. If 10 requests arrive per second and each spends 0.5 seconds inside (waiting plus work), then on average 5 are inside at any moment. Engineers use this to size thread pools, connection pools and queues.",
      links: [{ from: "users", to: "qTail", style: "muted" }],
      tokens: [queue([0.3, 0.6, 0.9, 1.2, 1.5])],
      labels: [
        { at: "top", text: "10 per second arrive", icon: "user", from: 0.2 },
        { at: "mid", text: "each stays 0.5 s", icon: "clock", from: 1 },
        { at: "qLabel", text: "so about 5 are inside at once", icon: "check", tone: "violet", from: 1.8 },
      ],
      hold: 3,
    },
    {
      title: "The three ways out",
      body:
        "When lines grow, you have three levers. Add capacity: more servers behind a load balancer. Make each request cheaper: caching, better database indexes, less work per request. Reduce or smooth the load: rate limits, rejecting low-priority work during spikes, or moving slow jobs to a background queue.",
      note: "Always set timeouts and a maximum line length. An unlimited line just turns overload into very slow failure for everyone.",
      focus: ["server"],
      labels: [
        { at: "top", text: "add more servers", icon: "bolt", tone: "green", from: 0.3 },
        { at: "mid", text: "make each request faster", icon: "clock", tone: "blue", from: 1 },
        { at: "low", text: "limit or smooth incoming load", icon: "user", tone: "yellow", from: 1.7 },
      ],
      hold: 3,
    },
  ],
  quiz: [
    {
      q: "Your API answers in 80 ms and handles 500 requests per second. Which number is the latency?",
      options: ["500 requests per second", "80 ms", "Both", "Neither"],
      answer: 1,
      explain: "Latency is the time for one request (80 ms). 500 per second is throughput, the rate at which requests are finished.",
    },
    {
      q: "You upgrade a link from 100 Mbit/s to 1 Gbit/s. What happens to the time for one small request to cross it?",
      options: ["It becomes 10 times faster", "It stays about the same: bandwidth adds capacity, not speed per trip", "It becomes slower", "It depends on the server's CPU"],
      answer: 1,
      explain: "More lanes let more data through per second, but each trip still takes as long as the distance requires. Large downloads finish sooner; small requests barely change.",
    },
    {
      q: "A server can handle 10 requests per second and receives 9 per second. Will requests wait?",
      options: ["Never, it's below capacity", "Yes: arrivals come in bursts, so a line often forms at 90% busy", "Only if the network is slow", "Only during deployments"],
      answer: 1,
      explain: "Real traffic is uneven. At 90% utilisation the average wait is already several times the work time.",
    },
    {
      q: "Using Little's law: 200 requests arrive per second and each spends 0.1 s in the system. About how many are inside at once?",
      options: ["2", "20", "200", "2,000"],
      answer: 1,
      explain: "Inside = arrival rate × time inside = 200 × 0.1 = 20. You'd need at least 20 workers or connections busy at once.",
    },
    {
      q: "Traffic doubles and response times jump from 0.2 s to 6 s. Which fix does NOT directly help?",
      options: ["Adding servers", "Caching popular responses", "Rate-limiting heavy clients", "Raising the client timeout to 60 s"],
      answer: 3,
      explain: "A longer timeout just lets the line grow further. The other three add capacity, cut work per request or reduce load.",
    },
  ],
  article: [
    {
      heading: "Latency, throughput and bandwidth in plain words",
      paragraphs: [
        "These three words are often used as if they mean the same thing. They don't. Latency is how long one request takes, end to end, for example 100 ms. Throughput is how many requests a system completes per second, for example 10 requests per second. Bandwidth is the maximum amount of data a network link can carry per second, for example 1 gigabit per second.",
        "A useful picture is a road. Bandwidth is the number of lanes. Latency is how long the drive takes. Throughput is how many cars reach the destination per hour. Adding lanes lets more cars arrive per hour, but each car's drive takes just as long.",
      ],
    },
    {
      heading: "Why more bandwidth doesn't fix slowness",
      paragraphs: [
        "If a page feels slow because it makes 30 small requests to a server 150 ms away, upgrading the link from 100 Mbit/s to 1 Gbit/s barely helps: each request still takes 150 ms to make the round trip. The fixes are fewer requests (batching), shorter distance (a CDN or a nearby region) or not needing the request at all (caching). Bandwidth matters for big transfers such as video, backups and large downloads, where the time spent pushing bytes dominates.",
      ],
    },
    {
      heading: "How a waiting line forms",
      paragraphs: [
        "A server can only work on so much at once. When a request arrives and the server is busy, the request waits in a queue. The fraction of time the server is busy is its utilisation. If a server can do 10 requests per second and receives 5, its utilisation is 50%.",
        "You might expect no waiting until utilisation hits 100%. In reality, requests arrive unevenly: a push notification goes out, a train pulls in, a page goes viral. Bursts arrive faster than average, so lines form even when the average load is below capacity, then drain during quiet moments.",
      ],
    },
    {
      heading: "Worked example: when waits explode",
      paragraphs: [
        "Take a server where each request needs 0.1 s of work. Using the standard single-server queue model, the average time spent waiting in line is the work time × u ÷ (1 − u), where u is utilisation. At 50% busy: 0.1 × 0.5 ÷ 0.5 = 0.1 s. At 80%: 0.4 s. At 90%: 0.9 s. At 95%: 1.9 s. At 99%: 9.9 s.",
        "Notice the shape. Waiting grows slowly at first, then shoots up as the server approaches full. Going from 90% to 99% busy feels like a small change in load but makes users wait ten times longer. This is why capacity planning aims to keep servers around 50–70% busy at normal peak.",
      ],
    },
    {
      heading: "Little's law",
      paragraphs: [
        "Little's law says that the average number of items in a system equals the arrival rate multiplied by the average time each item spends in the system. It works for any stable system: a shop, a call centre or a web service.",
        "Example: a service receives 500 requests per second and each takes 40 ms (0.04 s) including waiting. 500 × 0.04 = 20, so on average 20 requests are in progress. If each needs a database connection, a pool of 10 connections is too small; plan for 20 plus headroom. Turn it around and you can work out latency: if 50 requests are always inside and 1,000 arrive per second, each spends 50 ÷ 1,000 = 0.05 s inside.",
      ],
    },
    {
      heading: "Common mistakes",
      paragraphs: [
        "Confusing bandwidth with speed: a faster link doesn't shorten round trips. Planning for average load: averages hide the bursts that cause lines, so plan for peaks. Running servers near 100% \"to save money\": you pay it back in latency and outages. Unlimited queues and no timeouts: overload turns into very slow requests for everyone instead of quick, clear errors for a few. Retrying instantly on timeout: retries add load exactly when the system is already overloaded.",
      ],
    },
    {
      heading: "What to do when a system is overloaded",
      paragraphs: [
        "There are three levers. Add capacity: more servers behind a load balancer, or bigger machines. Make each request cheaper: cache results, add database indexes, do less work per request. Reduce or smooth the load: rate-limit heavy clients, shed low-priority work during spikes, and move slow jobs such as emails and image processing onto a background queue.",
        "Real systems also protect themselves with timeouts, bounded queues and backpressure, which means telling callers to slow down instead of silently accepting more work than they can handle.",
      ],
    },
    {
      heading: "Where you'll see this in real systems",
      paragraphs: [
        "Load balancers such as Nginx, HAProxy and cloud load balancers keep a queue of pending connections and report how long requests wait; that number rising is often the first sign of trouble. Databases have connection pools sized with Little's law, and when the pool is exhausted, requests queue inside the application. Message queues like RabbitMQ, Amazon SQS and Kafka are deliberate queues: they let a burst of work pile up safely so background workers can process it at their own pace.",
        "Cloud autoscaling watches utilisation (for example, \"add a server when CPU stays above 65%\") precisely because waiting time climbs so steeply near 100%. And monitoring dashboards track the 99th-percentile latency, not just the average, because queues hurt the unluckiest requests first.",
      ],
    },
    {
      heading: "In a system design interview",
      paragraphs: [
        "Use these ideas when you estimate capacity. State the expected peak requests per second, the time per request, and use Little's law to estimate how many servers, threads or connections you need. Mention that you'd target around 60–70% utilisation at peak to leave room for bursts, and that you'd add rate limiting and timeouts so overload fails gracefully. Interviewers listen for this kind of reasoning: it shows you understand that systems fail from waiting, not just from slow code.",
      ],
    },
  ],
};

export default lesson;
