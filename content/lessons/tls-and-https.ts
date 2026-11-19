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
    "On café Wi-Fi, anyone between you and a website could read or change plain web traffic. TLS, the S in HTTPS, stops that. Watch a password leak over plain HTTP, then follow the certificate check, the secret-key agreement and your data turning into scrambled bytes on the wire.",
  learn: [
    "What someone on your network can see and change without encryption",
    "How a certificate proves a website is genuine",
    "How two machines agree on a secret key in full view of a snooper",
    "What HTTPS protects, and what it doesn't",
    "What TLS costs in time, and how sites keep that cost low",
  ],
  keyIdea:
    "TLS gives you three things: privacy (nobody in between can read it), integrity (nobody can change it unnoticed) and identity (you're really talking to the site you meant). HTTPS is simply ordinary web traffic sent inside a TLS connection.",
  terms: [
    { term: "TLS", meaning: "Transport Layer Security: the standard way to encrypt a connection and prove the server's identity." },
    { term: "HTTPS", meaning: "Web traffic (HTTP) sent inside a TLS-encrypted connection; shown by the padlock in your browser." },
    { term: "Encryption", meaning: "Scrambling data so only someone with the right key can turn it back into readable form." },
    { term: "Certificate", meaning: "A digital ID card for a website, saying which name its key belongs to." },
    { term: "Certificate authority (CA)", meaning: "A trusted organisation that checks domain ownership and signs certificates." },
    { term: "Session key", meaning: "A secret key both sides work out during the handshake and use to encrypt that connection." },
    { term: "Man-in-the-middle", meaning: "An attacker who sits between you and a server, reading or changing traffic." },
  ],
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
      lapLabel: [-300, 40],
      lapLabel2: [-300, 0],
      lapLabel3: [-300, -40],
      srvLabel: [290, -140],
      eveLabel: [290, 250],
      wire: [-20, 30],
    },
  },
  steps: [
    {
      title: "Plain HTTP can be read",
      body:
        "You log in to a website over plain HTTP while on café Wi-Fi. Your password travels as readable text inside each packet. Anyone on the same network, or any router along the way, can copy it as it passes. Here a snooper connected to the café's Wi-Fi quietly reads every packet you send.",
      links: [...links, snoop],
      packets: [
        { path: go, kind: "request", at: 0.3, dur: 1.6, tag: "password=hunter2" },
        { path: ["r1", "eve"], kind: "request", at: 1.1, dur: 0.9, tag: "a copy" },
      ],
      labels: [{ at: "eveLabel", text: "I can read your password", icon: "search", tone: "orange", from: 2 }],
    },
    {
      title: "It can be changed, too",
      body:
        "Reading isn't the only danger. Someone in the middle of the connection, called a man-in-the-middle, can also change what you receive. They could swap the bank's page for a fake login form, insert adverts, or alter the account number on a payment page. Over plain HTTP, your browser has no way to tell.",
      links: [...links, snoop],
      packets: [
        { path: ["srv", "r1"], kind: "response", at: 0.3, dur: 1.1, tag: "real page" },
        { path: ["r1", "lap"], kind: "request", at: 1.6, dur: 1.1, tag: "fake login form" },
      ],
      labels: [
        { at: "eveLabel", text: "and I can change what you see", icon: "search", tone: "orange", from: 1.1 },
        { at: "lapLabel", text: "looks normal to you", icon: "info", tone: "muted", from: 2.7 },
      ],
    },
    {
      title: "Hello, and here's my certificate",
      body:
        "With HTTPS, your browser starts with a TLS handshake. It says hello and lists the encryption methods it supports. The server replies with its choice and its certificate: a digital ID card saying \"this key belongs to bank.example\", signed by a certificate authority, an organisation browsers trust to check who owns which domain.",
      links,
      packets: [
        { path: go, kind: "request", at: 0.3, dur: 1.5, tag: "hello" },
        { path: back, kind: "secure", at: 2, dur: 1.5, tag: "certificate" },
      ],
      labels: [{ at: "srvLabel", text: "here is my ID: bank.example", icon: "key", from: 1.8 }],
    },
    {
      title: "Checking the certificate",
      body:
        "Your browser checks three things. Is the certificate signed by an authority it already trusts? Is it for bank.example and not some other name? Has it expired? It also checks that the server can prove it holds the private key matching the certificate. A fake server can't pass all of these, so the browser would show a full-page warning instead.",
      focus: ["laptop"],
      links,
      labels: [
        { at: "lapLabel3", text: "signed by a trusted authority", icon: "check", tone: "green", from: 0.3, until: 3 },
        { at: "lapLabel2", text: "the name matches", icon: "check", tone: "green", from: 1, until: 3 },
        { at: "lapLabel", text: "not expired", icon: "check", tone: "green", from: 1.7, until: 3 },
        { at: "lapLabel", text: "it's really the bank", icon: "lock", tone: "violet", from: 3.1 },
      ],
      hold: 2.4,
    },
    {
      title: "Agreeing on a secret key",
      body:
        "Now both sides need a shared secret key, but the snooper sees everything they send. The trick, called Diffie-Hellman key exchange, is that each side keeps a private number and sends only a public value made from it. Each side combines its own private number with the other's public value and gets the same session key. The snooper sees both public values but can't work out the key.",
      note: "A common analogy: each side mixes a secret paint colour into a shared base colour and swaps the mixtures. Adding your own secret again gives both sides the same final colour, but unmixing paint is practically impossible.",
      links: [...links, snoop],
      packets: [
        { path: go, kind: "secure", at: 0.3, dur: 1.5, tag: "my public value" },
        { path: back, kind: "secure", at: 0.6, dur: 1.5, tag: "my public value" },
      ],
      labels: [
        { at: "lapLabel", text: "same key, never sent", icon: "key", tone: "violet", from: 2.2 },
        { at: "srvLabel", text: "same key, never sent", icon: "key", tone: "violet", from: 2.2 },
        { at: "eveLabel", text: "I can't work out the key", icon: "search", tone: "muted", from: 2.5 },
      ],
    },
    {
      title: "Everything after is scrambled",
      body:
        "From here on, every request and response is encrypted with the session key and carries a tag that reveals any tampering. The snooper still sees packets go by, and roughly how big they are, but only as scrambled bytes. If anyone changes a single bit, the tag no longer matches and the browser rejects the data.",
      links: [...links, snoop],
      packets: [
        { path: go, kind: "secure", at: 0.3, dur: 1.6, tag: "x9#f@1q…" },
        { path: ["r1", "eve"], kind: "secure", at: 1.1, dur: 0.9, tag: "x9#f@1q…" },
        { path: back, kind: "secure", at: 2.2, dur: 1.6, tag: "k2$Lz8…" },
      ],
      labels: [{ at: "eveLabel", text: "only scrambled bytes now", icon: "lock", tone: "muted", from: 2 }],
    },
    {
      title: "What HTTPS doesn't hide",
      body:
        "HTTPS protects the contents of the conversation, not the fact that it happens. Your network can still see that you connected to bank.example, when, and roughly how much data moved. And once your data reaches the bank's server, protecting it is the bank's job: TLS only guards it while travelling.",
      links: [...links, snoop],
      packets: [{ path: go, kind: "secure", at: 0.3, dur: 1.6 }],
      labels: [
        { at: "eveLabel", text: "I still see you visited the bank", icon: "search", tone: "muted", from: 0.4 },
        { at: "srvLabel", text: "stored data needs its own protection", icon: "lock", from: 1.4 },
      ],
    },
    {
      title: "HTTPS, and what it costs",
      body:
        "HTTPS is ordinary web traffic sent inside TLS. With TLS 1.3, the current version, the handshake adds just one round trip to a new connection, and returning visitors can often skip even that. The encryption itself is so fast on modern chips that it's barely measurable. That's why every serious site now uses HTTPS, and browsers mark plain HTTP pages as \"Not secure\".",
      note: "Certificates are free and renew automatically with services like Let's Encrypt. An expired certificate takes a site offline as surely as a crashed server, so renewal must be automated.",
      focus: ["server"],
      links: [
        { from: "lap", to: "r1", style: "pipe" },
        { from: "r1", to: "srv", style: "pipe" },
      ],
      packets: [
        { path: go, kind: "secure", at: 0.3, dur: 1.4 },
        { path: back, kind: "secure", at: 1.9, dur: 1.4 },
      ],
      labels: [{ at: "wire", text: "private, untampered and genuine", icon: "lock", tone: "violet", from: 0.3 }],
    },
  ],
  quiz: [
    {
      q: "What does the server's certificate prove?",
      options: ["That the server is fast", "That the key really belongs to bank.example", "That the user is logged in", "That the data is compressed"],
      answer: 1,
      explain: "A trusted authority has signed a statement tying the key to the domain name. An impostor can't forge that signature.",
    },
    {
      q: "During the key exchange, the snooper sees both public values. Can they work out the session key?",
      options: ["Yes, easily", "No: it also needs a private number that never leaves each machine", "Only if they ask the router", "Only on HTTP/2"],
      answer: 1,
      explain: "Diffie-Hellman lets both sides derive the same key from public values plus private numbers that are never sent.",
    },
    {
      q: "Which of these does HTTPS NOT hide from the café's Wi-Fi operator?",
      options: ["Your password", "The page content", "Which site you're connecting to", "Your account balance"],
      answer: 2,
      explain: "The destination (IP address, and usually the domain name) is still visible. TLS protects the contents.",
    },
    {
      q: "On public Wi-Fi, someone tries to replace a bank's page with a fake one. With HTTPS, what happens?",
      options: [
        "The fake page loads normally",
        "The browser detects it: the attacker can't produce a valid certificate or valid encrypted data",
        "The bank's server crashes",
        "The Wi-Fi disconnects",
      ],
      answer: 1,
      explain: "Without the bank's private key the attacker can't pass the certificate check, and any change to encrypted data breaks its integrity tag.",
    },
    {
      q: "A site's certificate expires at midnight and nobody renews it. What do users see the next morning?",
      options: ["Nothing changes", "A full-page browser warning, and most users leave", "A faster site", "Plain HTTP automatically"],
      answer: 1,
      explain: "Browsers refuse expired certificates. For users it looks like an outage, which is why automated renewal matters.",
    },
  ],
  article: [
    {
      heading: "What TLS and HTTPS are",
      paragraphs: [
        "TLS (Transport Layer Security) wraps a network connection in encryption. It provides three guarantees: privacy (eavesdroppers can't read the data), integrity (any modification is detected) and authentication (the client can verify the server's identity). HTTPS is ordinary HTTP carried inside a TLS connection, and it's now the default for the whole web: well over 90% of page loads in Chrome use it.",
        "TLS replaced an older protocol called SSL, which is why people still say \"SSL certificate\".",
        "Without encryption, every router and network between you and a server can read your traffic: passwords, cookies, messages, card numbers. On shared networks like café or airport Wi-Fi, anyone nearby can capture it with free tools. Worse, they can modify it: inject adverts or malware, swap a login form for a phishing page, or change payment details. With plain HTTP, the browser has no way to notice.",
      ],
    },
    {
      heading: "Certificates and certificate authorities",
      paragraphs: [
        "A certificate binds a public key to a domain name and is digitally signed by a certificate authority (CA). Browsers and operating systems ship with a list of a few dozen trusted root CAs. When a server presents its certificate, the browser follows the chain of signatures back to a trusted root, checks that the name matches the site, checks the dates, and checks that the server can prove it holds the matching private key.",
        "Getting a certificate means proving to a CA that you control the domain, usually by placing a file on the site or a record in DNS. Let's Encrypt issues certificates free and automatically, and now secures hundreds of millions of sites.",
      ],
    },
    {
      heading: "How the handshake works, step by step",
      paragraphs: [
        "In TLS 1.3, the client sends a hello listing its supported ciphers along with its half of a Diffie-Hellman key exchange. The server replies with its half, its certificate and a signature proving it owns the certificate's private key. Both sides now compute the same session key, and everything that follows is encrypted with fast symmetric ciphers such as AES-GCM or ChaCha20-Poly1305. Each encrypted record carries an authentication tag, so tampering is detected.",
        "The whole handshake takes one round trip. Returning clients can resume a previous session and, with 0-RTT, even send their first request in the very first message.",
      ],
    },
    {
      heading: "Worked example: what TLS costs",
      paragraphs: [
        "A user in London connects to a server in New York with a 75 ms round-trip time. A new HTTPS connection costs one round trip for TCP and one for TLS 1.3: 150 ms before the first request can be sent. With the older TLS 1.2 it would be 225 ms. If the site uses a CDN with an edge server in London (5 ms round trip), the same setup takes about 10 ms, because the handshakes happen nearby and the CDN keeps warm connections to New York.",
        "The encryption itself costs almost nothing: modern CPUs encrypt several gigabytes per second per core using built-in AES instructions.",
      ],
    },
    {
      heading: "Trade-offs: where should encryption end?",
      paragraphs: [
        "Terminating TLS at the load balancer is simple: one place holds certificates, backend servers don't spend effort on encryption, and the load balancer can read requests to route them, cache them or block attacks. The trade-off is that traffic inside your network travels unencrypted unless you encrypt it again. For most sites that's acceptable inside a private network; for banks, health data and anything regulated, encrypting internal traffic too (mutual TLS) is expected.",
        "Another trade-off is visibility. Encrypted traffic can't be inspected by network tools, so debugging and security monitoring have to happen at the points where traffic is decrypted, such as the load balancer and the services themselves.",
      ],
    },
    {
      heading: "In transit versus at rest",
      paragraphs: [
        "TLS protects data in transit: while it travels between machines. It does nothing for data at rest, meaning data sitting in a database, a file or a backup. If an attacker steals a database backup, TLS is irrelevant. Protecting stored data needs separate measures: disk or database encryption, encrypted backups, careful key management and strict access controls. Sensitive systems need both.",
      ],
    },
    {
      heading: "Common misconceptions",
      paragraphs: [
        "\"HTTPS means the site is trustworthy.\" It only means the connection is private and the site controls that domain; scam sites can have certificates too. \"HTTPS hides which sites I visit.\" Your network still sees the destination address and usually the domain name. \"Only login pages need HTTPS.\" Any unencrypted page can be modified to steal data or inject malware, so every page should use it. \"Encryption makes sites slow.\" With TLS 1.3 and connection reuse, the overhead is small.",
      ],
    },
    {
      heading: "TLS in real systems",
      paragraphs: [
        "Large systems usually terminate TLS at the edge: a load balancer, reverse proxy or CDN (Cloudflare, Amazon CloudFront, Nginx) holds the certificate, decrypts incoming traffic and forwards it to internal services. Inside the data centre, traffic between services is often encrypted again with mutual TLS (mTLS), where both sides present certificates. Service meshes like Istio and Linkerd automate this. Certificate management tools renew certificates automatically, because an expired certificate is one of the most common causes of avoidable outages.",
      ],
    },
    {
      heading: "In a system design interview",
      paragraphs: [
        "Assume HTTPS everywhere and say so briefly. Mention that TLS is terminated at the load balancer or CDN, which centralises certificate management and keeps handshakes close to users, and that internal traffic can use mTLS if the system handles sensitive data. If latency matters, note that connection reuse and TLS session resumption avoid repeated handshakes. For payments or health data, add encryption at rest as well, since TLS only protects data while it travels.",
      ],
    },
  ],
};

export default lesson;
