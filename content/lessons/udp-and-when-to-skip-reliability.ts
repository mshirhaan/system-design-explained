import type { LessonContent } from "@/components/scene/types";

const path = ["lap", "r1", "r2", "ph"];
const links = [
  { from: "lap", to: "r1", style: "muted" as const },
  { from: "r1", to: "r2", style: "muted" as const },
  { from: "r2", to: "ph", style: "muted" as const },
];
const frames = (from: number, n: number, lost: number[] = [], start = 1) =>
  Array.from({ length: n }, (_, i) => ({
    path,
    kind: "message" as const,
    at: from + i * 0.45,
    dur: 1.5,
    tag: `frame ${start + i}`,
    lost: lost.includes(start + i) ? 0.5 : undefined,
  }));

const lesson: LessonContent = {
  slug: "udp-and-when-to-skip-reliability",
  intro:
    "For a video call, a frame that arrives late is worse than one that never arrives. UDP just sends: no handshake, no acknowledgements, no resends. See why that's exactly right for live video, games and DNS.",
  learn: [
    "How UDP differs from TCP",
    "Why live video prefers losing a frame to waiting for it",
    "What head-of-line blocking does to real-time apps",
    "Where UDP is used: calls, games, DNS and HTTP/3",
  ],
  keyIdea:
    "Reliability costs time. When old data is useless (live video, voice, game state), skipping a lost packet beats waiting for it. UDP gives up guarantees in exchange for speed.",
  scene: {
    viewBox: [-500, -235, 1000, 570],
    entities: [
      { id: "desk", kind: "slab", at: [-340, 222], w: 110, h: 14, name: "you", nameIcon: "user" },
      { id: "laptop", kind: "laptop", at: [-340, 208] },
      { id: "r1", kind: "router", at: [-90, 150], name: "router" },
      { id: "r2", kind: "router", at: [90, 100], name: "router" },
      { id: "phSlab", kind: "slab", at: [300, 92], w: 80, h: 12, name: "your friend", nameIcon: "user" },
      { id: "phone", kind: "phone", at: [300, 80] },
    ],
    points: {
      lap: [-258, 160],
      r1: [-90, 132],
      r2: [90, 82],
      ph: [292, 30],
      lapLabel: [-360, 40],
      phLabel: [300, -70],
      buf: [250, -140],
      netLabel: [0, 240],
    },
  },
  steps: [
    {
      title: "A live video call",
      body:
        "You're on a video call. Your laptop captures about 30 frames every second and sends each one to your friend's phone the moment it's ready.",
      links,
      packets: frames(0.2, 6),
      labels: [{ at: "lapLabel", text: "30 frames / second", icon: "bolt", from: 0.1 }],
    },
    {
      title: "No handshake, no ACKs",
      body:
        "These frames travel over UDP. There's no connection setup and no acknowledgement coming back: each packet is fired off on its own. Less waiting, less overhead.",
      links,
      packets: frames(0.2, 6, [], 7),
      labels: [
        { at: "netLabel", text: "UDP: just send", icon: "bolt", tone: "yellow", from: 0.2 },
        { at: "phLabel", text: "no replies needed", icon: "check", tone: "green", from: 1.6 },
      ],
    },
    {
      title: "A frame gets lost",
      body:
        "Frame 15 is dropped on the way. With UDP nobody notices and nobody resends. The phone simply shows frame 16 when it arrives. You might see a tiny glitch for 1/30 of a second.",
      links,
      packets: frames(0.2, 5, [15], 13),
      labels: [{ at: "phLabel", text: "15 missing? show 16", icon: "check", tone: "green", from: 1.8 }],
    },
    {
      title: "What TCP would have done",
      body:
        "If the call used TCP, frame 15 would be resent, and frames 16, 17 and 18 would wait in the buffer until it arrived. The video freezes. By the time 15 shows, it's already old.",
      note: "This is head-of-line blocking: one missing piece holds up everything behind it.",
      links,
      packets: frames(0.2, 4, [15], 15),
      tokens: [
        {
          at: "buf",
          gap: [30, 0],
          items: [
            { kind: "empty", tag: "15?", from: 1.4 },
            { kind: "message", tag: "16", from: 2.1 },
            { kind: "message", tag: "17", from: 2.5 },
            { kind: "message", tag: "18", from: 3 },
          ],
        },
      ],
      labels: [{ at: "phLabel", text: "frozen, waiting for 15", icon: "clock", tone: "orange", from: 2.2 }],
    },
    {
      title: "Where UDP is used",
      body:
        "UDP fits when speed matters more than completeness, or when the app handles reliability itself: voice and video calls, online games, live streams, DNS lookups, and QUIC, the protocol under HTTP/3.",
      note: "Apps on UDP often add just the reliability they need, such as resending important game events but never stale positions.",
      links,
      packets: frames(0.2, 5, [], 19),
      labels: [
        { at: "lapLabel", text: "calls · games · DNS", icon: "chat", tone: "violet", from: 0.2 },
        { at: "netLabel", text: "HTTP/3 runs on UDP too", icon: "globe", tone: "muted", from: 0.9 },
      ],
    },
  ],
  quiz: [
    {
      q: "What happens when a UDP packet is lost?",
      options: ["It's resent automatically", "Nothing: UDP itself doesn't notice or resend", "The connection closes", "All later packets wait"],
      answer: 1,
      explain: "UDP has no acknowledgements or retransmission. The application decides whether to care.",
    },
    {
      q: "Why is UDP better than TCP for a live video call?",
      options: [
        "UDP packets are encrypted",
        "A late frame is useless, and TCP would freeze the video waiting for resends",
        "UDP uses less electricity",
        "TCP can't carry video",
      ],
      answer: 1,
      explain: "TCP's in-order delivery makes later frames wait behind a lost one. Live media prefers to skip and move on.",
    },
    {
      q: "Which of these commonly uses UDP?",
      options: ["Downloading a bank statement", "DNS lookups", "Sending an email", "Uploading a file"],
      answer: 1,
      explain: "DNS queries are tiny and quick to retry, so UDP's low overhead suits them. File transfers and email need TCP's reliability.",
    },
  ],
  article: [
    {
      heading: "UDP vs TCP",
      paragraphs: [
        "UDP (User Datagram Protocol) is the minimal alternative to TCP. It adds ports and a checksum to IP, and nothing else: no connection setup, no ordering, no acknowledgements, no retransmission, no congestion control. Each datagram stands alone.",
        "TCP gives you a reliable, ordered stream but pays for it with handshakes, waiting for acknowledgements and head-of-line blocking. UDP gives you raw speed and leaves reliability to the application.",
      ],
    },
    {
      heading: "When to choose UDP",
      paragraphs: [
        "Choose UDP when fresh data matters more than complete data: voice and video calls (WebRTC), multiplayer games, live sports streams and sensor telemetry. It also suits small request-response exchanges that are cheap to retry, such as DNS.",
        "Many modern protocols build their own reliability on top of UDP so they can tune it. QUIC, which carries HTTP/3, uses UDP and implements its own streams, encryption and retransmission, avoiding TCP's head-of-line blocking between streams.",
      ],
    },
    {
      heading: "In a system design interview",
      paragraphs: [
        "If you're designing a video-conferencing system, a game server or a real-time telemetry pipeline, mention UDP and explain the trade-off: you accept occasional loss in exchange for low, steady latency. For anything where every byte must arrive, such as payments, messages and files, stick with TCP.",
      ],
    },
  ],
};

export default lesson;
