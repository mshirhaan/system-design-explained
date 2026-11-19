import type { LessonContent } from "@/components/scene/types";

const toServer = ["you", "r1", "r2", "srvL"];
const toYou = ["srvL", "r2", "r1", "you"];
const mutedPath = [
  { from: "you", to: "r1", style: "muted" as const, both: true },
  { from: "r1", to: "r2", style: "muted" as const, both: true },
  { from: "r2", to: "srvL", style: "muted" as const, both: true },
];
const pipePath = [
  { from: "you", to: "r1", style: "pipe" as const },
  { from: "r1", to: "r2", style: "pipe" as const },
  { from: "r2", to: "srvL", style: "pipe" as const },
];

const lesson: LessonContent = {
  slug: "what-happens-when-you-press-enter",
  intro:
    "You type an address and press Enter. About a fifth of a second later, a page appears. In between, your laptop talks to several machines across the internet. Follow one page load hop by hop and see exactly where every millisecond goes.",
  learn: [
    "How DNS turns a website name into an address computers can use",
    "Why opening a connection costs time before any data moves",
    "What TLS adds, and why every site now uses HTTPS",
    "The path from your browser to a server, its database, and back",
    "Where page-load time actually goes, and what that means for design",
  ],
  keyIdea:
    "Every page load is a conversation between machines: find the address, open a connection, secure it, ask, wait for the server and database, then download. Most of the time is spent waiting for messages to cross the network, not computing.",
  terms: [
    { term: "Browser", meaning: "The app you use to visit websites, such as Chrome, Safari or Firefox." },
    { term: "Server", meaning: "A computer program that waits for requests and sends back answers, like a web page." },
    { term: "IP address", meaning: "A number that identifies a machine on the internet, such as 93.184.216.34." },
    { term: "DNS", meaning: "The internet's phone book: it turns names like shop.example into IP addresses." },
    { term: "Round trip", meaning: "One message going to a machine and its reply coming back." },
    { term: "TCP", meaning: "The set of rules that opens a reliable connection between two machines." },
    { term: "TLS / HTTPS", meaning: "Encryption that keeps the conversation private and proves the server is genuine." },
    { term: "Database", meaning: "A program that stores data, such as products or users, and finds it quickly on request." },
  ],
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
      youLabel: [-300, 40],
      dnsLabel: [-180, -200],
      srvLabel: [200, -158],
      dbLabel: [365, 222],
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
        "You type shop.example into your browser's address bar and press Enter. To the browser, shop.example is just a name. Computers on the internet don't find each other by name; they use numeric addresses called IP addresses. So before anything else, the browser has to find out which address belongs to that name.",
      focus: ["you"],
      screen: "blank",
      labels: [{ at: "youLabel", text: "https://shop.example", icon: "globe", from: 0.3, size: 16 }],
      hold: 2.6,
    },
    {
      title: "Ask DNS where the site lives",
      body:
        "The browser asks a DNS resolver, a server whose job is to look up names. Think of it as the internet's phone book: you give it a name and it gives you a number. The question it sends is tiny: \"what is the IP address of shop.example?\". The resolver is usually run by your internet provider, or by a public service such as Google or Cloudflare.",
      screen: "loading",
      links: [{ from: "you", to: "dns", style: "dashed" }],
      packets: [{ path: ["you", "dns"], kind: "request", at: 0.4, dur: 1.1, tag: "shop.example?" }],
      labels: [{ at: "dnsLabel", text: "looking up shop.example", icon: "search", from: 1.5 }],
      timing: { done: [], active: "dns" },
    },
    {
      title: "DNS answers with an IP address",
      body:
        "The resolver replies with the address: 93.184.216.34. Your laptop remembers (caches) this answer for a while, so the next visit skips the lookup completely. A lookup that isn't cached takes around 20 milliseconds (ms), which is 20 thousandths of a second. That's the first slice of our time bar below.",
      note: "If the resolver doesn't know the answer, it asks a chain of other servers to find it. Lesson 1.4, DNS from the inside, follows that chain.",
      screen: "loading",
      links: [{ from: "dns", to: "you", style: "dashed" }],
      packets: [{ path: ["dns", "you"], kind: "response", at: 0.3, dur: 1.1, tag: "93.184.216.34" }],
      labels: [
        { at: "dnsLabel", text: "found the address", icon: "check", tone: "green", from: 0.2 },
        { at: "youLabel", text: "address: 93.184.216.34", icon: "check", tone: "green", from: 1.5 },
      ],
      timing: { done: ["dns"] },
    },
    {
      title: "Open a connection (TCP)",
      body:
        "Now the browser knows where to go, but it can't send the page request yet. First it opens a connection using TCP, the set of rules that makes delivery reliable. It's a short three-message greeting: SYN (\"can we talk?\"), SYN-ACK (\"yes\"), ACK (\"great\"). Each message hops through routers, the machines that pass traffic along the internet, and this greeting costs about 30 ms.",
      note: "One message there and its reply back is called a round trip. Across a city that's about 1 ms; across an ocean it's about 80 ms or more.",
      screen: "loading",
      links: mutedPath,
      packets: [
        { path: toServer, kind: "request", at: 0.3, dur: 1.4, tag: "SYN" },
        { path: toYou, kind: "response", at: 1.9, dur: 1.4, tag: "SYN-ACK" },
        { path: toServer, kind: "request", at: 3.5, dur: 1.4, tag: "ACK" },
      ],
      labels: [{ at: "netLabel", text: "3 messages before any page data", icon: "clock", tone: "muted", from: 0.2 }],
      timing: { done: ["dns"], active: "tcp" },
    },
    {
      title: "Make it private (TLS)",
      body:
        "The \"https\" at the start of the address means the conversation must be encrypted. In a quick exchange called the TLS handshake, the server sends a certificate, a digital ID card proving it really is shop.example. Both sides then agree on a secret key. From now on, routers in between can pass the traffic along but can't read or change it. This costs about another 30 ms.",
      screen: "loading",
      links: mutedPath,
      packets: [
        { path: toServer, kind: "request", at: 0.3, dur: 1.4, tag: "hello" },
        { path: toYou, kind: "secure", at: 1.9, dur: 1.4, tag: "certificate" },
      ],
      labels: [
        { at: "srvLabel", text: "here is my certificate", icon: "key", from: 1.7, until: 3.3 },
        { at: "youLabel", text: "certificate checked, it's genuine", icon: "lock", tone: "violet", from: 3.4 },
      ],
      timing: { done: ["dns", "tcp"], active: "tls" },
    },
    {
      title: "Send the request",
      body:
        "With a secure connection open, the browser finally sends what it wanted all along: an HTTP request. \"GET /\" means \"please give me the home page\". The web server receives it and starts running the shop's code to build that page. Notice that about 80 ms have passed and the server has only just heard what we want.",
      screen: "loading",
      links: pipePath,
      packets: [{ path: toServer, kind: "secure", at: 0.4, dur: 1.5, tag: "GET /" }],
      labels: [
        { at: "srvLabel", text: "request: GET / (the home page)", icon: "page", tone: "orange", from: 2 },
      ],
      focus: ["server"],
      timing: { done: ["dns", "tcp", "tls"], active: "server" },
    },
    {
      title: "Ask the database",
      body:
        "To build the home page, the server needs today's products, and those are stored in a database. It sends a query, a precise question such as \"give me the 24 featured products\". Thanks to an index, a kind of lookup table, the database finds them in a few milliseconds without reading every row. A slow query here is one of the most common reasons real sites feel sluggish.",
      focus: ["db"],
      screen: "loading",
      links: [...pipePath, { from: "srvR", to: "db", style: "solid", both: true }],
      packets: [
        { path: ["srvR", "db"], kind: "request", at: 0.3, dur: 0.9, tag: "SELECT products" },
        { path: ["db", "srvR"], kind: "response", at: 1.9, dur: 0.9, tag: "24 rows" },
      ],
      labels: [{ at: "dbLabel", text: "24 products found fast", icon: "db", tone: "yellow", from: 1.2 }],
      timing: { done: ["dns", "tcp", "tls", "server"], active: "db" },
    },
    {
      title: "The response travels back",
      body:
        "The server turns the products into HTML, the language web pages are written in, and sends it back with the status \"200 OK\", meaning success. The response retraces the same path through the routers, still encrypted. The browser starts reading it the moment the first bytes arrive, without waiting for the whole thing.",
      screen: "loading",
      links: pipePath,
      packets: [{ path: toYou, kind: "secure", at: 0.3, dur: 1.6, tag: "200 OK, HTML" }],
      labels: [{ at: "youLabel", text: "the page's HTML has arrived", icon: "page", tone: "green", from: 2 }],
      timing: { done: ["dns", "tcp", "tls", "server", "db"], active: "download" },
    },
    {
      title: "More files: styles, scripts, images",
      body:
        "The HTML mentions other files the page needs: a stylesheet for colours and layout, a script for interactive parts, and product photos. The browser requests them all at once over the same connection, so it doesn't have to repeat the connection and TLS greetings. A typical shop home page loads 20–60 such files.",
      screen: "page-partial",
      links: pipePath,
      packets: [
        { path: toServer, kind: "request", at: 0.2, dur: 1.2, tag: "style.css" },
        { path: toServer, kind: "request", at: 0.5, dur: 1.2, tag: "app.js" },
        { path: toServer, kind: "request", at: 0.8, dur: 1.2, tag: "photo.jpg" },
        { path: toYou, kind: "response", at: 2.1, dur: 1.2 },
        { path: toYou, kind: "response", at: 2.4, dur: 1.2 },
        { path: toYou, kind: "response", at: 2.7, dur: 1.2 },
      ],
      labels: [{ at: "youLabel", text: "page appearing piece by piece", icon: "page", from: 3 }],
      timing: { done: ["dns", "tcp", "tls", "server", "db", "download"], active: "render" },
    },
    {
      title: "The page is on screen",
      body:
        "The browser lays out the page and paints it. Total: about 180 ms. Now look at the time bar below: the network steps (DNS, connecting, TLS, downloading) add up to 115 ms, while the server and database together took only 40 ms. Most of a page load is waiting for messages to travel, not computers thinking.",
      note: "This is why caching, CDNs and reusing connections matter so much. Most later lessons are about shrinking one of these bars.",
      screen: "page",
      focus: ["you"],
      labels: [{ at: "youLabel", text: "page ready after 180 ms", icon: "check", tone: "green", from: 0.3, size: 16 }],
      timing: { done: ["dns", "tcp", "tls", "server", "db", "download", "render"] },
      hold: 3.5,
    },
  ],
  preview: {
    title: "A page load",
    body: "",
    screen: "page",
    links: [...pipePath, { from: "srvR", to: "db", style: "solid", both: true }],
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
      explain: "Machines connect by IP address, not by name. DNS translates the name into an address, and the answer is cached so later visits skip this step.",
    },
    {
      q: "In this page load, where did most of the ~180 ms go?",
      options: ["The server running its code", "The database reading rows", "Messages travelling across the network", "The browser drawing the page"],
      answer: 2,
      explain: "DNS, the TCP greeting, the TLS handshake and the downloads are all network trips: about 115 ms. The server and database took about 40 ms together.",
    },
    {
      q: "What does TLS add to the connection?",
      options: ["It makes the server respond faster", "It proves the server's identity and encrypts the traffic", "It compresses images", "It picks the nearest server"],
      answer: 1,
      explain: "The certificate proves you're talking to the real shop.example, and the agreed key encrypts everything that follows.",
    },
    {
      q: "A user in Australia visits your site hosted in London, and the page takes 2 seconds. Which change would help most?",
      options: [
        "A faster CPU in the London server",
        "Serving the site from a location closer to Australia, such as a CDN",
        "A bigger database",
        "Shorter page titles",
      ],
      answer: 1,
      explain: "Every round trip from Australia to London takes around 250 ms, and a page load needs several. Moving content closer to the user cuts every one of those trips; a faster CPU only shrinks the small server slice.",
    },
    {
      q: "Why does the second visit to a site often load faster than the first?",
      options: [
        "The internet is less busy",
        "The DNS answer and many files are cached, so fewer trips are needed",
        "The server remembers your face",
        "Browsers skip TLS on second visits",
      ],
      answer: 1,
      explain: "Cached DNS answers, cached files and sometimes reused connections remove whole steps from the page load.",
    },
  ],
  article: [
    {
      heading: "What happens when you type a URL and press Enter?",
      paragraphs: [
        "Loading a web page looks instant, but behind it is a chain of steps across several machines. The browser has to find the server's address, open a connection, secure it, ask for the page, wait while the server talks to its database, and then download and draw everything. A typical first visit takes somewhere between 100 and 300 milliseconds, and each step contributes its share.",
        "Understanding this chain is the foundation of system design. Almost every technique you'll learn later, from caching to CDNs to database indexes, exists to shorten one of these steps or skip it entirely.",
      ],
    },
    {
      heading: "Step 1: DNS turns a name into an address",
      paragraphs: [
        "Computers on the internet are reached by IP address, such as 93.184.216.34. People prefer names like shop.example. The Domain Name System (DNS) translates one into the other. Your browser asks a DNS resolver, usually run by your internet provider or a public service like 1.1.1.1 or 8.8.8.8, which either knows the answer already or finds it by asking a chain of other DNS servers.",
        "Every answer comes with a time-to-live (TTL), a number of seconds it may be reused. Until the TTL runs out, your computer reuses the cached address and skips the lookup completely. That's one reason the second visit to a site is often noticeably faster. Browsers, operating systems and resolvers each keep their own cache, so most lookups never leave your network at all.",
      ],
    },
    {
      heading: "Step 2: TCP opens a reliable connection",
      paragraphs: [
        "Before any page data moves, the browser and server agree to talk using TCP's three-way handshake: SYN, SYN-ACK, ACK. TCP then guarantees that data arrives complete and in order, resending anything lost along the way.",
        "The handshake costs one round trip, the time for a message to reach the server and a reply to come back. Round-trip time depends mostly on physical distance, because signals in fibre-optic cable travel at about two-thirds of the speed of light: around 1 ms within a city, 10–30 ms within a continent and 70–250 ms between continents. You can't make light faster, so the main fix is to put servers closer to users.",
      ],
    },
    {
      heading: "Step 3: TLS makes it private",
      paragraphs: [
        "HTTPS adds a TLS handshake on top of TCP. The server presents a certificate signed by a trusted authority, proving it really is shop.example. The two sides then agree on encryption keys. With TLS 1.3, the current version, this costs one more round trip, and everything afterwards is encrypted: routers along the way can forward the traffic but can't read or tamper with it.",
      ],
    },
    {
      heading: "Step 4: the request, the server and the database",
      paragraphs: [
        "Now the browser sends an HTTP request such as GET /. The web server runs the application code, which usually needs data from a database. A well-indexed query returns in a few milliseconds. A query that has to scan millions of rows can take seconds, and slow queries are one of the most common causes of slow pages in real systems.",
        "The server builds the HTML and replies with a status code (200 OK means success). The browser starts reading as soon as the first bytes arrive, then requests the stylesheets, scripts and images the HTML refers to. With HTTP/2 and HTTP/3, those requests share one connection instead of waiting in line.",
      ],
    },
    {
      heading: "Worked example: where 180 ms goes",
      paragraphs: [
        "In this lesson's page load: DNS 20 ms, TCP connection 30 ms, TLS 30 ms, server work 15 ms, database 25 ms, downloading 35 ms and rendering 25 ms, for a total of 180 ms. Group them and a pattern appears. Network steps (DNS, TCP, TLS, download) take 115 ms. Server and database work take 40 ms. The browser's own drawing takes 25 ms.",
        "Now move the user to another continent with a 150 ms round trip. DNS, TCP, TLS and the request each need at least one round trip, so the page jumps to well over half a second, while the server and database take exactly the same 40 ms. Distance, not computing, dominates.",
      ],
    },
    {
      heading: "Common misconceptions",
      paragraphs: [
        "\"A faster server makes the page fast.\" Only partly: server time is often the smallest slice. \"More bandwidth makes pages load faster.\" Bandwidth helps with large files, but small requests are limited by round trips. \"HTTPS is slow.\" Modern TLS adds one round trip at most, often zero for repeat visits, and connection reuse spreads that cost across many requests.",
      ],
    },
    {
      heading: "How real sites shorten each step",
      paragraphs: [
        "DNS answers are cached at every level. CDNs such as Cloudflare, Fastly and Amazon CloudFront place copies of pages and files in hundreds of cities, so the TCP and TLS handshakes happen with a nearby machine. Browsers keep connections open and reuse them. Servers cache database results in memory with tools like Redis, and databases use indexes so queries stay fast as data grows. Each of these gets its own lesson later in the course.",
      ],
    },
    {
      heading: "How to use this in a system design interview",
      paragraphs: [
        "A classic opening question is \"what happens when you type a URL and press Enter?\". Walk through the steps in order (DNS, TCP, TLS, HTTP request, server, database, response, rendering) and mention roughly how long each takes. Then point out where you'd cut time: caching, a CDN, connection reuse, indexes. Being able to trace a request end to end, and reason about where the milliseconds go, is a strong signal that you understand how real systems behave.",
      ],
    },
  ],
};

export default lesson;
