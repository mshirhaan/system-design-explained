import type { LessonContent } from "@/components/scene/types";

const aliceToSrv = ["alice", "sL"];
const srvToAlice = ["sL", "alice"];
const bobToSrv = ["bob", "sR"];
const srvToBob = ["sR", "bob"];

const lesson: LessonContent = {
  slug: "polling-long-polling-sse-and-websockets",
  intro:
    "Bob sends Alice a message. The server has it, but over plain HTTP it can't tell Alice until she asks. Here are four ways to get updates to a client, compared side by side: polling, long polling, server-sent events and WebSockets.",
  learn: [
    "Why real-time updates are hard over plain HTTP",
    "How polling and long polling work, and what they cost",
    "How server-sent events stream updates one way",
    "How WebSockets open a two-way channel",
    "How to choose between them",
  ],
  keyIdea:
    "Plain HTTP only lets the client start a conversation. Polling asks repeatedly, long polling asks and waits, SSE keeps a one-way stream open, and WebSockets keep a two-way connection open. Each step trades simplicity for immediacy.",
  scene: {
    viewBox: [-500, -235, 1000, 570],
    entities: [
      { id: "server", kind: "box", at: [0, 40], w: 90, h: 108, color: "blue", text: ["Chat", "server"], textSize: 19, name: "chat.example", nameIcon: "chat" },
      { id: "aSlab", kind: "slab", at: [-330, 210], w: 96, h: 14, name: "Alice", nameIcon: "user" },
      { id: "alicePh", kind: "phone", at: [-330, 196] },
      { id: "bSlab", kind: "slab", at: [330, 210], w: 96, h: 14, name: "Bob", nameIcon: "user" },
      { id: "bobPh", kind: "phone", at: [330, 196] },
    ],
    points: {
      alice: [-298, 150],
      bob: [300, 150],
      sL: [-60, 50],
      sR: [62, 50],
      aLabel: [-330, 60],
      bLabel: [330, 60],
      sLabel: [0, -160],
      note: [-170, 250],
      metric: [170, 290],
    },
  },
  steps: [
    {
      title: "The problem",
      body:
        "Bob sends a message to the server. The server knows it's for Alice, but over plain HTTP a server can only answer requests. It has no way to start a conversation with Alice's phone.",
      links: [{ from: "bob", to: "sR" }, { from: "sL", to: "alice", style: "dashed" }],
      packets: [{ path: bobToSrv, kind: "message", at: 0.3, dur: 1.3, tag: "hi Alice" }],
      labels: [
        { at: "sLabel", text: "1 new message for Alice", icon: "chat", tone: "violet", from: 1.7 },
        { at: "note", text: "server can't start\na request", tone: "muted", size: 14, from: 2.2 },
      ],
    },
    {
      title: "Polling: ask every few seconds",
      body:
        "The simplest fix: Alice's app asks \"anything new?\" every few seconds. Usually the answer is no. Every empty answer costs a full request and response, for every user, all the time.",
      links: [{ from: "alice", to: "sL", both: true }],
      packets: [
        { path: aliceToSrv, kind: "request", at: 0.2, dur: 1 },
        { path: srvToAlice, kind: "empty", at: 1.3, dur: 1 },
        { path: aliceToSrv, kind: "request", at: 2.6, dur: 1 },
        { path: srvToAlice, kind: "empty", at: 3.7, dur: 1 },
      ],
      labels: [
        { at: "aLabel", text: "anything new?", icon: "info", from: 0.1 },
        { at: "metric", text: "mostly empty replies", icon: "clock", tone: "muted", from: 2.4 },
      ],
    },
    {
      title: "Polling delivers late",
      body:
        "Bob's message arrives just after Alice's last poll. It waits on the server until her next poll, up to a whole interval later. Shorter intervals mean fresher messages but even more wasted requests.",
      links: [{ from: "alice", to: "sL", both: true }, { from: "bob", to: "sR" }],
      packets: [
        { path: aliceToSrv, kind: "request", at: 0.2, dur: 1 },
        { path: srvToAlice, kind: "empty", at: 1.3, dur: 1 },
        { path: bobToSrv, kind: "message", at: 1.6, dur: 1.1, tag: "hi Alice" },
        { path: aliceToSrv, kind: "request", at: 4.2, dur: 1 },
        { path: srvToAlice, kind: "message", at: 5.3, dur: 1, tag: "hi Alice" },
      ],
      labels: [
        { at: "sLabel", text: "waiting for Alice to ask…", icon: "clock", tone: "orange", from: 2.7, until: 5.3 },
        { at: "aLabel", text: "got it, 3 s late", icon: "chat", tone: "violet", from: 6.3 },
      ],
    },
    {
      title: "Long polling: ask and wait",
      body:
        "Alice asks, and the server holds the request open instead of answering \"nothing\". The moment Bob's message arrives, the server answers the held request. Alice immediately sends a new one to wait again.",
      focus: ["server"],
      links: [{ from: "alice", to: "sL", style: "dashed" }, { from: "bob", to: "sR" }],
      packets: [
        { path: aliceToSrv, kind: "request", at: 0.2, dur: 1 },
        { path: bobToSrv, kind: "message", at: 2.4, dur: 1.1, tag: "hi Alice" },
        { path: srvToAlice, kind: "message", at: 3.6, dur: 1, tag: "hi Alice" },
        { path: aliceToSrv, kind: "request", at: 4.8, dur: 1 },
      ],
      labels: [
        { at: "sLabel", text: "holding Alice's request", icon: "clock", from: 1.2, until: 3.6 },
        { at: "aLabel", text: "instant delivery", icon: "bolt", tone: "green", from: 4.6 },
      ],
    },
    {
      title: "Server-sent events: a one-way stream",
      body:
        "With SSE, Alice opens one ordinary HTTP request and the server never closes it. It keeps writing events down that stream whenever there's news. It's simple, works through proxies and reconnects automatically, but only flows server → client.",
      links: [{ from: "sL", to: "alice", style: "pipe" }, { from: "bob", to: "sR" }],
      packets: [
        { path: bobToSrv, kind: "message", at: 0.4, dur: 1.1, tag: "hi" },
        { path: srvToAlice, kind: "message", at: 1.6, dur: 1, tag: "event: hi" },
        { path: bobToSrv, kind: "message", at: 2.4, dur: 1.1, tag: "you there?" },
        { path: srvToAlice, kind: "message", at: 3.6, dur: 1, tag: "event: you there?" },
      ],
      labels: [
        { at: "sLabel", text: "text/event-stream", icon: "page", tone: "green", from: 0.2 },
        { at: "note", text: "Alice still replies\nwith normal requests", tone: "muted", size: 14, from: 4.6 },
      ],
    },
    {
      title: "WebSockets: a two-way channel",
      body:
        "A WebSocket starts as an HTTP request asking to upgrade. After 101 Switching Protocols, the connection stays open and either side can send messages at any moment. Chat apps, multiplayer games and live collaboration use this.",
      links: [{ from: "sL", to: "alice", style: "pipe" }, { from: "sR", to: "bob", style: "pipe" }],
      packets: [
        { path: bobToSrv, kind: "message", at: 0.3, dur: 1, tag: "hi Alice" },
        { path: srvToAlice, kind: "message", at: 1.4, dur: 1, tag: "hi Alice" },
        { path: aliceToSrv, kind: "message", at: 2.7, dur: 1, tag: "hey Bob!" },
        { path: srvToBob, kind: "message", at: 3.8, dur: 1, tag: "hey Bob!" },
        { path: srvToAlice, kind: "heartbeat", at: 5, dur: 0.9 },
        { path: srvToBob, kind: "heartbeat", at: 5, dur: 0.9 },
      ],
      labels: [{ at: "sLabel", text: "push both ways, any time", icon: "bolt", tone: "green", from: 0.2 }],
    },
    {
      title: "Choosing",
      body:
        "Polling: simplest, fine for data that changes every few minutes. Long polling: works everywhere, a good fallback. SSE: live feeds, notifications and dashboards. WebSockets: chat, games and anything two-way and fast. The cost of the last three is holding many open connections on the server.",
      labels: [
        { at: "aLabel", text: "polling → rare updates", icon: "clock", tone: "muted", from: 0.3 },
        { at: "sLabel", text: "SSE → live feeds", icon: "page", tone: "green", from: 1 },
        { at: "bLabel", text: "WebSocket → chat, games", icon: "chat", tone: "violet", from: 1.7 },
      ],
      hold: 3.5,
    },
  ],
  quiz: [
    {
      q: "What's the main cost of simple polling?",
      options: ["It needs WebSockets", "Lots of requests that return nothing, plus delay up to one interval", "It can't work through proxies", "It only works on mobile"],
      answer: 1,
      explain: "Each user makes requests on a timer regardless of activity, and messages wait until the next poll.",
    },
    {
      q: "In long polling, what does the server do when there's nothing new?",
      options: ["Answers immediately with nothing", "Holds the request open until there's news or a timeout", "Closes the connection", "Sends a WebSocket upgrade"],
      answer: 1,
      explain: "Holding the request lets the server respond the instant something arrives.",
    },
    {
      q: "You're building a live sports score page where users only watch. Best fit?",
      options: ["Polling every 100 ms", "Server-sent events", "Email", "Long polling with no timeout"],
      answer: 1,
      explain: "Updates flow one way, server to viewers. SSE is simple, efficient and reconnects automatically.",
    },
  ],
  article: [
    {
      heading: "The problem with plain HTTP",
      paragraphs: [
        "HTTP is request-response: the client asks, the server answers. For chat, notifications, live dashboards and collaborative editing, the server needs to tell clients about changes as they happen. Four techniques solve this, each with different trade-offs.",
      ],
    },
    {
      heading: "Polling and long polling",
      paragraphs: [
        "Short polling sends a request on a fixed interval. It's trivial to build and cache-friendly, but wastes requests and adds up to one interval of delay. Long polling sends a request that the server holds open until there's data or a timeout (often 30 seconds), then the client immediately re-requests. Delivery is near-instant and it works through almost any proxy, at the cost of the server holding one pending request per waiting client.",
      ],
    },
    {
      heading: "Server-sent events (SSE)",
      paragraphs: [
        "SSE uses a single long-lived HTTP response with the content type text/event-stream. The server writes events whenever it likes; the browser's EventSource API parses them and reconnects automatically, resuming from the last event ID. It's one-way (server to client) and text-based, which suits notifications, feeds, progress updates and streaming AI responses.",
      ],
    },
    {
      heading: "WebSockets",
      paragraphs: [
        "A WebSocket begins as an HTTP request with an Upgrade header; after the server answers 101 Switching Protocols, the TCP connection becomes a full-duplex message channel. Either side can send at any time with very little overhead. It's the standard choice for chat, multiplayer games and collaborative tools.",
        "At scale, WebSockets need care: each connection is stateful and pinned to one server, so you need connection gateways, a way to route messages to whichever server holds the recipient's connection (often a pub/sub system), heartbeats to detect dead connections, and reconnection logic on clients.",
      ],
    },
  ],
};

export default lesson;
