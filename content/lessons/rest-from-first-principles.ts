import type { LessonContent } from "@/components/scene/types";
import { clientServerDb, csLinks, rows } from "./_layouts";

const ask = (tag: string, at = 0.3) => ({ path: ["cli", "srvL"], kind: "request" as const, at, dur: 1.3, tag });
const answer = (tag: string, at: number, kind: "response" | "empty" = "response") => ({ path: ["srvL", "cli"], kind, at, dur: 1.3, tag });
const toDb = (at: number, tag?: string) => ({ path: ["srvR", "db"], kind: "request" as const, at, dur: 0.8, tag });
const fromDb = (at: number, tag?: string) => ({ path: ["db", "srvR"], kind: "response" as const, at, dur: 0.8, tag });

const lesson: LessonContent = {
  slug: "rest-from-first-principles",
  intro:
    "REST is the most common way to design a web API. Everything is a resource with an address, and a handful of verbs say what to do with it. Watch one order get created, read, updated and deleted.",
  learn: [
    "What a resource and a URL are",
    "What GET, POST, PUT, PATCH and DELETE mean",
    "How status codes tell the client what happened",
    "Why REST APIs are stateless and cache-friendly",
  ],
  keyIdea:
    "REST APIs are built from nouns and verbs: resources at URLs (/orders/7) and a small set of HTTP methods acting on them. Status codes report the outcome. Because the rules are shared, any client can understand any REST API.",
  scene: clientServerDb({ clientName: "shop app", serverName: "api.shop.example" }),
  steps: [
    {
      title: "Everything is a resource",
      body:
        "In REST, every thing your API manages is a resource with its own address: /users/42 is one user, /orders is the collection of orders, /orders/7 is one order. Addresses are nouns, never actions like /createOrder.",
      focus: ["server"],
      tokens: [rows(["/orders/5", "/orders/6", "/orders/7"], { from: (i) => 0.3 + i * 0.4 })],
      labels: [
        { at: "srvLabel", text: "/users  /orders  /products", icon: "globe", from: 0.2 },
        { at: "dbLabel", text: "orders", icon: "db", tone: "yellow", from: 0.3 },
      ],
    },
    {
      title: "GET reads",
      body:
        "GET /orders/7 asks for one order. The server looks it up and answers 200 OK with the order as JSON. GET never changes anything, so it's always safe to repeat.",
      links: csLinks(),
      packets: [ask("GET /orders/7"), toDb(1.7), fromDb(2.6), answer("200 OK · order 7", 3.5)],
      tokens: [rows(["/orders/5", "/orders/6", "/orders/7"])],
      labels: [{ at: "cliLabel", text: "safe: reads only", icon: "check", tone: "green", from: 4.8 }],
    },
    {
      title: "POST creates",
      body:
        "POST /orders with the order details in the body asks the server to create a new order. The server saves it and replies 201 Created, with the new address: /orders/8.",
      links: csLinks(),
      packets: [ask("POST /orders"), toDb(1.7, "INSERT"), answer("201 Created · /orders/8", 2.9)],
      tokens: [rows(["/orders/5", "/orders/6", "/orders/7", "/orders/8"], { from: (i) => (i === 3 ? 2.5 : undefined) })],
      labels: [{ at: "dbLabel", text: "new row", icon: "check", tone: "green", from: 2.5 }],
    },
    {
      title: "PUT and PATCH update",
      body:
        "PATCH /orders/8 with { status: \"paid\" } changes just that field. PUT replaces the whole order with what you send. Both answer 200 OK with the updated order.",
      links: csLinks(),
      packets: [ask("PATCH /orders/8"), toDb(1.7, "UPDATE"), answer("200 OK · status: paid", 2.9)],
      tokens: [rows(["/orders/5", "/orders/6", "/orders/7", "/orders/8 ✓"])],
      labels: [{ at: "srvLabel", text: "PATCH = some fields · PUT = all", icon: "page", tone: "orange", from: 0.4 }],
    },
    {
      title: "DELETE removes",
      body:
        "DELETE /orders/8 removes the order. The server answers 204 No Content: done, nothing to send back. Deleting something already gone gives the same end state, so DELETE is safe to retry.",
      links: csLinks(),
      packets: [ask("DELETE /orders/8"), toDb(1.7, "DELETE"), answer("204 No Content", 2.9, "empty")],
      tokens: [rows(["/orders/5", "/orders/6", "/orders/7", "/orders/8"], { until: (i) => (i === 3 ? 2.5 : undefined) })],
    },
    {
      title: "Status codes tell the story",
      body:
        "The first digit says who's responsible. 2xx: it worked. 4xx: the client got something wrong, such as 404 Not Found, 400 Bad Request or 401 Unauthorized. 5xx: the server failed. Clients use this to decide whether retrying makes sense.",
      links: csLinks(),
      packets: [
        ask("GET /orders/99", 0.2),
        answer("404 Not Found", 1.6, "empty"),
        ask("POST /orders {}", 3),
        answer("400 Bad Request", 4.4, "empty"),
      ],
      labels: [
        { at: "srvLabel", text: "2xx ok · 4xx your fault · 5xx ours", icon: "info", tone: "yellow", from: 0.2 },
        { at: "cliLabel", text: "4xx: fix it, don't retry", icon: "info", tone: "orange", from: 5.8 },
      ],
    },
    {
      title: "Stateless and cacheable",
      body:
        "Every request carries everything the server needs, including who you are, so any server can answer it. And because GET responses can be marked cacheable, browsers and CDNs can reuse them instead of asking again.",
      links: csLinks(),
      packets: [ask("GET /products/3 · token", 0.3), answer("200 · Cache-Control: 60s", 1.8)],
      labels: [
        { at: "cliLabel", text: "cached for 60 s", icon: "clock", tone: "violet", from: 3.2 },
        { at: "srvLabel", text: "no memory of you between calls", icon: "key", from: 0.3 },
      ],
    },
  ],
  quiz: [
    {
      q: "Which URL follows REST style for cancelling order 7?",
      options: ["POST /cancelOrder?id=7", "DELETE /orders/7 (or PATCH /orders/7 with status cancelled)", "GET /orders/7/cancel", "PUT /cancel"],
      answer: 1,
      explain: "REST URLs name resources; the HTTP method says what to do. Actions in the URL are a sign of an RPC-style API.",
    },
    {
      q: "The server answers 201 Created. What happened?",
      options: ["Nothing changed", "A new resource was created", "The request was malformed", "The server crashed"],
      answer: 1,
      explain: "201 is the success code for creation, usually with a Location header pointing to the new resource.",
    },
    {
      q: "A request fails with 400 Bad Request. Should the client retry it unchanged?",
      options: ["Yes, immediately", "No: 4xx means the request itself is wrong", "Yes, with backoff", "Only on weekends"],
      answer: 1,
      explain: "4xx errors won't fix themselves. Retries make sense for some 5xx errors and timeouts, not for bad requests.",
    },
  ],
  article: [
    {
      heading: "What is a REST API?",
      paragraphs: [
        "REST (Representational State Transfer) is a style for designing web APIs. Data is organised as resources, each identified by a URL, and clients act on them using standard HTTP methods. Responses carry a representation of the resource, usually JSON, and a status code describing the outcome.",
      ],
    },
    {
      heading: "Methods",
      paragraphs: [
        "GET reads a resource and must not change anything. POST creates a resource in a collection (or triggers a process). PUT replaces a resource entirely; PATCH changes part of it. DELETE removes it. GET, PUT and DELETE are idempotent: doing them twice has the same effect as doing them once. POST is not, which matters for retries (see the next lesson).",
      ],
    },
    {
      heading: "Status codes",
      paragraphs: [
        "200 OK, 201 Created and 204 No Content report success. 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 409 Conflict and 429 Too Many Requests are client errors. 500 Internal Server Error, 502 Bad Gateway, 503 Service Unavailable and 504 Gateway Timeout are server-side failures. Using them correctly lets clients, proxies and monitoring tools react sensibly.",
      ],
    },
    {
      heading: "REST in interviews",
      paragraphs: [
        "In a design interview you'll often sketch the API right after the requirements. Keep it short: list the key resources and endpoints (POST /urls, GET /urls/{code}), the important fields, and how lists are paginated. Mention authentication (a token in the Authorization header) and rate limiting. That's usually all the API design an interviewer needs.",
      ],
    },
  ],
};

export default lesson;
