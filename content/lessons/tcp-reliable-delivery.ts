import type { LessonContent } from "@/components/scene/types";

const go = ["lap", "r1", "r2", "srv"];
const back = ["srv", "r2", "r1", "lap"];
const links = [
  { from: "lap", to: "r1", style: "muted" as const, both: true },
  { from: "r1", to: "r2", style: "muted" as const, both: true },
  { from: "r2", to: "srv", style: "muted" as const, both: true },
];

const lesson: LessonContent = {
  slug: "tcp-reliable-delivery",
  intro:
    "The internet loses packets all the time, yet your downloads arrive perfect. TCP is why. Watch the handshake, numbered segments, acknowledgements, and a lost packet being noticed and resent.",
  learn: [
    "Why TCP starts with a three-way handshake",
    "How sequence numbers keep data in order",
    "What acknowledgements (ACKs) do",
    "How a lost packet is detected and resent",
    "Why TCP slows down when the network is busy",
  ],
  keyIdea:
    "TCP turns an unreliable network into a reliable stream: every byte is numbered, every delivery is acknowledged, and anything unacknowledged is sent again. The price is extra round trips and waiting.",
  scene: {
    viewBox: [-500, -235, 1000, 570],
    entities: [
      { id: "desk", kind: "slab", at: [-340, 222], w: 110, h: 14, name: "your laptop", nameIcon: "user" },
      { id: "laptop", kind: "laptop", at: [-340, 208] },
      { id: "r1", kind: "router", at: [-90, 160], name: "router" },
      { id: "r2", kind: "router", at: [80, 110], name: "router" },
      { id: "server", kind: "box", at: [290, 70], w: 84, h: 104, color: "blue", text: ["Server"], textSize: 18, name: "files.example", nameIcon: "globe" },
    ],
    points: {
      lap: [-258, 160],
      r1: [-90, 142],
      r2: [80, 92],
      srv: [222, 40],
      lapLabel: [-360, 40],
      srvLabel: [290, -140],
      buf: [215, -88],
      buf5: [241, -88],
      netLabel: [-10, 250],
    },
  },
  steps: [
    {
      title: "The three-way handshake",
      body:
        "Before sending data, TCP sets up a connection. Your laptop sends SYN (let's talk, I'll start counting at 1), the server replies SYN-ACK (agreed, and I'll start at 1 too), and your laptop confirms with ACK.",
      links,
      packets: [
        { path: go, kind: "request", at: 0.3, dur: 1.4, tag: "SYN" },
        { path: back, kind: "response", at: 1.9, dur: 1.4, tag: "SYN-ACK" },
        { path: go, kind: "request", at: 3.5, dur: 1.4, tag: "ACK" },
      ],
      labels: [{ at: "netLabel", text: "1 round trip before any data", icon: "clock", tone: "muted", from: 0.2 }],
    },
    {
      title: "Data in numbered segments",
      body:
        "Now the file flows as segments, each with a sequence number. The server drops each one into its receive buffer in the right slot, so the order is always correct, however the packets travel.",
      links,
      packets: [
        { path: go, kind: "message", at: 0.2, dur: 1.4, tag: "seq 1" },
        { path: go, kind: "message", at: 0.6, dur: 1.4, tag: "seq 2" },
        { path: go, kind: "message", at: 1, dur: 1.4, tag: "seq 3" },
      ],
      tokens: [{ at: "buf", gap: [26, 0], items: [1, 2, 3].map((n, i) => ({ kind: "message" as const, tag: String(n), from: 1.6 + i * 0.4 })) }],
      labels: [{ at: "srvLabel", text: "receive buffer", icon: "page", from: 0.2 }],
    },
    {
      title: "Acknowledgements come back",
      body:
        "For what it receives, the server sends an ACK saying the next number it expects. ACK 4 means: I have everything up to 3, send 4 next. Until a segment is acknowledged, the sender keeps a copy.",
      links,
      packets: [
        { path: back, kind: "response", at: 0.3, dur: 1.4, tag: "ACK 2" },
        { path: back, kind: "response", at: 0.7, dur: 1.4, tag: "ACK 3" },
        { path: back, kind: "response", at: 1.1, dur: 1.4, tag: "ACK 4" },
      ],
      tokens: [{ at: "buf", gap: [26, 0], items: [1, 2, 3].map((n) => ({ kind: "message" as const, tag: String(n) })) }],
      labels: [{ at: "lapLabel", text: "1–3 delivered ✓", icon: "check", tone: "green", from: 2.6 }],
    },
    {
      title: "A packet gets lost",
      body:
        "Segments 4, 5 and 6 go out. Number 5 is dropped by a busy router, which happens all the time on real networks. The server gets 4 and 6 and notices the gap.",
      links,
      packets: [
        { path: go, kind: "message", at: 0.2, dur: 1.4, tag: "seq 4" },
        { path: go, kind: "message", at: 0.6, dur: 1.4, tag: "seq 5", lost: 0.5 },
        { path: go, kind: "message", at: 1, dur: 1.4, tag: "seq 6" },
      ],
      tokens: [
        {
          at: "buf",
          gap: [26, 0],
          items: [
            { kind: "message", tag: "4", from: 1.6 },
            { kind: "empty", tag: "?", from: 2 },
            { kind: "message", tag: "6", from: 2.4 },
          ],
        },
      ],
      labels: [{ at: "srvLabel", text: "got 4 and 6, missing 5", icon: "search", tone: "orange", from: 2.5 }],
    },
    {
      title: "Noticed, and sent again",
      body:
        "The server keeps saying ACK 5: I still need 5. Seeing repeated ACKs (or a timer running out), your laptop resends segment 5 from its copy. The gap fills, and the server can pass 4, 5, 6 up to the program.",
      links,
      packets: [
        { path: back, kind: "response", at: 0.2, dur: 1.3, tag: "ACK 5" },
        { path: back, kind: "response", at: 0.6, dur: 1.3, tag: "ACK 5" },
        { path: go, kind: "message", at: 2.2, dur: 1.4, tag: "seq 5 (again)" },
        { path: back, kind: "response", at: 3.9, dur: 1.3, tag: "ACK 7" },
      ],
      tokens: [
        {
          at: "buf",
          gap: [26, 0],
          items: [
            { kind: "message", tag: "4" },
            { kind: "empty", tag: "?", until: 3.6 },
            { kind: "message", tag: "6" },
          ],
        },
        { at: "buf5", items: [{ kind: "message", tag: "5", from: 3.6 }] },
      ],
      labels: [{ at: "lapLabel", text: "duplicate ACKs → resend 5", icon: "bolt", tone: "yellow", from: 1.9 }],
    },
    {
      title: "Slowing down when it's busy",
      body:
        "A lost packet is also a hint that the network is congested. TCP responds by sending fewer segments at once (a smaller window), then speeds up again gradually. This keeps the internet from collapsing under its own traffic.",
      note: "This is why a single lost packet can make a download stutter, and why TCP can be the wrong choice for live video. The next lesson shows the alternative.",
      links,
      packets: [
        { path: go, kind: "message", at: 0.2, dur: 1.4 },
        { path: go, kind: "message", at: 0.5, dur: 1.4 },
        { path: go, kind: "message", at: 2.4, dur: 1.4 },
        { path: go, kind: "message", at: 3.6, dur: 1.4 },
        { path: go, kind: "message", at: 3.9, dur: 1.4 },
        { path: go, kind: "message", at: 4.2, dur: 1.4 },
      ],
      labels: [
        { at: "lapLabel", text: "window: 2 in flight", icon: "clock", tone: "orange", from: 0.2, until: 3.3 },
        { at: "lapLabel", text: "window grows: 3", icon: "bolt", tone: "green", from: 3.4 },
      ],
    },
    {
      title: "Closing the connection",
      body:
        "When the transfer is done, each side says it has finished sending with FIN and the other acknowledges. Every byte arrived, in order, exactly once, built on a network that guarantees none of that.",
      links,
      packets: [
        { path: go, kind: "request", at: 0.3, dur: 1.4, tag: "FIN" },
        { path: back, kind: "response", at: 1.9, dur: 1.4, tag: "ACK + FIN" },
        { path: go, kind: "request", at: 3.5, dur: 1.4, tag: "ACK" },
      ],
      labels: [{ at: "srvLabel", text: "file complete, in order", icon: "check", tone: "green", from: 1 }],
    },
  ],
  quiz: [
    {
      q: "What does \"ACK 5\" from the server mean?",
      options: ["Segment 5 arrived", "I have everything before 5; send 5 next", "Send 5 more segments", "Close connection 5"],
      answer: 1,
      explain: "TCP acknowledgements name the next byte expected. Repeating ACK 5 tells the sender that 5 is missing.",
    },
    {
      q: "How does the sender know to resend a segment?",
      options: [
        "The router sends an error",
        "It sees repeated ACKs for the same number, or its timer runs out without an ACK",
        "The user presses refresh",
        "It never resends",
      ],
      answer: 1,
      explain: "Duplicate ACKs trigger a fast retransmit; a timeout catches everything else.",
    },
    {
      q: "Why does TCP send less data after a loss?",
      options: [
        "To save battery",
        "Loss usually means congestion, so it backs off to avoid overloading the network",
        "Because the file got smaller",
        "The server asked it to stop",
      ],
      answer: 1,
      explain: "Congestion control shrinks the window after loss and grows it again gradually. It keeps shared links usable for everyone.",
    },
  ],
  article: [
    {
      heading: "What TCP guarantees",
      paragraphs: [
        "The Internet Protocol (IP) only promises best effort: packets may be lost, duplicated, delayed or reordered. TCP (Transmission Control Protocol) runs on top and turns that into a reliable, ordered byte stream. HTTP/1.1, HTTP/2, database connections, SSH and most other protocols you'll use rely on it.",
      ],
    },
    {
      heading: "The three-way handshake",
      paragraphs: [
        "A TCP connection starts with SYN, SYN-ACK and ACK. The two sides agree to talk and exchange their starting sequence numbers. This costs one round trip before any data can flow, which is why reusing connections (keep-alive and connection pools) matters so much for performance.",
      ],
    },
    {
      heading: "Sequence numbers, ACKs and retransmission",
      paragraphs: [
        "Every byte sent has a sequence number. The receiver acknowledges by saying the next number it expects. The sender keeps unacknowledged data and resends it if three duplicate ACKs arrive (fast retransmit) or if a retransmission timer expires.",
        "The receiver holds out-of-order segments in a buffer and only delivers data to the application once the gaps are filled. This is called head-of-line blocking: one missing segment delays everything behind it.",
      ],
    },
    {
      heading: "Flow control and congestion control",
      paragraphs: [
        "Flow control stops a fast sender overwhelming a slow receiver: the receiver advertises how much buffer space it has. Congestion control protects the network: the sender limits how much unacknowledged data is in flight (the congestion window), growing it while things go well and cutting it when packets are lost.",
        "In system design, remember that TCP throughput depends on round-trip time. Long-distance connections ramp up slowly, and a lossy link can cut throughput sharply.",
      ],
    },
  ],
};

export default lesson;
