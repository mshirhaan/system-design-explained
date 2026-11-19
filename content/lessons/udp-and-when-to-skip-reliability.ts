import type { LessonContent } from "@/components/scene/types";

const path = ["lap", "r1", "r2", "ph"];
const links = [
  { from: "lap", to: "r1", style: "muted" as const },
  { from: "r1", to: "r2", style: "muted" as const },
  { from: "r2", to: "ph", style: "muted" as const },
];
const frames = (from: number, n: number, lost: number[] = [], start = 1, label = "frame") =>
  Array.from({ length: n }, (_, i) => ({
    path,
    kind: "message" as const,
    at: from + i * 0.45,
    dur: 1.5,
    tag: `${label} ${start + i}`,
    lost: lost.includes(start + i) ? 0.5 : undefined,
  }));

const lesson: LessonContent = {
  slug: "udp-and-when-to-skip-reliability",
  intro:
    "On a video call, a frame that arrives late is worse than one that never arrives. UDP is a way of sending data that just sends: no setup, no confirmations, no resends. See why that's exactly right for live video, games and DNS, and what apps must do for themselves in exchange.",
  learn: [
    "How UDP differs from TCP, and what it leaves out",
    "Why live video prefers losing a frame to waiting for it",
    "What head-of-line blocking does to real-time apps",
    "How apps add back only the reliability they need",
    "Where UDP is used: calls, games, DNS and HTTP/3",
  ],
  keyIdea:
    "Reliability costs time. When old data is useless (live video, voice, game positions), skipping a lost packet beats waiting for it. UDP gives up delivery guarantees in exchange for speed, and the app decides what, if anything, is worth resending.",
  terms: [
    { term: "UDP", meaning: "User Datagram Protocol: sends each packet on its own, with no connection, confirmation or resend." },
    { term: "Datagram", meaning: "A single, self-contained UDP message; it either arrives whole or not at all." },
    { term: "Frame", meaning: "One still picture in a video; a call typically sends 30 per second." },
    { term: "Head-of-line blocking", meaning: "When one missing piece forces everything after it to wait." },
    { term: "Jitter", meaning: "Variation in how long packets take to arrive, which makes playback uneven." },
    { term: "Keyframe", meaning: "A complete picture that later frames depend on; losing it hurts more than losing an ordinary frame." },
  ],
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
      lapLabel: [-300, 40],
      phLabel: [300, -70],
      buf: [250, -140],
      netLabel: [0, 240],
    },
  },
  steps: [
    {
      title: "A live video call",
      body:
        "You're on a video call with a friend. Your laptop's camera captures about 30 frames, still pictures, every second, and each one is compressed and sent the moment it's ready. A new frame leaves roughly every 33 milliseconds. For the call to feel live, each frame needs to reach your friend within about 150 ms.",
      links,
      packets: frames(0.2, 6),
      labels: [{ at: "lapLabel", text: "30 frames every second", icon: "bolt", from: 0.1 }],
    },
    {
      title: "UDP: no setup, no confirmations",
      body:
        "These frames travel using UDP instead of TCP. UDP has no handshake to open a connection and sends no acknowledgements back: each packet, called a datagram, is fired off on its own. Think of TCP as recorded delivery with a signature, and UDP as dropping postcards in a postbox. There's nothing to wait for, so frames leave the instant they're ready.",
      links,
      packets: frames(0.2, 6, [], 7),
      labels: [
        { at: "netLabel", text: "UDP: each packet sent on its own", icon: "bolt", tone: "yellow", from: 0.2 },
        { at: "phLabel", text: "no replies needed", icon: "check", tone: "green", from: 1.6 },
      ],
    },
    {
      title: "Less overhead per packet",
      body:
        "UDP's label on each packet is tiny: 8 bytes, against at least 20 for TCP. More importantly, it skips TCP's machinery entirely: no handshake round trip before the first frame, no waiting for acknowledgements, and no slowing down to wait for resends. For thousands of small, time-critical packets, that saved time adds up.",
      links,
      packets: frames(0.2, 5, [], 13),
      labels: [
        { at: "lapLabel", text: "first frame leaves instantly", icon: "bolt", tone: "green", from: 0.2 },
        { at: "netLabel", text: "8-byte label instead of 20+", icon: "info", tone: "muted", from: 0.9 },
      ],
    },
    {
      title: "A frame gets lost",
      body:
        "Frame 20 is dropped by a busy router on the way. With UDP, nobody notices and nobody resends it. Your friend's phone simply shows frame 21 when it arrives. At worst there's a tiny glitch lasting 1/30 of a second, which is usually too short to notice.",
      links,
      packets: frames(0.2, 5, [20], 18),
      labels: [{ at: "phLabel", text: "20 is missing, so show 21", icon: "check", tone: "green", from: 1.8 }],
    },
    {
      title: "What TCP would have done",
      body:
        "If the call used TCP, frame 20 would be resent, and frames 21, 22 and 23 would wait in the buffer until it arrived, because TCP always delivers in order. The picture freezes for at least one round trip, often 100 ms or more. And by the time frame 20 finally shows, it's already old news.",
      note: "This is head-of-line blocking: one missing piece holds up everything behind it. It's the main reason real-time media avoids TCP.",
      links,
      packets: frames(0.2, 4, [20], 20),
      tokens: [
        {
          at: "buf",
          gap: [30, 0],
          items: [
            { kind: "empty", tag: "20?", from: 1.4 },
            { kind: "message", tag: "21", from: 2.1 },
            { kind: "message", tag: "22", from: 2.5 },
            { kind: "message", tag: "23", from: 3 },
          ],
        },
      ],
      labels: [{ at: "phLabel", text: "frozen, waiting for frame 20", icon: "clock", tone: "orange", from: 2.2 }],
    },
    {
      title: "Adding back only what matters",
      body:
        "Not every packet is equally important. Video uses occasional keyframes, complete pictures that later frames depend on. Apps built on UDP can resend a lost keyframe while ignoring lost ordinary frames. Games work the same way: an old player position is useless, but \"you picked up the key\" must arrive, so only those events are confirmed and resent.",
      links,
      packets: [
        { path, kind: "secure", at: 0.2, dur: 1.5, tag: "keyframe", lost: 0.5 },
        { path, kind: "message", at: 0.7, dur: 1.5, tag: "frame" },
        { path, kind: "message", at: 1.2, dur: 1.5, tag: "frame" },
        { path, kind: "secure", at: 1.9, dur: 1.5, tag: "keyframe (resent)" },
      ],
      labels: [{ at: "lapLabel", text: "resend only what matters", icon: "key", tone: "violet", from: 1.1 }],
    },
    {
      title: "The app must pace itself",
      body:
        "TCP automatically slows down when the network is congested. UDP doesn't: it will happily send as fast as the app asks, even into a jammed network. So real-time apps watch for loss and delay themselves and lower their sending rate, for example by switching to a lower video quality when your Wi-Fi gets worse.",
      note: "This is why your video call sometimes turns blurry instead of freezing: the app chose to send fewer bytes rather than lose more packets.",
      links,
      packets: frames(0.2, 6, [24], 23),
      labels: [
        { at: "lapLabel", text: "losses spotted, lowering quality", icon: "info", tone: "orange", from: 1.4 },
        { at: "phLabel", text: "blurrier but smooth", icon: "check", tone: "green", from: 2.8 },
      ],
    },
    {
      title: "Where UDP is used",
      body:
        "UDP fits when speed matters more than completeness, or when the app wants to control reliability itself. Voice and video calls, online games, live streams, DNS lookups and QUIC, the protocol under HTTP/3, all run on UDP. File downloads, payments, emails and anything that must arrive complete stay on TCP.",
      links,
      packets: frames(0.2, 5, [], 29),
      labels: [
        { at: "lapLabel", text: "calls, games and DNS", icon: "chat", tone: "violet", from: 0.2 },
        { at: "netLabel", text: "HTTP/3 runs on UDP too", icon: "globe", tone: "muted", from: 0.9 },
      ],
    },
  ],
  quiz: [
    {
      q: "What happens when a UDP packet is lost?",
      options: ["It's resent automatically", "Nothing: UDP itself doesn't notice or resend it", "The connection closes", "All later packets wait for it"],
      answer: 1,
      explain: "UDP has no acknowledgements or retransmission. The application decides whether the loss matters.",
    },
    {
      q: "Why is UDP usually better than TCP for a live video call?",
      options: ["UDP packets are encrypted", "A late frame is useless, and TCP would freeze the video waiting for resends", "UDP uses less electricity", "TCP can't carry video"],
      answer: 1,
      explain: "TCP's in-order delivery makes later frames wait behind a lost one. Live media prefers to skip and move on.",
    },
    {
      q: "Which of these commonly uses UDP?",
      options: ["Downloading a bank statement", "DNS lookups", "Sending an email", "Uploading a file to cloud storage"],
      answer: 1,
      explain: "DNS questions are tiny and quick to retry, so UDP's low overhead suits them. The others need every byte to arrive.",
    },
    {
      q: "You're designing a multiplayer game. Player positions update 20 times per second, and players can also buy items. How should you treat them?",
      options: [
        "Send everything over UDP and never resend",
        "Send positions without resending, but confirm and resend purchases",
        "Send everything over TCP",
        "Send positions by email",
      ],
      answer: 1,
      explain: "A stale position is replaced 50 ms later anyway, but a purchase must happen exactly once. Apps on UDP add reliability only for the messages that need it (or send those over a separate reliable channel).",
    },
    {
      q: "Why do video calls often get blurrier when your connection gets worse?",
      options: [
        "The camera gets tired",
        "UDP doesn't slow down by itself, so the app lowers quality to send fewer bytes",
        "TCP compresses the video",
        "The router edits the video",
      ],
      answer: 1,
      explain: "Without TCP's congestion control, the app must adapt its own sending rate. Lower quality means fewer bytes and fewer losses.",
    },
  ],
  article: [
    {
      heading: "What is UDP?",
      paragraphs: [
        "UDP (User Datagram Protocol) is the minimal alternative to TCP for sending data over the internet. It adds port numbers and a checksum to an IP packet, and nothing else: no connection setup, no ordering, no acknowledgements, no retransmission and no congestion control. Each message, called a datagram, stands alone. It either arrives whole, or it doesn't arrive. That simplicity is the whole point: it's fast, predictable and lets applications decide for themselves what reliability they need.",
      ],
    },
    {
      heading: "How it works, step by step",
      paragraphs: [
        "A program wants to send a message, so it hands the bytes to UDP with a destination address and port. UDP wraps them in an 8-byte header (source port, destination port, length, checksum) and passes the packet to IP, which sends it toward the destination. That's it. The receiver's operating system checks the checksum, finds the program listening on that port and hands over the message. If the packet was lost, delayed or duplicated on the way, UDP does nothing about it; the receiving program sees exactly what arrived.",
      ],
    },
    {
      heading: "UDP versus TCP",
      paragraphs: [
        "TCP gives you a reliable, ordered stream but pays with a handshake before sending, waiting for acknowledgements, slowing down when packets are lost, and head-of-line blocking, where one missing segment delays everything after it. UDP gives you raw speed and predictability and leaves every decision about reliability to the application.",
        "Neither is better in general. TCP is right when every byte must arrive. UDP is right when freshness matters more than completeness, or when the application wants to build its own, more specialised reliability.",
      ],
    },
    {
      heading: "Worked example: a lost frame on a video call",
      paragraphs: [
        "A call sends 30 frames per second, one every 33 ms, between two people with a 60 ms round trip. Frame 20 is lost. Over UDP, the receiver shows frame 19 for one extra frame, then frame 21 arrives 33 ms later and the call continues: a 33 ms glitch.",
        "Over TCP, the receiver can't deliver frames 21, 22 or 23 until frame 20 is resent. The sender typically notices after a few duplicate acknowledgements, which takes around one round trip, and the resent frame takes half a round trip to arrive. That's roughly 90 ms or more of frozen video, during which three further frames pile up and are then shown all at once. Repeat that a few times per second on poor Wi-Fi and the call becomes unwatchable.",
      ],
    },
    {
      heading: "How apps build their own reliability on UDP",
      paragraphs: [
        "Because UDP does so little, apps can add exactly the features they need and nothing more. Common techniques include sequence numbers (so the receiver can spot gaps and reorder packets), selective resending (only for messages that matter, such as keyframes or game events), forward error correction (sending a little extra data so a lost packet can be rebuilt without asking again), and a jitter buffer (holding packets for a few tens of milliseconds so playback stays smooth even when arrival times vary).",
        "Rate control matters too. Video apps measure loss and delay continuously and switch between quality levels, perhaps 2.5 Mbit/s for HD and 300 kbit/s for low quality, so they use what the network can carry without flooding it.",
      ],
    },
    {
      heading: "When to choose UDP, and when to avoid it",
      paragraphs: [
        "Choose UDP when data goes stale quickly (voice, video, game state, sensor readings), when messages are tiny and cheap to retry (DNS), or when you're building a specialised protocol and want full control (QUIC). Avoid it when every message must arrive exactly once and in order, when you'd end up rebuilding all of TCP yourself, or when your users sit behind networks that block UDP. Many real systems use both: UDP for the live stream and TCP for chat, signalling and anything that must be reliable.",
      ],
    },
    {
      heading: "Common mistakes",
      paragraphs: [
        "Using UDP for data that must arrive complete, such as payments, messages or file chunks, without adding your own reliability. Assuming UDP is \"faster\" in every case: for bulk transfers, TCP's flow control often uses the link better. Forgetting congestion control: an app that blasts UDP at a fixed rate can flood networks and hurt everyone, including itself. Ignoring firewalls: some corporate networks block most UDP traffic, so real-time apps usually keep a TCP fallback.",
      ],
    },
    {
      heading: "Where UDP is used in real systems",
      paragraphs: [
        "Voice and video calling (WebRTC, used by Google Meet, Zoom, Discord and others) sends media over UDP with its own loss handling. Online games send position updates over UDP and add reliability only for important events. DNS uses UDP for its tiny question-and-answer messages and retries if no answer comes back. Live-streaming tools, network time sync (NTP) and many monitoring systems also use it.",
        "QUIC, the transport behind HTTP/3, is built on UDP. It implements its own streams, encryption and retransmission, so it gets reliability where needed without TCP's head-of-line blocking between streams. Google, Cloudflare and Meta serve a large share of their traffic over it.",
      ],
    },
    {
      heading: "In a system design interview",
      paragraphs: [
        "If you're designing a video-conferencing system, a multiplayer game, live streaming or real-time telemetry, mention UDP and explain the trade-off: you accept occasional loss in exchange for low, steady latency. Say what the application does about loss (skip it, conceal it, or resend only critical messages) and how it adapts its sending rate to network conditions. For anything where every message must arrive, such as chat messages, payments and orders, keep TCP or a reliable protocol on top. Being able to say which data tolerates loss is the key insight interviewers look for.",
      ],
    },
  ],
};

export default lesson;
