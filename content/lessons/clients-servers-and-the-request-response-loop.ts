import type { LessonContent } from "@/components/scene/types";

const lesson: LessonContent = {
  slug: "clients-servers-and-the-request-response-loop",
  intro:
    "Every app you use, from Instagram to your bank, is built on one simple pattern: a client asks, a server answers. Watch the loop that powers the web, see why the server never speaks first, and why each request has to say who you are.",
  learn: [
    "What a client and a server are, and why they're roles rather than machines",
    "How a request and its response pair up",
    "Why a plain web server can't message you first",
    "How one server handles many clients at the same time",
    "Why servers forget you between requests, and why that's useful",
  ],
  keyIdea:
    "The web runs on request and response. Clients start every conversation; servers wait, answer and forget. Most of system design is about making that loop fast, reliable and able to serve millions of clients at once.",
  terms: [
    { term: "Client", meaning: "Any program that sends a request and waits for an answer, such as a phone app or a browser." },
    { term: "Server", meaning: "A program that waits for requests and answers them, usually running on a machine in a data centre." },
    { term: "Request", meaning: "A message from a client asking for something, such as \"GET /feed\"." },
    { term: "Response", meaning: "The server's reply to a request: a status code plus data." },
    { term: "Status code", meaning: "A three-digit number in every response saying how it went; 200 means OK, 404 means not found." },
    { term: "Port", meaning: "A number that picks which program on a machine gets the message; web servers use port 443." },
    { term: "Stateless", meaning: "The server keeps no memory of you between requests; each request must carry everything needed." },
  ],
  scene: {
    viewBox: [-500, -235, 1000, 570],
    entities: [
      { id: "phSlab", kind: "slab", at: [-330, 22], w: 72, h: 12 },
      { id: "phone", kind: "phone", at: [-330, 10], name: "your phone", nameOffset: [0, 54] },
      { id: "server", kind: "box", at: [180, 50], w: 90, h: 110, color: "blue", text: ["Web", "server"], textSize: 19, name: "api.example", nameIcon: "globe" },
      { id: "db", kind: "cylinder", at: [400, 180], rx: 42, h: 58, color: "yellow", name: "database", nameIcon: "db" },
      { id: "ph2Slab", kind: "slab", at: [-40, 236], w: 72, h: 12 },
      { id: "phone2", kind: "phone", at: [-40, 224], name: "another user", nameOffset: [0, 54] },
      { id: "desk", kind: "slab", at: [-330, 222], w: 110, h: 14, name: "your laptop", nameIcon: "user" },
      { id: "laptop", kind: "laptop", at: [-330, 208] },
    ],
    points: {
      ph: [-296, -32],
      lap: [-248, 162],
      ph2: [-6, 182],
      srv: [108, 10],
      srv2: [130, 60],
      srvR: [250, 40],
      db: [362, 140],
      srvTop: [180, -160],
      phLabel: [-330, -120],
      lapLabel: [-420, 60],
      dbLabel: [320, 282],
      note: [-60, -60],
    },
  },
  steps: [
    {
      title: "A client asks",
      body:
        "A client is any program that asks for something: your phone's app, your browser, even another server. Here your phone wants your feed, so it sends a request to the server. The request says what it wants (\"GET /feed\" means \"give me my feed\") and travels across the internet in a few milliseconds.",
      focus: ["phone"],
      links: [{ from: "ph", to: "srv" }],
      packets: [{ path: ["ph", "srv"], kind: "request", at: 0.6, dur: 1.3, tag: "GET /feed" }],
      labels: [
        { at: "phLabel", text: "please show me my feed", icon: "chat", from: 0.1 },
        { at: "srvTop", text: "request received", icon: "check", tone: "green", from: 2 },
      ],
    },
    {
      title: "The server answers",
      body:
        "A server is a program that waits for requests and answers them. It finds your feed, wraps it in a response, and sends it back. Every response carries a status code: 200 means OK, 404 means \"not found\", 500 means the server hit an error. The phone reads the status first, then shows the feed.",
      focus: ["server"],
      links: [{ from: "srv", to: "ph" }],
      packets: [{ path: ["srv", "ph"], kind: "response", at: 0.5, dur: 1.3, tag: "200 OK, your feed" }],
      labels: [
        { at: "srvTop", text: "sending back your feed", icon: "page", tone: "orange", from: 0.1, until: 1.9 },
        { at: "phLabel", text: "feed on screen", icon: "check", tone: "green", from: 1.9 },
      ],
    },
    {
      title: "Servers are clients too",
      body:
        "To build your feed, the server needs posts stored in a database. So it sends its own request to the database and waits for the answer. In that conversation, the server is the client. \"Client\" and \"server\" are roles in a conversation, not types of machine: a big system is a chain of programs asking each other for things.",
      focus: ["db"],
      links: [{ from: "srvR", to: "db", both: true }],
      packets: [
        { path: ["srvR", "db"], kind: "request", at: 0.4, dur: 1, tag: "latest posts?" },
        { path: ["db", "srvR"], kind: "response", at: 1.7, dur: 1, tag: "20 posts" },
      ],
      labels: [{ at: "dbLabel", text: "here the server is the client", icon: "info", tone: "yellow", from: 0.6 }],
    },
    {
      title: "Servers wait, clients start",
      body:
        "Now a friend posts something new. The server knows about it, but over plain HTTP, the language web clients and servers speak, a server can only answer requests. It can't start a conversation with your phone. So you won't see the new post until your phone asks again, for example when you pull to refresh.",
      note: "Real-time apps work around this with polling, long polling, WebSockets or push notifications. Lesson 2.4 compares them side by side.",
      links: [{ from: "srv", to: "ph", style: "dashed" }],
      labels: [
        { at: "srvTop", text: "new post for you!", icon: "chat", tone: "violet", from: 0.2 },
        { at: "note", text: "a server can't start\na request", tone: "muted", size: 14, from: 1.1 },
      ],
      hold: 3,
    },
    {
      title: "Many clients, one server",
      body:
        "A server isn't talking only to you. It listens on a known port, a number that tells the machine which program should get a message (web servers use port 443). Requests from thousands of phones and laptops arrive at once, and the server answers each one separately. A busy server can handle thousands of requests every second.",
      focus: ["server"],
      links: [
        { from: "ph", to: "srv", both: true },
        { from: "lap", to: "srv", both: true },
        { from: "ph2", to: "srv2", both: true },
      ],
      packets: [
        { path: ["ph", "srv"], kind: "request", at: 0.2, dur: 1.2 },
        { path: ["lap", "srv"], kind: "request", at: 0.5, dur: 1.2 },
        { path: ["ph2", "srv2"], kind: "request", at: 0.8, dur: 1.1 },
        { path: ["srv", "ph"], kind: "response", at: 1.8, dur: 1.2 },
        { path: ["srv", "lap"], kind: "response", at: 2.1, dur: 1.2 },
        { path: ["srv2", "ph2"], kind: "response", at: 2.4, dur: 1.1 },
      ],
      labels: [{ at: "srvTop", text: "listening on port 443", icon: "globe", from: 0.2 }],
    },
    {
      title: "Every request stands alone",
      body:
        "Web servers don't remember you between requests; they're stateless. It's like a shop assistant who forgets every customer the moment they walk away. So each request carries proof of who you are, usually a token (a long random string you got when you logged in), and the server checks it every single time.",
      links: [{ from: "lap", to: "srv", both: true }],
      packets: [
        { path: ["lap", "srv"], kind: "request", at: 0.3, dur: 1.2, tag: "GET /cart + token" },
        { path: ["srv", "lap"], kind: "response", at: 1.9, dur: 1.2, tag: "your cart" },
        { path: ["lap", "srv"], kind: "request", at: 3.4, dur: 1.2, tag: "POST /order + token" },
        { path: ["srv", "lap"], kind: "response", at: 5, dur: 1.2, tag: "201 Created" },
      ],
      labels: [
        { at: "srvTop", text: "checks the token on every request", icon: "key", from: 1.5 },
        { at: "lapLabel", text: "logged in", icon: "user", tone: "green", from: 0.1 },
      ],
    },
    {
      title: "Why forgetting is a feature",
      body:
        "Because a stateless server holds nothing special about you, any copy of it can answer any request. When traffic grows from 1,000 to 100,000 users, you simply run more identical copies and spread requests between them. Anything that must be remembered, like your cart or your posts, lives in a shared database instead.",
      note: "Interview tip: whenever you add more servers in a design, say they're stateless and that state lives in a database or cache. It's the first step of almost every scaling answer.",
      focus: ["server", "db"],
      links: [{ from: "srvR", to: "db", both: true }],
      packets: [
        { path: ["srvR", "db"], kind: "request", at: 0.4, dur: 1, tag: "cart for user 42" },
        { path: ["db", "srvR"], kind: "response", at: 1.7, dur: 1, tag: "3 items" },
      ],
      labels: [
        { at: "srvTop", text: "remembers nothing itself", icon: "info", from: 0.2 },
        { at: "dbLabel", text: "your data lives here", icon: "db", tone: "yellow", from: 0.8 },
      ],
    },
    {
      title: "The loop, end to end",
      body:
        "Ask, answer, forget, repeat. Every feature you'll design, such as feeds, chat, payments and search, is built from this loop. The rest of the course is about making it fast (caching), reliable (retries and backups) and able to serve millions of clients at once (more servers and smarter databases).",
      focus: ["server"],
      links: [
        { from: "ph", to: "srv", both: true },
        { from: "lap", to: "srv", both: true },
        { from: "ph2", to: "srv2", both: true },
      ],
      packets: [
        { path: ["ph", "srv"], kind: "request", at: 0.2, dur: 1 },
        { path: ["srv", "ph"], kind: "response", at: 1.3, dur: 1 },
        { path: ["lap", "srv"], kind: "request", at: 0.9, dur: 1 },
        { path: ["srv", "lap"], kind: "response", at: 2, dur: 1 },
        { path: ["ph2", "srv2"], kind: "request", at: 1.6, dur: 1 },
        { path: ["srv2", "ph2"], kind: "response", at: 2.7, dur: 1 },
      ],
      labels: [{ at: "srvTop", text: "ask, answer, forget, repeat", icon: "bolt", tone: "yellow", from: 0.2 }],
    },
  ],
  quiz: [
    {
      q: "Which of these is a client?",
      options: ["Only a web browser", "Anything that sends a request, including a server calling a database", "Only mobile apps", "Only the database"],
      answer: 1,
      explain: "\"Client\" is a role in a conversation. A server that queries a database is acting as a client in that conversation.",
    },
    {
      q: "Over plain HTTP, how does your phone find out about a new message?",
      options: ["The server sends it immediately", "The phone has to ask by sending a request", "The router forwards it", "DNS tells the phone"],
      answer: 1,
      explain: "HTTP servers only answer requests. Getting updates means the client asks again, or using a technique like WebSockets or push notifications.",
    },
    {
      q: "Why does each request carry a token or cookie?",
      options: ["To make requests smaller", "Because the server is stateless and doesn't remember you between requests", "To pick the fastest route", "Tokens are only needed for images"],
      answer: 1,
      explain: "A stateless server treats every request as new. The token tells it who you are each time, which also lets any copy of the server handle you.",
    },
    {
      q: "Your app gets popular and one server can't keep up. Why is it easy to add nine more identical servers?",
      options: [
        "Because servers share one CPU",
        "Because the servers are stateless, so any of them can answer any request",
        "Because the database copies itself automatically",
        "Because phones remember which server they used",
      ],
      answer: 1,
      explain: "No server holds special memory about a user, so a load balancer can send each request to any copy. State lives in the shared database.",
    },
    {
      q: "A response comes back with status 404. What does it mean?",
      options: ["Success", "The thing you asked for wasn't found", "The server crashed", "You need to wait 404 seconds"],
      answer: 1,
      explain: "404 Not Found means the request was understood but there's nothing at that address. Codes starting with 2 mean success, 4 means a client-side problem, 5 means a server-side problem.",
    },
  ],
  article: [
    {
      heading: "What is the client-server model?",
      paragraphs: [
        "Almost every app works the same way underneath. A client, such as your browser, a mobile app or another service, sends a request. A server, a program running on a machine somewhere, receives it, does some work and sends back a response. This is the client-server model, and the back-and-forth is called the request-response loop.",
        "\"Client\" and \"server\" are roles, not types of hardware. Your laptop can run a server, and a large backend server becomes a client the moment it calls a database or another service. A real system is a chain of these conversations.",
      ],
    },
    {
      heading: "How a request and response work, step by step",
      paragraphs: [
        "On the web, requests and responses use HTTP. A request names an action (the method) and a target (the path), for example GET /feed (read my feed) or POST /order (create an order). It can include headers, such as a login token, and a body with data.",
        "The server reads the request, does the work, often asking a database along the way, and returns a response. The response starts with a status code: 200 OK, 201 Created, 404 Not Found, 500 Internal Server Error. Then come headers and the data itself, usually HTML for web pages or JSON for apps.",
      ],
    },
    {
      heading: "Worked example: loading a feed",
      paragraphs: [
        "You open a social app. The phone sends GET /feed with your token: about 40 ms to reach a nearby data centre. The server checks the token (1 ms), asks the database for the latest 20 posts from people you follow (5–20 ms), formats them as JSON (1 ms) and sends them back (another 40 ms). Total: roughly 90–100 ms, of which most is travel.",
        "If 10,000 people open the app at the same moment, the same loop runs 10,000 times in parallel. That's why servers must be quick per request, and why we run many copies of them. If each request keeps a server busy for 20 ms, one server process can handle about 50 requests per second; 10,000 users opening the app within a few seconds need dozens of processes working side by side.",
      ],
    },
    {
      heading: "Why the server never speaks first",
      paragraphs: [
        "In plain HTTP, the client always starts. A server can't reach out to a phone that hasn't asked anything, partly because phones sit behind home routers and mobile networks that block unexpected incoming connections. This is why chat apps and live dashboards need extra techniques: polling (asking every few seconds), long polling (asking and letting the server hold the request), WebSockets (a connection that stays open both ways) or push notifications.",
      ],
    },
    {
      heading: "Stateless servers and why they scale",
      paragraphs: [
        "Web servers are usually stateless: they keep no memory of a user between requests. Each request includes a cookie or token that identifies the user, and anything long-lived, like carts, posts and settings, is stored in a database or cache.",
        "Statelessness is what makes horizontal scaling simple. If no server holds special memory about you, you can run ten identical servers behind a load balancer and any of them can answer any request. If one crashes, the others carry on, and nobody loses their cart.",
      ],
    },
    {
      heading: "Trade-offs: when request-response isn't enough",
      paragraphs: [
        "Request-response is simple, works through every firewall and proxy, and is easy to cache, monitor and retry. That's why it's the default for almost everything. Its limits show up in three situations.",
        "First, when the server has news the client doesn't know to ask for, such as a new chat message or a price change. Asking constantly wastes requests; asking rarely means stale screens. Second, when work takes a long time, like generating a video or a report. Holding a request open for minutes is fragile, so systems usually reply \"accepted, here's a job ID\" and let the client check back or get notified. Third, when many tiny messages flow both ways, as in games or collaborative editors, where a persistent connection is far cheaper than thousands of separate requests.",
        "Knowing these limits tells you when to reach for queues, webhooks or WebSockets, which later lessons cover.",
      ],
    },
    {
      heading: "Common mistakes",
      paragraphs: [
        "Storing user data in a server's memory (\"sticky\" state): it breaks as soon as you add a second server or one restarts. Assuming the server can push data to clients over plain HTTP: it can't without extra techniques. Treating every error the same: a 4xx means the client should fix its request, while a 5xx may be worth retrying. Forgetting that servers are clients too: a slow database makes every request slow.",
      ],
    },
    {
      heading: "Where you see it in real systems",
      paragraphs: [
        "Every website and app you use follows this pattern. Instagram's app is a client of Instagram's API servers, which are clients of databases, caches and other internal services. Payment providers like Stripe expose servers that your shop's server calls as a client. Even your smart TV is a client polling a server for new shows. Inside big companies, one tap in an app can trigger dozens of internal request-response conversations between services before the answer comes back to you, which is why each hop needs to be fast and why later lessons spend so much time on timeouts, retries and caching.",
      ],
    },
    {
      heading: "In a system design interview",
      paragraphs: [
        "Start almost every design by naming the clients (web, mobile, other services), the servers they talk to, and where data is stored. Say the application servers are stateless and keep state in a database or cache, so you can add servers behind a load balancer. If the problem needs real-time updates, such as chat or live scores, point out that plain request-response isn't enough and name the technique you'd use.",
      ],
    },
  ],
};

export default lesson;
