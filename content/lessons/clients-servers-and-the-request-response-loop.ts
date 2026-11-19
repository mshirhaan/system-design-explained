import type { LessonContent } from "@/components/scene/types";

const lesson: LessonContent = {
  slug: "clients-servers-and-the-request-response-loop",
  intro:
    "Every app you use is built on one simple pattern: a client asks, a server answers. Watch the loop that powers the web, and see why the server never speaks first.",
  learn: [
    "What a client and a server are",
    "How a request and a response pair up",
    "Why a plain web server can't message you first",
    "How one server handles many clients at once",
    "Why each request has to carry who you are",
  ],
  keyIdea:
    "The web runs on request and response. Clients start every conversation; servers wait, answer, and forget. Most of system design is about making that loop fast and reliable at scale.",
  scene: {
    viewBox: [-500, -235, 1000, 570],
    entities: [
      { id: "phSlab", kind: "slab", at: [-330, 22], w: 72, h: 12 },
      { id: "phone", kind: "phone", at: [-330, 10], name: "your phone", nameOffset: [0, 54] },
      { id: "ph2Slab", kind: "slab", at: [-40, 236], w: 72, h: 12 },
      { id: "phone2", kind: "phone", at: [-40, 224], name: "another user", nameOffset: [0, 54] },
      { id: "desk", kind: "slab", at: [-330, 222], w: 110, h: 14, name: "your laptop", nameIcon: "user" },
      { id: "laptop", kind: "laptop", at: [-330, 208] },
      { id: "server", kind: "box", at: [200, 60], w: 90, h: 110, color: "blue", text: ["Web", "server"], textSize: 19, name: "api.example", nameIcon: "globe" },
    ],
    points: {
      ph: [-296, -32],
      lap: [-248, 162],
      ph2: [-6, 182],
      srv: [128, 20],
      srv2: [150, 70],
      srvTop: [200, -150],
      phLabel: [-330, -120],
      lapLabel: [-420, 60],
      ph2Label: [-40, 110],
      note: [-60, -60],
    },
  },
  steps: [
    {
      title: "A client asks",
      body:
        "A client is any program that asks for something: your phone's app, your browser, even another server. Here your phone wants your feed, so it sends a request to the server: GET /feed.",
      focus: ["phone"],
      links: [{ from: "ph", to: "srv" }],
      packets: [{ path: ["ph", "srv"], kind: "request", at: 0.6, dur: 1.3, tag: "GET /feed" }],
      labels: [
        { at: "phLabel", text: "show me my feed", icon: "chat", from: 0.1 },
        { at: "srvTop", text: "request received", icon: "check", tone: "green", from: 2 },
      ],
    },
    {
      title: "The server answers",
      body:
        "A server is a program that waits for requests and answers them. It finds your feed, wraps it in a response with a status code (200 means OK) and sends it back over the same connection.",
      focus: ["server"],
      links: [{ from: "srv", to: "ph" }],
      packets: [{ path: ["srv", "ph"], kind: "response", at: 0.5, dur: 1.3, tag: "200 OK · feed" }],
      labels: [
        { at: "srvTop", text: "here's your feed", icon: "page", tone: "orange", from: 0.1, until: 1.9 },
        { at: "phLabel", text: "feed on screen", icon: "check", tone: "green", from: 1.9 },
      ],
    },
    {
      title: "Servers wait, clients start",
      body:
        "Now a friend posts something new. The server knows, but over plain HTTP it can only answer requests. It can't start a conversation, so your phone won't see the post until it asks again.",
      note: "Real-time apps work around this with polling, long polling, WebSockets or push notifications. Track 2 compares them all.",
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
        "A server isn't talking to just you. It listens on a known port (443 for HTTPS) and handles requests from thousands of clients at once, answering each one separately.",
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
        "Web servers don't remember you between requests. That's called being stateless. So each request carries proof of who you are, usually a cookie or a token, and the server checks it every time.",
      note: "Stateless servers are easy to copy. Any copy can answer any request, which is how sites scale to millions of users.",
      links: [{ from: "lap", to: "srv", both: true }],
      packets: [
        { path: ["lap", "srv"], kind: "request", at: 0.3, dur: 1.2, tag: "GET /cart · token" },
        { path: ["srv", "lap"], kind: "response", at: 1.9, dur: 1.2, tag: "your cart" },
        { path: ["lap", "srv"], kind: "request", at: 3.4, dur: 1.2, tag: "POST /order · token" },
        { path: ["srv", "lap"], kind: "response", at: 5, dur: 1.2, tag: "201 Created" },
      ],
      labels: [
        { at: "srvTop", text: "check the token, then answer", icon: "key", from: 1.5 },
        { at: "lapLabel", text: "logged in", icon: "user", tone: "green", from: 0.1 },
      ],
    },
    {
      title: "The loop, end to end",
      body:
        "Ask, answer, forget, repeat. Every feature you'll design (feeds, chat, payments, search) is built from this loop. The rest of the course is about making it fast, reliable and able to serve millions of clients.",
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
      labels: [{ at: "srvTop", text: "ask → answer → forget", icon: "bolt", tone: "yellow", from: 0.2 }],
    },
  ],
  quiz: [
    {
      q: "Which of these is a client?",
      options: ["Only a web browser", "Anything that sends a request, including another server", "Only mobile apps", "The database"],
      answer: 1,
      explain: "\"Client\" is a role, not a device. A server that calls another service is acting as a client in that conversation.",
    },
    {
      q: "Over plain HTTP, how does your phone find out about a new message?",
      options: ["The server sends it immediately", "The phone has to ask (send a request)", "The router forwards it", "DNS tells the phone"],
      answer: 1,
      explain: "HTTP servers only answer requests. Getting updates means the client asks again, or using a technique like WebSockets or push notifications.",
    },
    {
      q: "Why does each request carry a token or cookie?",
      options: [
        "To make requests smaller",
        "Because the server is stateless and doesn't remember you between requests",
        "To pick the fastest route",
        "Tokens are only needed for images",
      ],
      answer: 1,
      explain: "Stateless servers treat every request as new. The token tells the server who you are each time, and it lets any copy of the server handle you.",
    },
  ],
  article: [
    {
      heading: "What is the client-server model?",
      paragraphs: [
        "Almost every app works the same way underneath. A client, such as your browser, a mobile app or another service, sends a request. A server, a program running on a machine somewhere, receives it, does some work and sends back a response. This is the client-server model, and the back-and-forth is called the request-response loop.",
        "\"Client\" and \"server\" are roles, not types of hardware. Your laptop can run a server, and a big backend server becomes a client the moment it calls a database or another service.",
      ],
    },
    {
      heading: "Requests and responses",
      paragraphs: [
        "On the web, requests and responses use HTTP. A request names an action and a resource, for example GET /feed (read my feed) or POST /order (create an order). The response carries a status code such as 200 OK, 201 Created, 404 Not Found or 500 Server Error, plus the data itself, often HTML or JSON.",
      ],
    },
    {
      heading: "Why the server never speaks first",
      paragraphs: [
        "In plain HTTP, the client always starts. A server can't reach out to a browser that hasn't asked anything. This is why chat apps and live dashboards need extra techniques: polling (asking every few seconds), long polling (asking and letting the server hold the request), WebSockets (a connection that stays open both ways) or push notifications.",
      ],
    },
    {
      heading: "Stateless servers and scaling",
      paragraphs: [
        "Web servers are usually stateless: they don't keep memory of a user between requests. Instead, each request includes a cookie or token that identifies the user, and anything long-lived is stored in a database or cache.",
        "Statelessness is what makes horizontal scaling simple. If no server holds special memory about you, you can run ten identical servers behind a load balancer and any of them can answer any request. You'll see this idea again in the Scaling the Web Tier track.",
      ],
    },
  ],
};

export default lesson;
