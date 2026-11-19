import type { LessonContent } from "@/components/scene/types";

const toServer = ["you", "r1", "r2", "srvL"];
const toYou = ["srvL", "r2", "r1", "you"];

const lesson: LessonContent = {
  slug: "what-happens-when-you-press-enter",
  intro:
    "You type an address and press Enter. About a fifth of a second later, a page appears. Follow one page load hop by hop and see where every millisecond goes.",
  learn: [
    "How DNS turns a name into an IP address",
    "Why a connection costs round trips before any data moves",
    "What TLS adds, and why HTTPS is the default",
    "The path from browser to server to database and back",
    "Where page-load time actually goes",
  ],
  keyIdea:
    "Every web request is a conversation between machines. Each step costs time, and most of that time is spent waiting on the network, not computing.",
  scene: {
    viewBox: [-500, -235, 1000, 570],
    entities: [
      { id: "desk", kind: "slab", at: [-330, 220], w: 118, h: 14, name: "you", nameIcon: "user" },
      { id: "you", kind: "laptop", at: [-330, 206] },
      { id: "dns", kind: "box", at: [-180, -100], w: 56, h: 56, color: "purple", icon: "search", name: "DNS resolver" },
      { id: "r1", kind: "router", at: [-120, 122], name: "router" },
      { id: "r2", kind: "router", at: [40, 72], name: "router" },
      { id: "server", kind: "box", at: [200, 22], w: 80, h: 100, color: "blue", text: ["Web", "server"], textSize: 18, name: "shop.example", nameIcon: "globe" },
      { id: "db", kind: "cylinder", at: [385, 120], rx: 46, h: 70, color: "yellow", name: "database", nameIcon: "db" },
    ],
    points: {
      you: [-248, 160],
      dns: [-200, -60],
      r1: [-120, 104],
      r2: [40, 54],
      srvL: [146, 12],
      srvR: [262, 4],
      db: [342, 62],
      youLabel: [-370, 40],
      dnsLabel: [-180, -200],
      srvLabel: [200, -158],
      dbLabel: [400, -10],
      netLabel: [-40, 190],
    },
  },
  phases: [
    { id: "dns", label: "DNS", ms: 20, color: "#c9b8e5" },
    { id: "tcp", label: "Connect", ms: 30, color: "#b0d59c" },
    { id: "tls", label: "TLS", ms: 30, color: "#a7c3e7" },
    { id: "server", label: "Server", ms: 15, color: "#f2b27c" },
    { id: "db", label: "Database", ms: 25, color: "#f5cb7f" },
    { id: "download", label: "Download", ms: 35, color: "#e8a9bd" },
    { id: "render", label: "Render", ms: 25, color: "#d6cbbd" },
  ],
  steps: [
    {
      title: "You press Enter",
      body:
        "You type shop.example into the address bar and press Enter. The browser now has a name. It has no idea where that name lives on the internet, so before anything else it needs an address.",
      focus: ["you"],
      screen: "blank",
      labels: [{ at: "youLabel", text: "https://shop.example", icon: "globe", from: 0.3, size: 16 }],
      hold: 2.6,
    },
    {
      title: "Ask DNS where the site lives",
      body:
        "Computers find each other by IP address, not by name. The browser asks a DNS resolver, the internet's phone book: what is the IP address of shop.example?",
      screen: "loading",
      links: [{ from: "you", to: "dns", style: "dashed" }],
      packets: [{ path: ["you", "dns"], kind: "request", at: 0.4, dur: 1.1, tag: "shop.example?" }],
      labels: [{ at: "dnsLabel", text: "looking it up…", icon: "search", from: 1.5 }],
      timing: { done: [], active: "dns" },
    },
    {
      title: "DNS answers with an IP address",
      body:
        "The resolver replies with an IP address. Your computer caches the answer for a while (the TTL), so the next visit skips this step entirely. On a cold cache this lookup costs around 20 ms.",
      note: "If the resolver doesn't know the answer, it asks the root servers, then the .example servers, then the site's own name server. A later lesson walks through that chain.",
      screen: "loading",
      links: [{ from: "dns", to: "you", style: "dashed" }],
      packets: [{ path: ["dns", "you"], kind: "response", at: 0.3, dur: 1.1, tag: "93.184.216.34" }],
      labels: [
        { at: "dnsLabel", text: "found it", icon: "check", tone: "green", from: 0.2 },
        { at: "youLabel", text: "IP: 93.184.216.34", icon: "check", tone: "green", from: 1.5 },
      ],
      timing: { done: ["dns"] },
    },
    {
      title: "Open a connection (TCP)",
      body:
        "Now the browser knows where to go. Before sending any data it opens a TCP connection with a three-message handshake: SYN, SYN-ACK, ACK. Each message hops across routers between you and the server.",
      note: "One full trip there and back is called a round trip. Distance sets its cost: about 1 ms across a city, about 80 ms across an ocean.",
      screen: "loading",
      links: [
        { from: "you", to: "r1", style: "muted", both: true },
        { from: "r1", to: "r2", style: "muted", both: true },
        { from: "r2", to: "srvL", style: "muted", both: true },
      ],
      packets: [
        { path: toServer, kind: "request", at: 0.3, dur: 1.4, tag: "SYN" },
        { path: toYou, kind: "response", at: 1.9, dur: 1.4, tag: "SYN-ACK" },
        { path: toServer, kind: "request", at: 3.5, dur: 1.4, tag: "ACK" },
      ],
      labels: [{ at: "netLabel", text: "3 messages before any data", icon: "clock", tone: "muted", from: 0.2 }],
      timing: { done: ["dns"], active: "tcp" },
    },
    {
      title: "Make it private (TLS)",
      body:
        "The S in HTTPS means the conversation is encrypted. In the TLS handshake the server proves who it is with a certificate, and both sides agree on secret keys. From here on, nobody in the middle can read or change the traffic.",
      screen: "loading",
      links: [
        { from: "you", to: "r1", style: "muted", both: true },
        { from: "r1", to: "r2", style: "muted", both: true },
        { from: "r2", to: "srvL", style: "muted", both: true },
      ],
      packets: [
        { path: toServer, kind: "request", at: 0.3, dur: 1.4, tag: "hello" },
        { path: toYou, kind: "secure", at: 1.9, dur: 1.4, tag: "certificate" },
      ],
      labels: [
        { at: "srvLabel", text: "here's my certificate", icon: "key", from: 1.7, until: 3.3 },
        { at: "youLabel", text: "certificate checked", icon: "lock", tone: "violet", from: 3.4 },
      ],
      timing: { done: ["dns", "tcp"], active: "tls" },
    },
    {
      title: "Send the request",
      body:
        "With a secure connection open, the browser finally sends what it wanted all along: an HTTP request. GET / means \"give me the home page\". It travels encrypted, so the routers only see scrambled bytes.",
      screen: "loading",
      links: [
        { from: "you", to: "r1", style: "pipe" },
        { from: "r1", to: "r2", style: "pipe" },
        { from: "r2", to: "srvL", style: "pipe" },
      ],
      packets: [{ path: toServer, kind: "secure", at: 0.4, dur: 1.5, tag: "GET /" }],
      labels: [{ at: "srvLabel", text: "GET / HTTP/2", icon: "page", tone: "orange", from: 2 }],
      timing: { done: ["dns", "tcp", "tls"], active: "server" },
    },
    {
      title: "The server does its work",
      body:
        "The web server reads the request and runs the shop's code. To build the home page it needs today's products, and those live in the database.",
      focus: ["server"],
      screen: "loading",
      links: [
        { from: "you", to: "r1", style: "pipe" },
        { from: "r1", to: "r2", style: "pipe" },
        { from: "r2", to: "srvL", style: "pipe" },
      ],
      labels: [{ at: "srvLabel", text: "build the home page", icon: "bolt", tone: "orange", from: 0.3 }],
      timing: { done: ["dns", "tcp", "tls"], active: "server" },
      hold: 2.6,
    },
    {
      title: "Ask the database",
      body:
        "The server sends a query to the database. Thanks to an index, the database finds the 24 products without reading every row, and sends them back. Slow queries here are one of the most common reasons a site feels slow.",
      focus: ["db"],
      screen: "loading",
      links: [
        { from: "you", to: "r1", style: "pipe" },
        { from: "r1", to: "r2", style: "pipe" },
        { from: "r2", to: "srvL", style: "pipe" },
        { from: "srvR", to: "db", style: "solid", both: true },
      ],
      packets: [
        { path: ["srvR", "db"], kind: "request", at: 0.3, dur: 0.9, tag: "SELECT …" },
        { path: ["db", "srvR"], kind: "response", at: 1.9, dur: 0.9, tag: "24 rows" },
      ],
      labels: [{ at: "dbLabel", text: "uses an index", icon: "db", tone: "yellow", from: 1.2 }],
      timing: { done: ["dns", "tcp", "tls", "server"], active: "db" },
    },
    {
      title: "The response travels back",
      body:
        "The server turns the products into HTML and sends it back with status 200 OK. The response retraces the same path, still encrypted, and the browser starts reading it the moment the first bytes arrive.",
      screen: "loading",
      links: [
        { from: "you", to: "r1", style: "pipe" },
        { from: "r1", to: "r2", style: "pipe" },
        { from: "r2", to: "srvL", style: "pipe" },
      ],
      packets: [{ path: toYou, kind: "secure", at: 0.3, dur: 1.6, tag: "200 OK · HTML" }],
      labels: [{ at: "youLabel", text: "HTML arrived", icon: "page", tone: "green", from: 2 }],
      timing: { done: ["dns", "tcp", "tls", "server", "db"], active: "download" },
    },
    {
      title: "More files: CSS, JavaScript, images",
      body:
        "The HTML mentions other files: a stylesheet, a script, product photos. The browser requests them all at once over the same connection. HTTP/2 lets them share it instead of queueing.",
      screen: "page-partial",
      links: [
        { from: "you", to: "r1", style: "pipe" },
        { from: "r1", to: "r2", style: "pipe" },
        { from: "r2", to: "srvL", style: "pipe" },
      ],
      packets: [
        { path: toServer, kind: "request", at: 0.2, dur: 1.2, tag: "style.css" },
        { path: toServer, kind: "request", at: 0.5, dur: 1.2, tag: "app.js" },
        { path: toServer, kind: "request", at: 0.8, dur: 1.2, tag: "photo.jpg" },
        { path: toYou, kind: "response", at: 2.1, dur: 1.2 },
        { path: toYou, kind: "response", at: 2.4, dur: 1.2 },
        { path: toYou, kind: "response", at: 2.7, dur: 1.2 },
      ],
      timing: { done: ["dns", "tcp", "tls", "server", "db", "download"], active: "render" },
    },
    {
      title: "The page is on screen",
      body:
        "The browser lays out the page and paints it. Total: about 180 ms. Look at the bar below. Most of that time was spent waiting for messages to cross the network, and only a small part was the server and database doing actual work.",
      note: "That's why caching, CDNs and fewer round trips matter so much. Every later lesson is about cutting one of these bars down.",
      screen: "page",
      focus: ["you"],
      labels: [{ at: "youLabel", text: "page ready · 180 ms", icon: "check", tone: "green", from: 0.3, size: 16 }],
      timing: { done: ["dns", "tcp", "tls", "server", "db", "download", "render"] },
      hold: 3.5,
    },
  ],
  preview: {
    title: "A page load",
    body: "",
    screen: "page",
    links: [
      { from: "you", to: "r1", style: "pipe" },
      { from: "r1", to: "r2", style: "pipe" },
      { from: "r2", to: "srvL", style: "pipe" },
      { from: "srvR", to: "db", style: "solid", both: true },
    ],
    packets: [
      { path: ["you", "dns"], kind: "request", at: 0.2, dur: 0.9 },
      { path: ["dns", "you"], kind: "response", at: 1.2, dur: 0.9 },
      { path: toServer, kind: "secure", at: 2.2, dur: 1.4, tag: "GET /" },
      { path: ["srvR", "db"], kind: "request", at: 3.8, dur: 0.8 },
      { path: ["db", "srvR"], kind: "response", at: 4.7, dur: 0.8 },
      { path: toYou, kind: "response", at: 5.6, dur: 1.4, tag: "200 OK" },
    ],
    labels: [
      { at: "dnsLabel", text: "where is shop.example?", icon: "search", from: 0.3, until: 2.2 },
      { at: "srvLabel", text: "GET / HTTP/2", icon: "page", tone: "orange", from: 3.6, until: 5.6 },
      { at: "youLabel", text: "page ready", icon: "check", tone: "green", from: 7 },
    ],
    hold: 1.6,
  },
  quiz: [
    {
      q: "Why does the browser contact a DNS resolver first?",
      options: [
        "To download the page faster",
        "To turn the site's name into an IP address it can connect to",
        "To encrypt the connection",
        "To check the user's password",
      ],
      answer: 1,
      explain: "Machines connect by IP address. DNS translates a human-friendly name into that address, and the answer is cached for later.",
    },
    {
      q: "In this page load, where did most of the ~180 ms go?",
      options: [
        "The server running its code",
        "The database reading rows",
        "Messages travelling across the network",
        "The browser drawing the page",
      ],
      answer: 2,
      explain: "DNS, the TCP handshake, the TLS handshake and the downloads are all network trips. Compute was a small slice. That's why cutting round trips pays off.",
    },
    {
      q: "What does TLS add to the connection?",
      options: [
        "It makes the server respond faster",
        "It proves the server's identity and encrypts the traffic",
        "It compresses images",
        "It picks the nearest server",
      ],
      answer: 1,
      explain: "The certificate proves you're talking to the real shop.example, and the agreed keys encrypt everything that follows.",
    },
  ],
  article: [
    {
      heading: "What happens when you type a URL and press Enter?",
      paragraphs: [
        "Loading a web page looks instant, but behind it is a chain of steps across several machines. The browser has to find the server, open a connection, secure it, ask for the page, wait while the server talks to its database, and then download and draw everything. A typical first visit takes somewhere between 100 and 300 milliseconds, and each step contributes its share.",
        "Understanding this chain is the foundation of system design. Almost every technique you will learn later, from caching to CDNs to database indexes, exists to shorten one of these steps.",
      ],
    },
    {
      heading: "Step 1: DNS turns a name into an address",
      paragraphs: [
        "Computers on the internet are reached by IP address, such as 93.184.216.34. People prefer names like shop.example. The Domain Name System (DNS) translates one into the other. Your browser asks a DNS resolver, usually run by your internet provider or a public service, which either knows the answer already or finds it by asking the root, top-level-domain and authoritative name servers in turn.",
        "Answers come with a time-to-live (TTL). Until it runs out, your computer reuses the cached address and skips the lookup completely. That's why the second visit to a site is often noticeably faster.",
      ],
    },
    {
      heading: "Step 2: TCP opens a reliable connection",
      paragraphs: [
        "Before any page data moves, the browser and server agree to talk using TCP's three-way handshake: SYN, SYN-ACK, ACK. TCP then guarantees that bytes arrive complete and in order, resending anything lost along the way.",
        "The handshake costs one round trip, the time for a message to reach the server and a reply to come back. Round-trip time depends mostly on physical distance: around 1 ms within a city and 70–150 ms between continents. You can't make light travel faster, so the main fix is to put servers closer to users.",
      ],
    },
    {
      heading: "Step 3: TLS makes it private",
      paragraphs: [
        "HTTPS adds a TLS handshake on top of TCP. The server presents a certificate signed by a trusted authority, proving it really is shop.example. The two sides then agree on encryption keys. With TLS 1.3 this costs one more round trip, and everything afterwards is encrypted, so routers along the way can forward the traffic but can't read or tamper with it.",
      ],
    },
    {
      heading: "Step 4: request, server work and database query",
      paragraphs: [
        "Now the browser sends an HTTP request such as GET /. The web server runs the application code, which often needs data from a database. A well-indexed query returns in a few milliseconds. A query that has to scan millions of rows can take seconds, and that is one of the most common causes of slow pages.",
        "The server builds the HTML and replies with a status code (200 OK means success). The browser starts parsing as soon as the first bytes arrive.",
      ],
    },
    {
      heading: "Step 5: extra files and rendering",
      paragraphs: [
        "The HTML refers to stylesheets, scripts and images, and the browser fetches them too. With HTTP/2 these requests share one connection instead of waiting in line. Once enough has arrived, the browser lays out the page and paints it on screen.",
      ],
    },
    {
      heading: "Where the time goes, and why it matters for system design",
      paragraphs: [
        "Add up the steps and a pattern appears: most of the time is spent waiting on the network, not computing. That is the central lesson behind many system design decisions. Caches avoid repeated work and trips. CDNs move content closer to users. Connection reuse skips handshakes. Indexes make database lookups fast.",
        "In interviews, being able to walk through this request path, and say where you would cut time, is a strong signal that you understand how real systems behave.",
      ],
    },
  ],
};

export default lesson;
