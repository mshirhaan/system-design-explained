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
    "The internet loses and shuffles packets all the time, yet your downloads arrive perfect. TCP is the reason. Watch it open a connection, number every piece of data, confirm each delivery, notice a lost packet and send it again.",
  learn: [
    "Why TCP starts every connection with a three-message handshake",
    "How sequence numbers keep data in the right order",
    "What acknowledgements (ACKs) are and why the sender waits for them",
    "How a lost packet is detected and resent",
    "Why TCP slows down when the network gets busy",
  ],
  keyIdea:
    "TCP turns an unreliable network into a reliable stream: every byte is numbered, every delivery is acknowledged, and anything unacknowledged is sent again. The price is extra round trips and, sometimes, waiting.",
  terms: [
    { term: "TCP", meaning: "Transmission Control Protocol: the rules that give two machines a reliable, ordered connection." },
    { term: "Handshake", meaning: "The three opening messages (SYN, SYN-ACK, ACK) that set up a TCP connection." },
    { term: "Segment", meaning: "A piece of data TCP sends inside one packet, labelled with a sequence number." },
    { term: "Sequence number", meaning: "A number on each segment saying where its data belongs in the stream." },
    { term: "ACK", meaning: "Acknowledgement: a reply saying \"I've received everything up to here\"." },
    { term: "Retransmission", meaning: "Sending a segment again because it was never acknowledged." },
    { term: "Congestion window", meaning: "How many unacknowledged segments the sender allows itself to have in flight at once." },
  ],
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
      lapLabel: [-300, 40],
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
        "You start downloading a file. Before any data moves, TCP sets up a connection with three messages. Your laptop sends SYN (\"let's talk, I'll number my data starting here\"), the server replies SYN-ACK (\"agreed, and here's my starting number\"), and your laptop confirms with ACK. This costs one full round trip, about 30 ms in this example, before a single byte of the file is sent.",
      links,
      packets: [
        { path: go, kind: "request", at: 0.3, dur: 1.4, tag: "SYN" },
        { path: back, kind: "response", at: 1.9, dur: 1.4, tag: "SYN-ACK" },
        { path: go, kind: "request", at: 3.5, dur: 1.4, tag: "ACK" },
      ],
      labels: [{ at: "netLabel", text: "1 round trip before any data moves", icon: "clock", tone: "muted", from: 0.2 }],
    },
    {
      title: "Data in numbered segments",
      body:
        "Now the file flows as segments, pieces of data that each fit in one packet, and every segment carries a sequence number. The server drops each one into its receive buffer, a waiting area, in the slot its number says. Thanks to the numbers, the order is always correct, however the packets travel. Here segments 1, 2 and 3 arrive in turn.",
      links,
      packets: [
        { path: go, kind: "message", at: 0.2, dur: 1.4, tag: "seq 1" },
        { path: go, kind: "message", at: 0.6, dur: 1.4, tag: "seq 2" },
        { path: go, kind: "message", at: 1, dur: 1.4, tag: "seq 3" },
      ],
      tokens: [{ at: "buf", gap: [26, 0], items: [1, 2, 3].map((n, i) => ({ kind: "message" as const, tag: String(n), from: 1.6 + i * 0.4 })) }],
      labels: [{ at: "srvLabel", text: "receive buffer, in order", icon: "page", from: 0.2 }],
    },
    {
      title: "Acknowledgements come back",
      body:
        "For what it receives, the server sends back an ACK naming the next number it expects. \"ACK 4\" means \"I have everything up to 3, send 4 next\". Until a segment is acknowledged, your laptop keeps a copy of it, just in case. Once the ACK arrives, it can throw the copy away and send more.",
      links,
      packets: [
        { path: back, kind: "response", at: 0.3, dur: 1.4, tag: "ACK 2" },
        { path: back, kind: "response", at: 0.7, dur: 1.4, tag: "ACK 3" },
        { path: back, kind: "response", at: 1.1, dur: 1.4, tag: "ACK 4" },
      ],
      tokens: [{ at: "buf", gap: [26, 0], items: [1, 2, 3].map((n) => ({ kind: "message" as const, tag: String(n) })) }],
      labels: [{ at: "lapLabel", text: "segments 1 to 3 delivered", icon: "check", tone: "green", from: 2.6 }],
    },
    {
      title: "A packet gets lost",
      body:
        "Segments 4, 5 and 6 go out. Segment 5 is dropped by a busy router, which happens constantly on real networks: around 1 packet in 100 on a typical connection, more on poor Wi-Fi. The server receives 4 and 6 and sees a gap where 5 should be. It keeps 6 in the buffer but can't pass anything after 4 to the program yet.",
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
      labels: [{ at: "srvLabel", text: "got 4 and 6, but 5 is missing", icon: "search", tone: "orange", from: 2.5 }],
    },
    {
      title: "Noticed, and sent again",
      body:
        "The server keeps replying \"ACK 5\", meaning \"I still need 5\". When your laptop sees the same ACK repeated, or a timer runs out without an ACK, it resends segment 5 from the copy it kept. This is called retransmission. The gap fills, and the server can now pass 4, 5 and 6 up to the program in order.",
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
      labels: [{ at: "lapLabel", text: "same ACK twice, so resend 5", icon: "bolt", tone: "yellow", from: 1.9 }],
    },
    {
      title: "The cost: waiting in line",
      body:
        "While segment 5 was missing, segment 6 sat in the buffer, ready but unusable, because TCP always delivers data in order. This is called head-of-line blocking: one missing piece holds up everything behind it. For a file download that's fine; a short pause is better than a corrupted file. For live video or games it can cause visible freezes.",
      note: "Head-of-line blocking is why live video and games often use UDP instead, and why HTTP/3 was built on a newer protocol. Lessons 1.6 and 1.8 cover both.",
      links,
      tokens: [
        {
          at: "buf",
          gap: [26, 0],
          items: [
            { kind: "message", tag: "4" },
            { kind: "empty", tag: "?" },
            { kind: "message", tag: "6" },
          ],
        },
      ],
      labels: [{ at: "srvLabel", text: "6 waits until 5 arrives", icon: "clock", tone: "orange", from: 0.3 }],
      hold: 3,
    },
    {
      title: "Slowing down when it's busy",
      body:
        "A lost packet is also a hint that some router on the way is overloaded. TCP reacts by sending fewer segments at once: it shrinks its congestion window, the number of unacknowledged segments it allows in flight. Then it grows the window again step by step while things go well. Here it drops to 2 segments in flight, then climbs back to 3.",
      note: "Without this behaviour, every computer would keep blasting data into a jammed network and the internet would grind to a halt. That actually happened in 1986, which is why congestion control was invented.",
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
        { at: "lapLabel", text: "2 segments in flight at once", icon: "clock", tone: "orange", from: 0.2, until: 3.3 },
        { at: "lapLabel", text: "window grows to 3", icon: "bolt", tone: "green", from: 3.4 },
      ],
    },
    {
      title: "Closing the connection",
      body:
        "When the transfer is done, each side says it has finished sending with a FIN message, and the other acknowledges it. Every byte arrived exactly once and in order, built on top of a network that guarantees none of that. Opening and closing connections costs round trips, which is why browsers and servers keep connections open and reuse them for many requests.",
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
      explain: "TCP acknowledgements name the next piece expected. Repeating ACK 5 tells the sender that 5 is still missing.",
    },
    {
      q: "How does the sender know it should resend a segment?",
      options: [
        "The router sends an error message",
        "It sees repeated ACKs for the same number, or its timer runs out without an ACK",
        "The user presses refresh",
        "It never resends",
      ],
      answer: 1,
      explain: "Duplicate ACKs trigger a fast retransmission; a timeout catches everything else.",
    },
    {
      q: "Why does TCP send less data right after a loss?",
      options: ["To save battery", "Loss usually means congestion, so it backs off to avoid overloading the network", "Because the file got smaller", "The server asked it to stop"],
      answer: 1,
      explain: "Congestion control shrinks the window after loss and grows it again gradually, keeping shared links usable for everyone.",
    },
    {
      q: "Segment 5 is lost but 6, 7 and 8 arrive. What does the receiving program get in the meantime?",
      options: ["6, 7 and 8 immediately", "Nothing after 4, until 5 is resent and arrives", "A corrupted file", "Only 8"],
      answer: 1,
      explain: "TCP delivers data strictly in order, so 6, 7 and 8 wait in the buffer. This is head-of-line blocking.",
    },
    {
      q: "Your service makes a new TCP connection for every tiny request to a server 100 ms away. What's the main waste?",
      options: ["Disk space", "A handshake round trip (100 ms) before every request", "CPU on the router", "Nothing, connections are free"],
      answer: 1,
      explain: "Each new connection pays a round trip for the handshake (and more for TLS). Reusing connections, for example with a connection pool, avoids that cost.",
    },
  ],
  article: [
    {
      heading: "What TCP is and what it guarantees",
      paragraphs: [
        "The Internet Protocol (IP) only promises \"best effort\" delivery: packets may be lost, duplicated, delayed or reordered. TCP (Transmission Control Protocol) runs on top of IP and turns that into a reliable, ordered stream of bytes between two programs. If TCP says data was delivered, it arrived complete, in order and exactly once.",
        "Most of what you use relies on it: web pages over HTTP/1.1 and HTTP/2, database connections, SSH, email and file transfers.",
      ],
    },
    {
      heading: "How it works, step by step",
      paragraphs: [
        "Connection setup: the three-way handshake (SYN, SYN-ACK, ACK) lets both sides agree to talk and exchange their starting sequence numbers. Sending: data is split into segments, each tagged with a sequence number. Acknowledging: the receiver replies with the next sequence number it expects. Retransmitting: the sender keeps unacknowledged data and resends it after three duplicate ACKs (fast retransmit) or when a retransmission timer expires. Closing: each side sends FIN when it's done.",
        "The receiver holds out-of-order segments in a buffer and only delivers data to the application once any gaps are filled.",
      ],
    },
    {
      heading: "Worked example: a 1 MB download with one loss",
      paragraphs: [
        "A 1 MB file is about 700 segments of 1,460 bytes. With a round-trip time of 30 ms, the handshake costs 30 ms. TCP starts cautiously, sending about 10 segments, then roughly doubles the amount in flight each round trip while ACKs come back (a phase called slow start): 10, 20, 40, 80, 160… After about 6 round trips (180 ms), most of the file has been sent.",
        "If segment 300 is lost, the receiver keeps acknowledging 300 while later segments arrive. After three duplicate ACKs, the sender resends 300, typically costing one extra round trip (30 ms), and halves its window, so the rest of the transfer goes a little slower. One loss in 700 segments might add 10–20% to the total time.",
      ],
    },
    {
      heading: "Why packets get lost in the first place",
      paragraphs: [
        "Most packet loss isn't caused by broken cables. It happens when a router receives packets faster than it can send them on. Each router has a small queue for waiting packets; when that queue is full, new arrivals are simply dropped. Wireless links add their own losses from interference and weak signals, which is why loss on a café's Wi-Fi can be ten times higher than on a wired office connection.",
        "This is why TCP treats loss as a signal of congestion: in most cases, a dropped packet really does mean some router on the path is overloaded, and the kindest thing every sender can do is slow down a little.",
      ],
    },
    {
      heading: "Flow control and congestion control",
      paragraphs: [
        "Flow control protects a slow receiver: in every ACK, the receiver advertises how much buffer space it has left, and the sender never sends more than that.",
        "Congestion control protects the network. The sender limits how much unacknowledged data is in flight (the congestion window), grows it while things go well and cuts it when packets are lost. Modern algorithms like CUBIC (the Linux default) and Google's BBR differ in how aggressively they grow and how they detect congestion, but all share the goal of using available bandwidth without overwhelming routers.",
      ],
    },
    {
      heading: "Trade-offs: reliability isn't free",
      paragraphs: [
        "TCP's guarantees cost time. Every new connection pays a handshake round trip before sending data (two or three with TLS on top). Strict ordering means one lost segment blocks everything behind it (head-of-line blocking). And throughput depends on round-trip time: a connection across an ocean ramps up slowly and recovers slowly from loss.",
        "For most data, such as web pages, API calls, payments and files, that trade is worth it. For live media and games, where late data is useless, UDP or protocols built on it are usually better.",
        "On the web, TCP almost always carries TLS encryption on top. That means a brand-new HTTPS connection costs the TCP handshake (one round trip) plus the TLS handshake (one more with TLS 1.3, two with older versions) before the first request can be sent. Across an ocean, that's 300 ms or more of setup. Reusing connections, resuming TLS sessions and terminating connections close to users (at a CDN) all exist to avoid paying that setup cost again and again.",
      ],
    },
    {
      heading: "Common mistakes",
      paragraphs: [
        "Opening a new connection per request: use keep-alive and connection pools instead. Assuming TCP means \"the other side processed my message\": an ACK only means the bytes reached the other computer's TCP stack, not that the application handled them, so you still need application-level confirmations and idempotency. Ignoring timeouts: a TCP connection to a dead machine can hang for minutes without application-level timeouts.",
      ],
    },
    {
      heading: "TCP in real systems",
      paragraphs: [
        "Load balancers and reverse proxies such as Nginx and HAProxy keep long-lived TCP connections to backend servers so each user request doesn't pay a new handshake. Database drivers maintain connection pools for the same reason. CDNs terminate TCP close to users, so the slow ramp-up happens over a short distance. Large companies tune congestion control: Google switched much of its traffic to BBR, which improved throughput on lossy links.",
      ],
    },
    {
      heading: "In a system design interview",
      paragraphs: [
        "You'll rarely be asked to explain TCP's internals, but it underpins good answers. Mention connection reuse and pooling when services call each other or a database. When latency matters, remember that new connections cost round trips. When designing real-time features like video calls or game state, explain why you'd choose UDP or WebRTC over TCP: head-of-line blocking and retransmission delays hurt live data more than occasional loss.",
      ],
    },
  ],
};

export default lesson;
