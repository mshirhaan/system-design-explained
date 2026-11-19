import type { LessonContent } from "@/components/scene/types";

const top = ["lap", "r2", "r4", "srv"];
const bottom = ["lap", "r1", "r3", "srv"];

const lesson: LessonContent = {
  slug: "ip-addresses-ports-and-packets",
  intro:
    "How does a photo get from your laptop to a server across the world? It's chopped into small packets, each stamped with addresses, and every packet finds its own way. Watch them split, scatter and reassemble.",
  learn: [
    "What an IP address is",
    "Why data travels as small packets",
    "How routers forward packets hop by hop",
    "Why packets can arrive out of order",
    "What ports are, and how one server runs many programs",
  ],
  keyIdea:
    "The internet moves small, addressed packets, not whole files. Routers forward each packet independently, and the receiver puts them back together. An IP address finds the machine; a port finds the program.",
  scene: {
    viewBox: [-500, -235, 1000, 570],
    entities: [
      { id: "desk", kind: "slab", at: [-360, 222], w: 110, h: 14, name: "your laptop", nameIcon: "user" },
      { id: "laptop", kind: "laptop", at: [-360, 208] },
      { id: "r2", kind: "router", at: [-150, -10], name: "router" },
      { id: "r4", kind: "router", at: [80, -40], name: "router" },
      { id: "r1", kind: "router", at: [-140, 170], name: "router" },
      { id: "r3", kind: "router", at: [60, 190], name: "router" },
      { id: "server", kind: "box", at: [300, 70], w: 80, h: 100, color: "blue", text: ["Server"], textSize: 18, name: "93.184.216.34" },
    ],
    points: {
      lap: [-278, 160],
      r1: [-140, 152],
      r2: [-150, -28],
      r3: [60, 172],
      r4: [80, -58],
      srv: [236, 40],
      lapLabel: [-390, 40],
      srvLabel: [300, -140],
      tokens: [-330, 66],
      buf: [240, -90],
      netLabel: [-40, 80],
      port443: [300, -190],
      port22: [300, -145],
    },
  },
  steps: [
    {
      title: "Every device has an address",
      body:
        "Every machine on the internet has an IP address, like a street address for computers. Your laptop has one, and so does the server you want to reach. Without an address, nothing can be delivered.",
      focus: ["laptop", "server"],
      labels: [
        { at: "lapLabel", text: "me: 203.0.113.7", icon: "user", from: 0.3 },
        { at: "srvLabel", text: "93.184.216.34", icon: "globe", from: 0.9 },
      ],
      hold: 2.4,
    },
    {
      title: "Big messages are split into packets",
      body:
        "You're uploading a photo. It's far too big to send in one piece, so it's chopped into packets of about 1,500 bytes each. Every packet gets a header with the sender's address, the receiver's address and its position in the sequence.",
      tokens: [
        {
          at: "tokens",
          gap: [26, 0],
          items: [1, 2, 3, 4].map((n, i) => ({ kind: "message" as const, tag: `#${n}`, from: 0.4 + i * 0.35 })),
        },
      ],
      labels: [{ at: [-390, -10], text: "photo → 4 packets", icon: "page", tone: "yellow", from: 0.2 }],
    },
    {
      title: "Each packet finds its own way",
      body:
        "Routers pass packets along, one hop at a time, each choosing the next hop toward the destination. Different packets of the same photo can take different routes, depending on traffic at that moment.",
      links: [
        { from: "lap", to: "r1", style: "muted" },
        { from: "r1", to: "r3", style: "muted" },
        { from: "r3", to: "srv", style: "muted" },
        { from: "lap", to: "r2", style: "muted" },
        { from: "r2", to: "r4", style: "muted" },
        { from: "r4", to: "srv", style: "muted" },
      ],
      packets: [
        { path: bottom, kind: "message", at: 0.2, dur: 2.6, tag: "#1" },
        { path: top, kind: "message", at: 0.5, dur: 1.8, tag: "#2" },
        { path: bottom, kind: "message", at: 0.8, dur: 2.6, tag: "#3" },
        { path: top, kind: "message", at: 1.1, dur: 1.8, tag: "#4" },
      ],
      labels: [{ at: "netLabel", text: "no fixed route", icon: "globe", tone: "muted", from: 0.2 }],
    },
    {
      title: "Reassembled in order",
      body:
        "Because routes differ, packets arrive out of order: here #2 lands before #1. The receiver uses the sequence numbers to slot each one into place, and only hands the photo to the program once it's complete.",
      links: [
        { from: "lap", to: "r1", style: "muted" },
        { from: "r1", to: "r3", style: "muted" },
        { from: "r3", to: "srv", style: "muted" },
        { from: "lap", to: "r2", style: "muted" },
        { from: "r2", to: "r4", style: "muted" },
        { from: "r4", to: "srv", style: "muted" },
      ],
      packets: [
        { path: bottom, kind: "message", at: 0.2, dur: 2.6, tag: "#1" },
        { path: top, kind: "message", at: 0.5, dur: 1.8, tag: "#2" },
        { path: bottom, kind: "message", at: 0.8, dur: 2.6, tag: "#3" },
        { path: top, kind: "message", at: 1.1, dur: 1.8, tag: "#4" },
      ],
      tokens: [
        {
          at: "buf",
          gap: [26, 0],
          items: [
            { kind: "message", tag: "1", from: 2.8 },
            { kind: "message", tag: "2", from: 2.3 },
            { kind: "message", tag: "3", from: 3.4 },
            { kind: "message", tag: "4", from: 2.9 },
          ],
        },
      ],
      labels: [{ at: "srvLabel", text: "photo complete", icon: "check", tone: "green", from: 3.8 }],
    },
    {
      title: "Ports pick the program",
      body:
        "One server runs many programs: a web server, a remote-login service, maybe a database. The IP address gets a packet to the machine; the port number gets it to the right program. Web traffic uses port 443.",
      links: [
        { from: "lap", to: "r2", style: "muted" },
        { from: "r2", to: "r4", style: "muted" },
        { from: "r4", to: "srv", style: "muted" },
      ],
      packets: [{ path: top, kind: "request", at: 0.4, dur: 1.8, tag: "to :443" }],
      labels: [
        { at: "port443", text: ":443 → web server", icon: "globe", tone: "green", from: 2.2 },
        { at: "port22", text: ":22 → remote login", icon: "key", tone: "muted", from: 0.3 },
      ],
    },
    {
      title: "Address + port = a socket",
      body:
        "Put the two together, 93.184.216.34:443, and you have a socket: the exact endpoint of a conversation. Every connection on the internet is identified by a pair of sockets, one at each end.",
      focus: ["server"],
      labels: [
        { at: "srvLabel", text: "93.184.216.34:443", icon: "globe", tone: "yellow", from: 0.2, size: 16 },
        { at: "lapLabel", text: "203.0.113.7:51544", icon: "user", tone: "yellow", from: 0.8, size: 16 },
      ],
      links: [{ from: "lap", to: "srv", style: "dashed", both: true }],
      hold: 3,
    },
  ],
  quiz: [
    {
      q: "Why is a large file split into packets?",
      options: [
        "To encrypt it",
        "So it can be sent in small, independently routed pieces and resent piece by piece",
        "Because servers can only store small files",
        "To change its file type",
      ],
      answer: 1,
      explain: "Small packets share network links fairly, can take different routes, and only a lost piece needs resending.",
    },
    {
      q: "Packets #1 and #2 of the same file took different routes. What can happen?",
      options: ["Nothing, they always arrive in order", "They can arrive out of order", "The file is corrupted forever", "The router merges them"],
      answer: 1,
      explain: "Different routes have different delays. Sequence numbers let the receiver put packets back in order.",
    },
    {
      q: "What does a port number identify?",
      options: ["The country of the server", "The program on the machine that should get the packet", "The speed of the connection", "The user's password"],
      answer: 1,
      explain: "The IP address finds the machine; the port finds the program, such as 443 for HTTPS or 22 for SSH.",
    },
  ],
  article: [
    {
      heading: "IP addresses: how machines are found",
      paragraphs: [
        "Every device connected to the internet has an IP address. IPv4 addresses look like 93.184.216.34 (about 4.3 billion possible), and the newer IPv6 addresses look like 2606:2800:220:1::1 (enough for every grain of sand many times over). Your home network usually shares one public address among all your devices, using a technique called NAT.",
      ],
    },
    {
      heading: "Packets: why data is chopped up",
      paragraphs: [
        "Data crosses the internet in packets, typically up to about 1,500 bytes each. Each packet has a header with the source address, destination address and other bookkeeping, followed by a slice of the actual data.",
        "Packets let many conversations share the same cables fairly, let routers make quick decisions about each piece, and mean that if one piece is lost, only that piece needs to be sent again.",
      ],
    },
    {
      heading: "Routers and routing",
      paragraphs: [
        "Routers are the post offices of the internet. When a packet arrives, a router looks at its destination address and forwards it to the next router that's closer. A packet might pass through 10 to 20 routers to reach a distant server. Because each packet is routed independently, packets from the same message can take different paths and arrive out of order.",
      ],
    },
    {
      heading: "Ports and sockets",
      paragraphs: [
        "A single server runs many programs, so an address alone isn't enough. Ports, numbered 0 to 65535, pick the program: 443 for HTTPS, 80 for HTTP, 22 for SSH, 5432 for PostgreSQL. An address plus a port is a socket, and a connection is identified by the sockets at both ends. That's how one server can hold thousands of simultaneous connections on port 443.",
      ],
    },
  ],
};

export default lesson;
