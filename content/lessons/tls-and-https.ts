import type { LessonContent } from "@/components/scene/types";

const go = ["lap", "r1", "srv"];
const back = ["srv", "r1", "lap"];
const links = [
  { from: "lap", to: "r1", style: "muted" as const, both: true },
  { from: "r1", to: "srv", style: "muted" as const, both: true },
];
const snoop = { from: "r1", to: "eve", style: "dashed" as const };

const lesson: LessonContent = {
  slug: "tls-and-https",
  intro:
    "On café Wi-Fi, anyone between you and the server could read plain traffic. TLS stops that. Watch the certificate check, the key exchange, and your data turning into scrambled bytes on the wire.",
  learn: [
    "What someone on the network can see without TLS",
    "How a certificate proves a server's identity",
    "How two machines agree on a secret key in public",
    "What HTTPS protects, and what it doesn't",
  ],
  keyIdea:
    "TLS gives you three things: privacy (nobody can read it), integrity (nobody can change it) and identity (you're talking to the real site). HTTPS is simply HTTP sent inside a TLS connection.",
  scene: {
    viewBox: [-500, -235, 1000, 570],
    entities: [
      { id: "desk", kind: "slab", at: [-340, 222], w: 110, h: 14, name: "you", nameIcon: "user" },
      { id: "laptop", kind: "laptop", at: [-340, 208] },
      { id: "r1", kind: "router", at: [-30, 140], name: "café Wi-Fi" },
      { id: "server", kind: "box", at: [290, 70], w: 84, h: 104, color: "blue", text: ["Bank"], textSize: 19, name: "bank.example", nameIcon: "globe" },
      { id: "eve", kind: "box", at: [90, 262], w: 42, h: 40, color: "pink", icon: "search", name: "snooper", nameOffset: [0, 52] },
    ],
    points: {
      lap: [-258, 160],
      r1: [-30, 122],
      srv: [222, 40],
      eve: [70, 220],
      lapLabel: [-360, 40],
      srvLabel: [290, -140],
      eveLabel: [270, 250],
      wire: [-20, 30],
    },
  },
  steps: [
    {
      title: "Plain HTTP can be read",
      body:
        "You log in over plain HTTP on café Wi-Fi. Your password travels as readable text, and anyone on the same network (or any router on the way) can copy it, or even change the page you get back.",
      links: [...links, snoop],
      packets: [
        { path: go, kind: "request", at: 0.3, dur: 1.6, tag: "password=hunter2" },
        { path: ["r1", "eve"], kind: "request", at: 1.1, dur: 0.9, tag: "copy" },
      ],
      labels: [{ at: "eveLabel", text: "I can read that!", icon: "search", tone: "orange", from: 2 }],
    },
    {
      title: "Hello, and here's my certificate",
      body:
        "With HTTPS, your browser first says hello and lists the encryption it supports. The server replies with its choice and its certificate: a document saying \"this key belongs to bank.example\", signed by a certificate authority.",
      links,
      packets: [
        { path: go, kind: "request", at: 0.3, dur: 1.5, tag: "hello" },
        { path: back, kind: "secure", at: 2, dur: 1.5, tag: "certificate" },
      ],
      labels: [{ at: "srvLabel", text: "I'm bank.example", icon: "key", from: 1.8 }],
    },
    {
      title: "Checking the certificate",
      body:
        "Your browser checks three things: the certificate is signed by an authority it already trusts, it's for bank.example and not some other name, and it hasn't expired. A fake server can't produce a valid one.",
      focus: ["laptop"],
      links,
      labels: [
        { at: "lapLabel", text: "trusted signer ✓", icon: "check", tone: "green", from: 0.3, until: 2.8 },
        { at: [-360, 0], text: "name matches ✓", icon: "check", tone: "green", from: 1, until: 2.8 },
        { at: [-360, -40], text: "not expired ✓", icon: "check", tone: "green", from: 1.7, until: 2.8 },
        { at: "lapLabel", text: "it's really the bank", icon: "lock", tone: "violet", from: 2.9 },
      ],
      hold: 2.4,
    },
    {
      title: "Agreeing on a secret key",
      body:
        "Both sides send each other a public key share. Thanks to some clever maths (Diffie-Hellman), each side combines its own secret with the other's share and gets the same session key, while the snooper, seeing both shares, can't work it out.",
      links: [...links, snoop],
      packets: [
        { path: go, kind: "secure", at: 0.3, dur: 1.5, tag: "key share" },
        { path: back, kind: "secure", at: 0.6, dur: 1.5, tag: "key share" },
      ],
      labels: [
        { at: "lapLabel", text: "same key, never sent", icon: "key", tone: "violet", from: 2.2 },
        { at: "srvLabel", text: "same key, never sent", icon: "key", tone: "violet", from: 2.2 },
        { at: "eveLabel", text: "can't compute it", icon: "search", tone: "muted", from: 2.5 },
      ],
    },
    {
      title: "Everything after is scrambled",
      body:
        "Now every request and response is encrypted with the session key, plus a tag that detects tampering. The snooper still sees packets go by, but only scrambled bytes, and any change would be caught.",
      links: [...links, snoop],
      packets: [
        { path: go, kind: "secure", at: 0.3, dur: 1.6, tag: "x9#f@1q…" },
        { path: ["r1", "eve"], kind: "secure", at: 1.1, dur: 0.9, tag: "x9#f@1q…" },
        { path: back, kind: "secure", at: 2.2, dur: 1.6, tag: "k2$Lz8…" },
      ],
      labels: [{ at: "eveLabel", text: "just noise", icon: "lock", tone: "muted", from: 2 }],
    },
    {
      title: "HTTPS, in one picture",
      body:
        "HTTPS is HTTP inside TLS. It hides what you send and receive, and proves who you're talking to. It doesn't hide which site you visit from your network, and it can't protect data once it's on the server.",
      note: "With TLS 1.3 the whole handshake costs just one round trip, so there's no good reason to serve anything over plain HTTP.",
      focus: ["server"],
      links: [
        { from: "lap", to: "r1", style: "pipe" },
        { from: "r1", to: "srv", style: "pipe" },
      ],
      packets: [
        { path: go, kind: "secure", at: 0.3, dur: 1.4 },
        { path: back, kind: "secure", at: 1.9, dur: 1.4 },
      ],
      labels: [
        { at: "wire", text: "privacy · integrity · identity", icon: "lock", tone: "violet", from: 0.3 },
      ],
    },
  ],
  quiz: [
    {
      q: "What does the server's certificate prove?",
      options: ["That the server is fast", "That the public key really belongs to bank.example", "That the user is logged in", "That the data is compressed"],
      answer: 1,
      explain: "A trusted authority has signed a statement binding the key to the domain name. Impostors can't forge that signature.",
    },
    {
      q: "During the key exchange, the snooper sees both key shares. Can they get the session key?",
      options: ["Yes, easily", "No: computing the key needs a secret that never leaves each machine", "Only if they ask the router", "Only on HTTP/2"],
      answer: 1,
      explain: "Diffie-Hellman lets both sides derive the same key from public shares plus private secrets that are never transmitted.",
    },
    {
      q: "Which of these does HTTPS NOT hide from your Wi-Fi provider?",
      options: ["Your password", "The page content", "Which site you're connecting to", "Your bank balance"],
      answer: 2,
      explain: "The destination (IP address, and usually the domain name) is still visible. The contents are what TLS protects.",
    },
  ],
  article: [
    {
      heading: "What TLS does",
      paragraphs: [
        "TLS (Transport Layer Security) wraps a connection in encryption. It provides privacy (eavesdroppers can't read the data), integrity (any modification is detected) and authentication (the client can verify the server's identity). HTTPS is HTTP carried over TLS, and it's now the default for the whole web.",
      ],
    },
    {
      heading: "Certificates and certificate authorities",
      paragraphs: [
        "A certificate binds a public key to a domain name and is digitally signed by a certificate authority (CA). Browsers and operating systems ship with a list of trusted CAs. When a server presents its certificate, the browser checks the signature chain back to a trusted root, checks that the name matches and checks the dates. Services like Let's Encrypt issue certificates for free and renew them automatically.",
      ],
    },
    {
      heading: "The handshake and the session key",
      paragraphs: [
        "In TLS 1.3 the client sends a hello with its supported ciphers and a key share; the server answers with its key share, its certificate and a proof that it owns the matching private key. Both sides derive the same symmetric session key using Diffie-Hellman key exchange. The handshake takes one round trip, and resumed sessions can even send data immediately.",
        "Bulk data is then encrypted with fast symmetric ciphers such as AES-GCM or ChaCha20-Poly1305, which also authenticate each record so tampering is detected.",
      ],
    },
    {
      heading: "TLS in system design",
      paragraphs: [
        "Large systems usually terminate TLS at the edge: a load balancer or reverse proxy holds the certificate, decrypts traffic and forwards it to internal services (often re-encrypted with mutual TLS inside the network). Terminating TLS close to users, for example at a CDN, also shortens the handshake round trips. Certificate renewal must be automated: an expired certificate takes a site down just as surely as a crashed server.",
      ],
    },
  ],
};

export default lesson;
