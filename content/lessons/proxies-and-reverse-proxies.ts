import type { LessonContent } from "@/components/scene/types";

const viaFwd = ["lap", "fp", "fp2", "net"];
const toApp = (n: 1 | 2 | 3) => ["net", "rp", "rp2", `s${n}`];
const fromApp = (n: 1 | 2 | 3) => [`s${n}`, "rp2", "rp", "net"];
const baseLinks = [
  { from: "lap", to: "fp", style: "muted" as const },
  { from: "ph", to: "fp", style: "muted" as const },
  { from: "fp2", to: "net", style: "muted" as const },
  { from: "net", to: "rp", style: "muted" as const },
  { from: "rp2", to: "s1", style: "muted" as const },
  { from: "rp2", to: "s2", style: "muted" as const },
  { from: "rp2", to: "s3", style: "muted" as const },
];

const lesson: LessonContent = {
  slug: "proxies-and-reverse-proxies",
  intro:
    "Between you and a website there's often a middleman. A forward proxy speaks for a group of users; a reverse proxy speaks for a group of servers. Watch what each one hides, blocks, caches and spreads.",
  learn: [
    "What a proxy is",
    "What a forward proxy does for clients",
    "What a reverse proxy does for servers",
    "How reverse proxies spread load, end TLS and cache responses",
  ],
  keyIdea:
    "A proxy is a middleman that forwards requests. A forward proxy sits with the clients and hides them; a reverse proxy sits with the servers and hides them. Almost every large website sits behind a reverse proxy.",
  scene: {
    viewBox: [-500, -235, 1000, 570],
    entities: [
      { id: "s1", kind: "box", at: [340, -50], w: 44, h: 50, color: "blue", name: "app 1", nameOffset: [56, 0] },
      { id: "phSlab", kind: "slab", at: [-390, 40], w: 72, h: 12 },
      { id: "phone", kind: "phone", at: [-390, 28], name: "office phone", nameOffset: [0, 54] },
      { id: "fwd", kind: "box", at: [-170, 120], w: 56, h: 56, color: "orange", icon: "key", name: "forward proxy" },
      { id: "net", kind: "router", at: [0, 150], name: "internet" },
      { id: "rev", kind: "box", at: [170, 100], w: 60, h: 60, color: "green", icon: "bolt", name: "reverse proxy" },
      { id: "s2", kind: "box", at: [390, 90], w: 44, h: 50, color: "blue", name: "app 2", nameOffset: [0, 56] },
      { id: "desk", kind: "slab", at: [-380, 232], w: 110, h: 14, name: "office laptop", nameIcon: "user" },
      { id: "laptop", kind: "laptop", at: [-380, 218] },
      { id: "s3", kind: "box", at: [340, 230], w: 44, h: 50, color: "blue", name: "app 3", nameOffset: [56, 0] },
    ],
    points: {
      lap: [-298, 172],
      ph: [-358, -14],
      fp: [-210, 100],
      fp2: [-130, 100],
      net: [0, 132],
      rp: [120, 85],
      rp2: [215, 70],
      s1: [310, -60],
      s2: [355, 80],
      s3: [310, 215],
      fpLabel: [-170, -10],
      rpLabel: [160, -40],
      siteLabel: [330, -170],
      netLabel: [0, 255],
    },
  },
  steps: [
    {
      title: "A proxy is a middleman",
      body:
        "A proxy receives your request and makes it on your behalf, then passes the answer back. Here the request goes through two of them: one near the office, one in front of the website.",
      links: baseLinks,
      packets: [
        { path: [...viaFwd, "rp", "rp2", "s2"], kind: "request", at: 0.3, dur: 2.6, tag: "GET /" },
        { path: ["s2", "rp2", "rp", "net", "fp2", "fp", "lap"], kind: "response", at: 3.1, dur: 2.6 },
      ],
      labels: [{ at: "netLabel", text: "client → proxy → … → server", icon: "globe", tone: "muted", from: 0.3 }],
    },
    {
      title: "Forward proxy: speaks for the clients",
      body:
        "A forward proxy sits with the users, for example in an office or school. Every request leaves through it, so websites see the proxy's address, not the individual laptop's or phone's.",
      focus: ["fwd"],
      links: baseLinks,
      packets: [
        { path: viaFwd, kind: "request", at: 0.3, dur: 1.6 },
        { path: ["ph", "fp", "fp2", "net"], kind: "request", at: 0.7, dur: 1.6 },
        { path: toApp(1), kind: "request", at: 2, dur: 1.2 },
        { path: toApp(2), kind: "request", at: 2.4, dur: 1.2 },
      ],
      labels: [
        { at: "fpLabel", text: "one exit for everyone", icon: "key", tone: "orange", from: 0.3 },
        { at: "siteLabel", text: "site sees: the proxy's IP", icon: "search", from: 3.3 },
      ],
    },
    {
      title: "Forward proxies filter and cache",
      body:
        "Because all traffic passes through it, a forward proxy can enforce rules (block some sites), log usage, and cache popular downloads so the second person gets them instantly from inside the office.",
      focus: ["fwd"],
      links: baseLinks,
      packets: [
        { path: viaFwd, kind: "request", at: 0.3, dur: 1.6, tag: "games.example", lost: 0.45 },
        { path: ["ph", "fp"], kind: "request", at: 2.2, dur: 0.8, tag: "update.zip" },
        { path: ["fp", "ph"], kind: "response", at: 3.2, dur: 0.8, tag: "from cache" },
      ],
      labels: [
        { at: "fpLabel", text: "blocked by policy", icon: "lock", tone: "orange", from: 1.1, until: 2.8 },
        { at: "fpLabel", text: "cache hit", icon: "bolt", tone: "green", from: 2.9 },
      ],
    },
    {
      title: "Reverse proxy: speaks for the servers",
      body:
        "A reverse proxy sits in front of the website's servers. Users only ever talk to it at shop.example; the apps behind it stay hidden, and can be added, removed or replaced without anyone outside noticing.",
      focus: ["rev"],
      links: baseLinks,
      packets: [
        { path: toApp(1), kind: "request", at: 0.3, dur: 1.4 },
        { path: fromApp(1), kind: "response", at: 1.9, dur: 1.4 },
      ],
      labels: [
        { at: "rpLabel", text: "the only public face", icon: "globe", tone: "green", from: 0.3 },
        { at: "siteLabel", text: "apps hidden inside", icon: "lock", from: 1.2 },
      ],
    },
    {
      title: "Spreading the load",
      body:
        "Most reverse proxies also load-balance: each incoming request goes to one of several identical app servers, so no single server is overwhelmed and a failed one can be skipped.",
      links: baseLinks,
      packets: [
        { path: toApp(1), kind: "request", at: 0.2, dur: 1.3 },
        { path: toApp(2), kind: "request", at: 0.7, dur: 1.3 },
        { path: toApp(3), kind: "request", at: 1.2, dur: 1.3 },
        { path: toApp(1), kind: "request", at: 1.7, dur: 1.3 },
        { path: toApp(2), kind: "request", at: 2.2, dur: 1.3 },
        { path: toApp(3), kind: "request", at: 2.7, dur: 1.3 },
      ],
      labels: [{ at: "rpLabel", text: "1 → 2 → 3 → 1 …", icon: "bolt", tone: "green", from: 0.3 }],
    },
    {
      title: "TLS ends here, and a cache lives here",
      body:
        "The reverse proxy holds the site's certificate and decrypts HTTPS, so the apps don't have to. It can also cache responses: the second request for the same product page is answered by the proxy without touching an app at all.",
      links: baseLinks,
      packets: [
        { path: ["net", "rp"], kind: "secure", at: 0.3, dur: 0.9, tag: "HTTPS" },
        { path: ["rp2", "s2"], kind: "request", at: 1.3, dur: 0.8, tag: "plain HTTP" },
        { path: ["s2", "rp2"], kind: "response", at: 2.2, dur: 0.8 },
        { path: ["net", "rp"], kind: "secure", at: 3.3, dur: 0.9, tag: "same page" },
        { path: ["rp", "net"], kind: "response", at: 4.3, dur: 0.9, tag: "from cache" },
      ],
      labels: [
        { at: "rpLabel", text: "decrypts HTTPS", icon: "lock", tone: "violet", from: 0.9, until: 3.2 },
        { at: "rpLabel", text: "cache hit: apps untouched", icon: "bolt", tone: "green", from: 3.3 },
      ],
    },
    {
      title: "Two proxies, two jobs",
      body:
        "Forward proxy: on the users' side, hides and controls clients. Reverse proxy: on the website's side, hides and protects servers, balances load, ends TLS and caches. Nginx, HAProxy, Envoy and CDNs are all reverse proxies.",
      focus: ["fwd", "rev"],
      links: baseLinks,
      labels: [
        { at: "fpLabel", text: "works for clients", icon: "user", tone: "orange", from: 0.3 },
        { at: "rpLabel", text: "works for servers", icon: "globe", tone: "green", from: 1 },
      ],
      hold: 3,
    },
  ],
  quiz: [
    {
      q: "A school routes all student traffic through one machine that blocks some sites. What is it?",
      options: ["A reverse proxy", "A forward proxy", "A DNS server", "A database"],
      answer: 1,
      explain: "It acts for the clients (students) on their way out to the internet: a forward proxy.",
    },
    {
      q: "Which job is typical for a reverse proxy?",
      options: ["Hiding a user's IP from websites", "Spreading requests across several app servers", "Blocking games for employees", "Resolving domain names"],
      answer: 1,
      explain: "Reverse proxies sit in front of servers and commonly load-balance, terminate TLS and cache.",
    },
    {
      q: "Why terminate TLS at the reverse proxy?",
      options: [
        "It makes the certificate free",
        "One place manages certificates and decryption, and apps receive plain requests",
        "Browsers require it",
        "It removes the need for DNS",
      ],
      answer: 1,
      explain: "Centralising TLS simplifies certificate management and offloads encryption work from app servers.",
    },
  ],
  article: [
    {
      heading: "What is a proxy?",
      paragraphs: [
        "A proxy is a server that forwards requests on behalf of someone else. The difference between proxy types is whose side they're on. A forward proxy represents clients going out to the internet. A reverse proxy represents servers receiving traffic from the internet.",
      ],
    },
    {
      heading: "Forward proxies",
      paragraphs: [
        "Forward proxies are common in companies, schools and privacy tools. Because outgoing traffic flows through them, they can hide individual client addresses, enforce access policies, log activity and cache frequently downloaded content. A VPN is a related idea that tunnels all of a device's traffic through a remote endpoint.",
      ],
    },
    {
      heading: "Reverse proxies",
      paragraphs: [
        "Reverse proxies sit in front of web applications. Clients connect to the proxy, which forwards each request to a backend server. Typical jobs include load balancing across servers, TLS termination, caching responses, compressing content, rate limiting, routing paths to different services (for example /api to one service and /images to another) and shielding backends from direct attack.",
        "Popular reverse proxies include Nginx, HAProxy, Envoy and Traefik, and managed versions such as cloud load balancers. A CDN is essentially a global network of reverse proxies placed close to users.",
      ],
    },
    {
      heading: "Reverse proxies in system design",
      paragraphs: [
        "In almost every high-level design, the first box after the user is a load balancer or reverse proxy. Mention what it does: spreads traffic, health-checks backends, terminates TLS and may cache. Also mention that it must itself be redundant (run several, with failover), or it becomes a single point of failure.",
      ],
    },
  ],
};

export default lesson;
