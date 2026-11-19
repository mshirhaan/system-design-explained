import type { LessonContent } from "@/components/scene/types";

const go = ["lap", "r1", "srv"];
const back = ["srv", "r1", "lap"];
const links = [
  { from: "lap", to: "r1", style: "muted" as const, both: true },
  { from: "r1", to: "srv", style: "muted" as const, both: true },
];
const pipe = [
  { from: "lap", to: "r1", style: "pipe" as const },
  { from: "r1", to: "srv", style: "pipe" as const },
];

const lesson: LessonContent = {
  slug: "http-1-1-vs-http-2-vs-http-3",
  intro:
    "A page needs dozens of files. How they share the connection decides how fast the page appears. Watch HTTP/1.1 queue them up, HTTP/2 interleave them, and HTTP/3 stop one lost packet from stalling everything.",
  learn: [
    "Why HTTP/1.1 sends one response at a time per connection",
    "What head-of-line blocking is",
    "How HTTP/2 multiplexes many streams on one connection",
    "Why a lost TCP packet still blocks HTTP/2",
    "How HTTP/3 and QUIC fix that",
  ],
  keyIdea:
    "Each HTTP version attacks the same problem: one slow or lost piece holding up everything behind it. HTTP/2 removed it at the HTTP level; HTTP/3 removed it at the transport level by moving to QUIC over UDP.",
  scene: {
    viewBox: [-500, -235, 1000, 570],
    entities: [
      { id: "desk", kind: "slab", at: [-340, 222], w: 110, h: 14, name: "browser", nameIcon: "user" },
      { id: "laptop", kind: "laptop", at: [-340, 208] },
      { id: "r1", kind: "router", at: [-30, 140], name: "network" },
      { id: "server", kind: "box", at: [290, 70], w: 84, h: 104, color: "blue", text: ["Web", "server"], textSize: 18, name: "shop.example", nameIcon: "globe" },
    ],
    points: {
      lap: [-258, 160],
      r1: [-30, 122],
      srv: [222, 40],
      lapLabel: [-360, 40],
      srvLabel: [290, -140],
      wait: [-300, -20],
      wire: [-20, 30],
    },
  },
  steps: [
    {
      title: "HTTP/1.1: one at a time",
      body:
        "With HTTP/1.1, a connection carries one request and response at a time. The browser asks for the HTML, waits for it, then the stylesheet, waits, then the script. Every file pays a full round trip.",
      links,
      packets: [
        { path: go, kind: "request", at: 0.2, dur: 1, tag: "GET page.html" },
        { path: back, kind: "response", at: 1.3, dur: 1, tag: "page.html" },
        { path: go, kind: "request", at: 2.4, dur: 1, tag: "GET style.css" },
        { path: back, kind: "response", at: 3.5, dur: 1, tag: "style.css" },
        { path: go, kind: "request", at: 4.6, dur: 1, tag: "GET app.js" },
        { path: back, kind: "response", at: 5.7, dur: 1, tag: "app.js" },
      ],
      labels: [{ at: "lapLabel", text: "one file per round trip", icon: "clock", tone: "muted", from: 0.2 }],
    },
    {
      title: "Head-of-line blocking",
      body:
        "Now a big photo is first in line. It takes a long time to arrive, and the small CSS and JavaScript files wait behind it, even though they're ready on the server. The page stays blank.",
      links,
      packets: [{ path: back, kind: "response", at: 0.3, dur: 3.6, tag: "hero.jpg (2 MB)" }],
      tokens: [
        {
          at: "wait",
          gap: [30, 0],
          items: [
            { kind: "message", tag: "css", from: 0.4, until: 4 },
            { kind: "message", tag: "js", from: 0.6, until: 4 },
            { kind: "message", tag: "font", from: 0.8, until: 4 },
          ],
        },
      ],
      labels: [{ at: "lapLabel", text: "small files stuck behind", icon: "clock", tone: "orange", from: 1 }],
    },
    {
      title: "The workaround: six connections",
      body:
        "Browsers work around it by opening up to six connections per site, so six files can download at once. It helps, but each connection costs its own TCP and TLS handshakes, and they compete with each other.",
      links,
      packets: [0, 1, 2, 3, 4, 5].map((i) => ({ path: back, kind: "response" as const, at: 0.4 + i * 0.12, dur: 1.6 + (i % 3) * 0.3 })),
      labels: [{ at: "lapLabel", text: "6 connections = 6 handshakes", icon: "bolt", tone: "yellow", from: 0.2 }],
    },
    {
      title: "HTTP/2: many streams, one connection",
      body:
        "HTTP/2 splits every response into small frames tagged with a stream number and interleaves them on one connection. The photo, CSS and JS all arrive together, and nothing waits for a slow neighbour.",
      links: pipe,
      packets: [
        { path: back, kind: "response", at: 0.2, dur: 1.4, tag: "img 1/3" },
        { path: back, kind: "message", at: 0.5, dur: 1.4, tag: "css" },
        { path: back, kind: "response", at: 0.8, dur: 1.4, tag: "img 2/3" },
        { path: back, kind: "secure", at: 1.1, dur: 1.4, tag: "js" },
        { path: back, kind: "response", at: 1.4, dur: 1.4, tag: "img 3/3" },
      ],
      labels: [
        { at: "wire", text: "one connection, interleaved", icon: "bolt", tone: "green", from: 0.2 },
        { at: "lapLabel", text: "page renders early", icon: "check", tone: "green", from: 2.8 },
      ],
    },
    {
      title: "But TCP still blocks",
      body:
        "HTTP/2 runs on TCP, and TCP delivers bytes strictly in order. If one packet of the image is lost, the CSS and JS frames that arrived after it sit in TCP's buffer until it's resent. Every stream stalls for one loss.",
      links: pipe,
      packets: [
        { path: back, kind: "response", at: 0.2, dur: 1.4, tag: "img", lost: 0.5 },
        { path: back, kind: "message", at: 0.5, dur: 1.4, tag: "css" },
        { path: back, kind: "secure", at: 0.8, dur: 1.4, tag: "js" },
        { path: back, kind: "response", at: 2.8, dur: 1.4, tag: "img (resent)" },
      ],
      tokens: [
        {
          at: "wait",
          gap: [30, 0],
          items: [
            { kind: "message", tag: "css", from: 1.9, until: 4.2 },
            { kind: "secure", tag: "js", from: 2.2, until: 4.2 },
          ],
        },
      ],
      labels: [{ at: "lapLabel", text: "all streams wait for 1 packet", icon: "clock", tone: "orange", from: 2 }],
    },
    {
      title: "HTTP/3: streams that don't wait",
      body:
        "HTTP/3 runs on QUIC, a transport built on UDP that knows about streams. A lost image packet only pauses the image. CSS and JS are delivered the moment they arrive. QUIC also folds the TLS handshake in, saving round trips.",
      links: pipe,
      packets: [
        { path: back, kind: "response", at: 0.2, dur: 1.4, tag: "img", lost: 0.5 },
        { path: back, kind: "message", at: 0.5, dur: 1.4, tag: "css" },
        { path: back, kind: "secure", at: 0.8, dur: 1.4, tag: "js" },
        { path: back, kind: "response", at: 2.8, dur: 1.4, tag: "img (resent)" },
      ],
      labels: [
        { at: "lapLabel", text: "css + js used right away", icon: "check", tone: "green", from: 2.1 },
        { at: "wire", text: "QUIC over UDP", icon: "bolt", tone: "violet", from: 0.2 },
      ],
    },
    {
      title: "Which one do you get?",
      body:
        "You don't pick: browser and server agree on the best version both support. Today most big sites serve HTTP/2 and HTTP/3. The gains are biggest on mobile and long-distance links, where loss and latency are highest.",
      links: pipe,
      packets: [
        { path: go, kind: "request", at: 0.2, dur: 1.2, tag: "h3?" },
        { path: back, kind: "response", at: 1.5, dur: 1.2, tag: "h3 ✓" },
      ],
      labels: [
        { at: "srvLabel", text: "speaks h1.1 · h2 · h3", icon: "globe", from: 0.2 },
        { at: "lapLabel", text: "negotiated: HTTP/3", icon: "check", tone: "green", from: 2.8 },
      ],
    },
  ],
  quiz: [
    {
      q: "What is head-of-line blocking?",
      options: [
        "A firewall blocking the first request",
        "A slow or lost item at the front holding up everything behind it",
        "The server refusing too many connections",
        "DNS failing to resolve",
      ],
      answer: 1,
      explain: "Strict in-order delivery means one stuck item delays all the ready items queued after it.",
    },
    {
      q: "What does HTTP/2 add over HTTP/1.1?",
      options: ["Encryption", "Many interleaved streams on a single connection", "UDP transport", "Bigger images"],
      answer: 1,
      explain: "HTTP/2 multiplexes requests as framed streams on one TCP connection, so a slow response no longer blocks others at the HTTP level.",
    },
    {
      q: "Why can HTTP/2 still stall after a single lost packet?",
      options: [
        "HTTP/2 disables retransmission",
        "TCP underneath delivers bytes strictly in order, so all streams wait for the resend",
        "Browsers ignore HTTP/2 frames",
        "The server pauses on errors",
      ],
      answer: 1,
      explain: "The blocking moved down a layer. HTTP/3's QUIC transport tracks streams separately, so loss only stalls the affected stream.",
    },
  ],
  article: [
    {
      heading: "HTTP/1.1",
      paragraphs: [
        "HTTP/1.1 (1997) sends one request and waits for its response before the next on the same connection. Keep-alive lets the connection be reused, but responses still come back strictly in order. Browsers open around six parallel connections per host to compensate, and developers used tricks like bundling files and image sprites to cut the number of requests.",
      ],
    },
    {
      heading: "HTTP/2",
      paragraphs: [
        "HTTP/2 (2015) keeps the same methods, headers and status codes but changes how they're sent. Messages are split into binary frames on numbered streams, which are interleaved on a single connection. It also compresses headers (HPACK) and lets clients set stream priorities. One connection per site is enough, which means fewer handshakes and better use of TCP's congestion window.",
      ],
    },
    {
      heading: "HTTP/3 and QUIC",
      paragraphs: [
        "HTTP/2's weak spot is TCP: a lost packet blocks every stream until it's retransmitted. HTTP/3 (2022) runs on QUIC, a transport protocol built on UDP. QUIC implements its own reliable streams, so loss on one stream doesn't block others. It integrates TLS 1.3 into its handshake, often connecting in one round trip (or zero for repeat visits), and connections survive a change of network, such as moving from Wi-Fi to mobile data.",
      ],
    },
    {
      heading: "What it means for system design",
      paragraphs: [
        "In most designs you enable HTTP/2 and HTTP/3 at the edge (CDN or load balancer) and keep internal traffic on HTTP/1.1 or HTTP/2 (gRPC uses HTTP/2). Mentioning head-of-line blocking, multiplexing and QUIC's benefits on lossy mobile networks shows you understand where latency really comes from.",
      ],
    },
  ],
};

export default lesson;
