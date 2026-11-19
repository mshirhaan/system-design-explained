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
    "A modern web page needs dozens of files, and how they share the connection decides how quickly the page appears. Watch HTTP/1.1 queue them up one by one, HTTP/2 send them all at once, and HTTP/3 stop a single lost packet from freezing everything.",
  learn: [
    "Why a page needs many separate requests",
    "Why HTTP/1.1 sends one response at a time on each connection",
    "What head-of-line blocking is, at two different levels",
    "How HTTP/2 shares one connection between many files",
    "How HTTP/3 and QUIC finally remove blocking after packet loss",
  ],
  keyIdea:
    "Every HTTP version attacks the same problem: one slow or lost piece holding up everything behind it. HTTP/2 fixed it inside HTTP by interleaving files; HTTP/3 fixed it underneath, by replacing TCP with QUIC so a lost packet only delays the file it belongs to.",
  terms: [
    { term: "HTTP", meaning: "The language browsers and servers use for requests and responses on the web." },
    { term: "Connection", meaning: "An open line between browser and server, set up with TCP (and TLS) handshakes." },
    { term: "Head-of-line blocking", meaning: "When the item at the front of a line is slow or missing, everything behind it waits." },
    { term: "Multiplexing", meaning: "Sending several files over one connection at the same time, in interleaved chunks." },
    { term: "Stream", meaning: "In HTTP/2 and HTTP/3, one request and its response travelling inside a shared connection." },
    { term: "QUIC", meaning: "A newer transport protocol built on UDP that carries HTTP/3 and handles each stream separately." },
  ],
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
      lapLabel: [-300, 40],
      srvLabel: [290, -140],
      wait: [-300, -20],
      wire: [-20, 30],
    },
  },
  steps: [
    {
      title: "A page is many files",
      body:
        "When you open a web page, the browser first downloads the HTML, the page's text and structure. The HTML then refers to other files: stylesheets for layout and colour, scripts for interactive parts, images and fonts. A typical page needs 30 to 100 of these. How quickly they arrive depends a lot on how the browser and server share the connection between them.",
      links,
      packets: [
        { path: go, kind: "request", at: 0.2, dur: 1.2, tag: "GET page.html" },
        { path: back, kind: "response", at: 1.6, dur: 1.2, tag: "page.html" },
      ],
      labels: [{ at: "lapLabel", text: "the page needs 40 more files", icon: "page", tone: "yellow", from: 2.9 }],
    },
    {
      title: "HTTP/1.1: one at a time",
      body:
        "With HTTP/1.1, the version used for most of the web's history, a connection carries one request and one response at a time. The browser asks for the stylesheet and waits until it has fully arrived; only then can it ask for the script. Every file pays a full round trip, so 40 files on one connection would take 40 round trips.",
      links,
      packets: [
        { path: go, kind: "request", at: 0.2, dur: 1, tag: "GET style.css" },
        { path: back, kind: "response", at: 1.3, dur: 1, tag: "style.css" },
        { path: go, kind: "request", at: 2.4, dur: 1, tag: "GET app.js" },
        { path: back, kind: "response", at: 3.5, dur: 1, tag: "app.js" },
        { path: go, kind: "request", at: 4.6, dur: 1, tag: "GET logo.png" },
        { path: back, kind: "response", at: 5.7, dur: 1, tag: "logo.png" },
      ],
      labels: [{ at: "lapLabel", text: "one file per round trip", icon: "clock", tone: "muted", from: 0.2 }],
    },
    {
      title: "Stuck behind a big file",
      body:
        "Now a large 2 MB photo happens to be first in line. While it slowly downloads, the small stylesheet and script wait behind it, even though the server has them ready. The page stays blank because styles haven't arrived. This is head-of-line blocking: the slow item at the front of the line holds up everything behind it.",
      links,
      packets: [{ path: back, kind: "response", at: 0.3, dur: 3.6, tag: "photo.jpg (2 MB)" }],
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
      labels: [{ at: "lapLabel", text: "small files stuck behind it", icon: "clock", tone: "orange", from: 1 }],
    },
    {
      title: "The workaround: six connections",
      body:
        "Browsers work around this by opening up to six connections to the same site, so six files can download at once. It helps, but each extra connection costs its own TCP and TLS handshakes, uses memory on both sides, and competes with the others for bandwidth. Developers also bundled files together to need fewer requests.",
      links,
      packets: [0, 1, 2, 3, 4, 5].map((i) => ({ path: back, kind: "response" as const, at: 0.4 + i * 0.12, dur: 1.6 + (i % 3) * 0.3 })),
      labels: [{ at: "lapLabel", text: "6 connections, 6 handshakes", icon: "bolt", tone: "yellow", from: 0.2 }],
    },
    {
      title: "HTTP/2: all files share one connection",
      body:
        "HTTP/2, from 2015, splits every response into small chunks called frames, each labelled with which file (stream) it belongs to. Frames from different files are interleaved on a single connection, a technique called multiplexing. The photo, stylesheet and script now arrive side by side, so a big file no longer blocks small ones, and only one set of handshakes is needed.",
      links: pipe,
      packets: [
        { path: back, kind: "response", at: 0.2, dur: 1.4, tag: "photo part 1" },
        { path: back, kind: "message", at: 0.5, dur: 1.4, tag: "css" },
        { path: back, kind: "response", at: 0.8, dur: 1.4, tag: "photo part 2" },
        { path: back, kind: "secure", at: 1.1, dur: 1.4, tag: "js" },
        { path: back, kind: "response", at: 1.4, dur: 1.4, tag: "photo part 3" },
      ],
      labels: [
        { at: "wire", text: "one connection, files interleaved", icon: "bolt", tone: "green", from: 0.2 },
        { at: "lapLabel", text: "page appears early", icon: "check", tone: "green", from: 2.8 },
      ],
    },
    {
      title: "But one lost packet still blocks",
      body:
        "HTTP/2 still runs on TCP, and TCP hands data to the browser strictly in order. If one packet carrying part of the photo is lost, the stylesheet and script frames that arrived after it sit in TCP's buffer until the lost packet is resent, typically one round trip later. One loss stalls every file. On a lossy mobile connection, this can make HTTP/2 slower than HTTP/1.1 with six connections.",
      links: pipe,
      packets: [
        { path: back, kind: "response", at: 0.2, dur: 1.4, tag: "photo", lost: 0.5 },
        { path: back, kind: "message", at: 0.5, dur: 1.4, tag: "css" },
        { path: back, kind: "secure", at: 0.8, dur: 1.4, tag: "js" },
        { path: back, kind: "response", at: 2.8, dur: 1.4, tag: "photo (resent)" },
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
      labels: [{ at: "lapLabel", text: "every file waits for 1 packet", icon: "clock", tone: "orange", from: 2 }],
    },
    {
      title: "HTTP/3: only the affected file waits",
      body:
        "HTTP/3 runs on QUIC, a newer protocol built on top of UDP that tracks each stream separately. When a photo packet is lost, only the photo waits for the resend. The stylesheet and script are handed to the browser the moment they arrive. QUIC also combines the connection and encryption handshakes into one round trip, so new connections start faster.",
      note: "QUIC connections also survive a network change. Walk out of Wi-Fi range onto mobile data and the download carries on instead of starting again.",
      links: pipe,
      packets: [
        { path: back, kind: "response", at: 0.2, dur: 1.4, tag: "photo", lost: 0.5 },
        { path: back, kind: "message", at: 0.5, dur: 1.4, tag: "css" },
        { path: back, kind: "secure", at: 0.8, dur: 1.4, tag: "js" },
        { path: back, kind: "response", at: 2.8, dur: 1.4, tag: "photo (resent)" },
      ],
      labels: [
        { at: "lapLabel", text: "css and js used right away", icon: "check", tone: "green", from: 2.1 },
        { at: "wire", text: "QUIC, running over UDP", icon: "bolt", tone: "violet", from: 0.2 },
      ],
    },
    {
      title: "Which one do you get?",
      body:
        "You don't choose; the browser and server agree on the best version both support. Today most large sites offer HTTP/2 and HTTP/3, and around a third of web traffic already uses HTTP/3. The gains are biggest on mobile networks and long-distance links, where packet loss and round-trip times are highest.",
      links: pipe,
      packets: [
        { path: go, kind: "request", at: 0.2, dur: 1.2, tag: "HTTP/3?" },
        { path: back, kind: "response", at: 1.5, dur: 1.2, tag: "yes, HTTP/3" },
      ],
      labels: [
        { at: "srvLabel", text: "speaks HTTP/1.1, 2 and 3", icon: "globe", from: 0.2 },
        { at: "lapLabel", text: "agreed on HTTP/3", icon: "check", tone: "green", from: 2.8 },
      ],
    },
  ],
  quiz: [
    {
      q: "What is head-of-line blocking?",
      options: ["A firewall blocking the first request", "A slow or lost item at the front holding up everything behind it", "The server refusing too many connections", "DNS failing to resolve"],
      answer: 1,
      explain: "Strict in-order delivery means one stuck item delays all the ready items queued after it.",
    },
    {
      q: "What does HTTP/2 add over HTTP/1.1?",
      options: ["Encryption", "Many interleaved files (streams) on a single connection", "UDP transport", "Bigger images"],
      answer: 1,
      explain: "HTTP/2 multiplexes requests as framed streams on one TCP connection, so a slow response no longer blocks others at the HTTP level.",
    },
    {
      q: "Why can HTTP/2 still stall after a single lost packet?",
      options: ["HTTP/2 disables retransmission", "TCP underneath delivers bytes strictly in order, so all streams wait for the resend", "Browsers ignore HTTP/2 frames", "The server pauses on errors"],
      answer: 1,
      explain: "The blocking moved down a layer. HTTP/3's QUIC transport tracks streams separately, so loss only stalls the affected stream.",
    },
    {
      q: "Your users are mostly on mobile phones with patchy connections. Which version helps them most?",
      options: ["HTTP/1.0", "HTTP/1.1 with one connection", "HTTP/3", "None: versions don't matter on mobile"],
      answer: 2,
      explain: "Mobile links lose more packets and change networks often. HTTP/3 avoids cross-stream blocking on loss and keeps connections alive across network changes.",
    },
    {
      q: "With HTTP/2, should you still bundle all your scripts into one huge file to reduce requests?",
      options: [
        "Yes, always: requests are very expensive",
        "Not necessarily: multiplexing makes extra requests cheap, and smaller files cache better",
        "Yes, because HTTP/2 only allows one file",
        "No, HTTP/2 forbids bundling",
      ],
      answer: 1,
      explain: "Bundling was a workaround for HTTP/1.1's one-at-a-time limit. With multiplexing, moderate numbers of smaller files are fine and change less often, so caches stay useful.",
    },
  ],
  article: [
    {
      heading: "What HTTP is, and why its version matters",
      paragraphs: [
        "HTTP (Hypertext Transfer Protocol) is the language browsers and servers use to request and send web pages, images and API data. The meaning of HTTP has barely changed in 25 years: methods like GET and POST, status codes like 200 and 404, headers and bodies all work the same in every version. What changed is how messages travel over the network, and that has a big effect on speed.",
        "A modern page loads dozens of files. The question each version answers differently is: how do those files share the connection between browser and server?",
      ],
    },
    {
      heading: "HTTP/1.1: one response at a time",
      paragraphs: [
        "HTTP/1.1 (1997) sends one request and waits for its complete response before the next one on the same connection. Keep-alive lets a connection be reused instead of reopened, but responses still come back strictly one after another. A slow or large response blocks every request queued behind it: head-of-line blocking at the HTTP level.",
        "Browsers compensate by opening about six parallel connections per site. Developers added workarounds of their own: bundling scripts into one file, combining icons into a single \"sprite\" image, and spreading files across several domains to get more connections.",
      ],
    },
    {
      heading: "HTTP/2: multiplexing on one connection",
      paragraphs: [
        "HTTP/2 (2015) keeps the same methods and headers but changes how they're sent. Every message is split into binary frames, each tagged with a stream number, and frames from many streams are interleaved on a single connection. A large image no longer blocks a small stylesheet, because their frames take turns. HTTP/2 also compresses headers, which matters because the same cookies and headers are repeated on every request.",
        "One connection per site means fewer handshakes and lets TCP's congestion control work well, instead of six connections competing with each other.",
      ],
    },
    {
      heading: "The remaining problem: blocking inside TCP",
      paragraphs: [
        "HTTP/2 removed blocking inside HTTP, but it still runs on TCP, which delivers bytes strictly in order. If one packet is lost, every later byte waits in TCP's buffer until the missing packet is retransmitted, even bytes belonging to completely different streams. One lost packet stalls everything. On networks with 1–2% packet loss, common on mobile, this can make HTTP/2 perform worse than HTTP/1.1, whose six separate connections are blocked independently.",
      ],
    },
    {
      heading: "HTTP/3 and QUIC",
      paragraphs: [
        "HTTP/3 (standardised in 2022) runs on QUIC, a transport protocol built on UDP. QUIC implements reliable delivery itself, but per stream: a lost packet only delays the stream it belongs to. It also merges the connection and TLS 1.3 handshakes into a single round trip (zero for repeat visits) and identifies connections by an ID rather than by IP address, so a phone moving from Wi-Fi to mobile data keeps its connection.",
        "Because QUIC lives in ordinary applications rather than the operating system, it can be improved and deployed quickly. Google, Meta and Cloudflare serve a large share of their traffic over it.",
      ],
    },
    {
      heading: "Worked example: one page on three versions",
      paragraphs: [
        "A page needs the HTML plus 30 small files, and the round trip to the server is 50 ms. Over HTTP/1.1 with six connections, setting up the connections costs about 100 ms (TCP plus TLS), then 30 files across six connections need about 5 round trips: roughly 350 ms in total. Over HTTP/2, one connection costs 100 ms to set up and all 30 requests go out together, finishing in about 1–2 round trips: roughly 200 ms.",
        "Now add 2% packet loss. HTTP/2's single connection stalls every time any packet is lost, so its advantage shrinks. HTTP/3 needs only one round trip to connect (50 ms) and stalls only the file whose packet was lost: roughly 150–180 ms.",
      ],
    },
    {
      heading: "Trade-offs of each version",
      paragraphs: [
        "HTTP/1.1 is simple, readable as plain text, and supported by every tool ever written, which makes it easy to debug. Its cost is many connections and wasted round trips. HTTP/2 makes far better use of one connection but is a binary protocol, harder to inspect by hand, and suffers badly from packet loss because everything shares one TCP connection.",
        "HTTP/3 performs best on poor networks and starts connections fastest, but it's newer: some corporate firewalls block or slow down UDP traffic, so browsers always keep HTTP/2 as a fallback. QUIC also uses more CPU on servers than TCP today, because much of TCP's work is done by the operating system and network cards, while QUIC runs in ordinary software. For most sites the right answer is to offer all three and let each browser pick.",
      ],
    },
    {
      heading: "Common misconceptions",
      paragraphs: [
        "\"HTTP/2 needs a different API.\" Applications send the same requests; the protocol layer changes. \"HTTP/3 is unreliable because it uses UDP.\" QUIC adds its own reliability; it's just organised per stream. \"Bundling everything is always best.\" With multiplexing, many smaller files work well and cache better, because changing one file doesn't invalidate a giant bundle. \"Upgrading the protocol fixes a slow site.\" It helps, but slow servers, huge images and too many round trips in the app's own logic matter more.",
      ],
    },
    {
      heading: "In real systems and in interviews",
      paragraphs: [
        "In practice, you enable HTTP/2 and HTTP/3 at the edge, on your CDN or load balancer, and the browser negotiates the best version automatically. Internal traffic between services often uses HTTP/2 as well; gRPC, a popular way for services to call each other, is built on it.",
        "In a system design interview, protocol versions rarely need a deep discussion. But mentioning that you'd serve the site through a CDN with HTTP/2 and HTTP/3 enabled, and explaining head-of-line blocking if asked about slow mobile performance, shows you understand where latency really comes from.",
      ],
    },
  ],
};

export default lesson;
