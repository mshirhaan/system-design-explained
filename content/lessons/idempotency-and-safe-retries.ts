import type { LessonContent } from "@/components/scene/types";
import { clientServerDb, csLinks, rows } from "./_layouts";

const lesson: LessonContent = {
  slug: "idempotency-and-safe-retries",
  intro:
    "Your payment request times out. Did it go through? If you retry and it had, the customer pays twice. Watch the double charge happen, then fix it with an idempotency key.",
  learn: [
    "Why timeouts leave you not knowing what happened",
    "How a naive retry causes double charges",
    "Which HTTP methods are naturally idempotent",
    "How idempotency keys make any request safe to retry",
    "Why retries need backoff and jitter",
  ],
  keyIdea:
    "Networks fail in the middle, so clients must retry. An operation is idempotent if doing it twice has the same effect as doing it once. Idempotency keys let the server recognise a repeat and return the original result instead of acting again.",
  scene: clientServerDb({ clientName: "checkout", server: ["Payments"], serverName: "pay.example", dbName: "charges" }),
  steps: [
    {
      title: "A request times out",
      body:
        "Checkout sends POST /charges for $50. The server charges the card and saves the charge, but the response is lost on the way back. The client only sees a timeout. Did the payment happen or not?",
      links: csLinks(),
      packets: [
        { path: ["cli", "srvL"], kind: "request", at: 0.3, dur: 1.3, tag: "POST /charges $50" },
        { path: ["srvR", "db"], kind: "request", at: 1.8, dur: 0.8 },
        { path: ["srvL", "cli"], kind: "response", at: 2.9, dur: 1.4, tag: "200 OK", lost: 0.5 },
      ],
      tokens: [rows(["$50 · card 4242"], { from: () => 2.6 })],
      labels: [{ at: "cliLabel", text: "timeout… did it work?", icon: "clock", tone: "orange", from: 3.8 }],
    },
    {
      title: "A naive retry charges twice",
      body:
        "The client does the obvious thing and sends the same request again. The server has no way to know it's a repeat, so it charges the card a second time. The customer has now paid $100.",
      links: csLinks(),
      packets: [
        { path: ["cli", "srvL"], kind: "request", at: 0.3, dur: 1.3, tag: "POST /charges $50" },
        { path: ["srvR", "db"], kind: "request", at: 1.8, dur: 0.8 },
        { path: ["srvL", "cli"], kind: "response", at: 2.9, dur: 1.3, tag: "200 OK" },
      ],
      tokens: [rows(["$50 · card 4242", "$50 · card 4242"], { from: (i) => (i === 1 ? 2.6 : undefined) })],
      labels: [{ at: "dbLabel", text: "charged twice!", icon: "info", tone: "orange", from: 2.7 }],
    },
    {
      title: "Some requests are safe to repeat",
      body:
        "GET only reads. PUT sets a value, and setting it twice changes nothing. DELETE twice leaves it deleted. These are idempotent. POST usually creates something new each time, so repeating it is dangerous.",
      focus: ["server"],
      labels: [
        { at: "srvLabel", text: "GET · PUT · DELETE: repeat-safe", icon: "check", tone: "green", from: 0.3 },
        { at: "cliLabel", text: "POST: not repeat-safe", icon: "info", tone: "orange", from: 1.1 },
      ],
      hold: 3,
    },
    {
      title: "Add an idempotency key",
      body:
        "Now the client generates a unique key for this payment attempt, say abc123, and sends it in a header. The server charges the card and stores the key together with the result.",
      links: csLinks(),
      packets: [
        { path: ["cli", "srvL"], kind: "request", at: 0.3, dur: 1.3, tag: "POST · key abc123" },
        { path: ["srvR", "db"], kind: "request", at: 1.8, dur: 0.8 },
        { path: ["srvL", "cli"], kind: "response", at: 2.9, dur: 1.4, tag: "200 OK", lost: 0.5 },
      ],
      tokens: [rows(["abc123 → $50 ok"], { from: () => 2.6 })],
      labels: [{ at: "dbLabel", text: "key saved with result", icon: "key", tone: "violet", from: 2.6 }],
    },
    {
      title: "Retry with the same key",
      body:
        "The response is lost again, so the client retries with the same key. The server finds abc123, sees it already handled this, and returns the stored result. No second charge, whatever the network does.",
      links: csLinks(),
      packets: [
        { path: ["cli", "srvL"], kind: "request", at: 0.3, dur: 1.3, tag: "POST · key abc123" },
        { path: ["srvR", "db"], kind: "request", at: 1.8, dur: 0.7, tag: "seen abc123?" },
        { path: ["db", "srvR"], kind: "response", at: 2.6, dur: 0.7, tag: "yes: $50 ok" },
        { path: ["srvL", "cli"], kind: "response", at: 3.5, dur: 1.3, tag: "200 OK (same result)" },
      ],
      tokens: [rows(["abc123 → $50 ok"])],
      labels: [{ at: "dbLabel", text: "still one charge", icon: "check", tone: "green", from: 3.4 }],
    },
    {
      title: "Retry politely: backoff and jitter",
      body:
        "Retrying instantly, forever, can flatten a struggling server. Wait 1 second, then 2, then 4, and add a little randomness (jitter) so thousands of clients don't all retry at the same instant. Give up after a few tries.",
      links: csLinks(),
      packets: [
        { path: ["cli", "srvL"], kind: "request", at: 0.2, dur: 1, tag: "try 1", lost: 0.8 },
        { path: ["cli", "srvL"], kind: "request", at: 1.6, dur: 1, tag: "try 2 (+1 s)", lost: 0.8 },
        { path: ["cli", "srvL"], kind: "request", at: 3.4, dur: 1, tag: "try 3 (+2 s)" },
        { path: ["srvL", "cli"], kind: "response", at: 4.6, dur: 1, tag: "200 OK" },
      ],
      labels: [{ at: "cliLabel", text: "1 s · 2 s · 4 s + jitter", icon: "clock", tone: "yellow", from: 0.3 }],
    },
  ],
  quiz: [
    {
      q: "A POST request times out. What do you know?",
      options: ["It definitely failed", "It definitely succeeded", "It may or may not have been processed", "The server is down"],
      answer: 2,
      explain: "The request, the processing or the response could have failed. That uncertainty is why idempotency matters.",
    },
    {
      q: "What does the server do when it receives an idempotency key it has seen before?",
      options: ["Processes the request again", "Returns the stored result of the first attempt", "Rejects with 500", "Deletes the key"],
      answer: 1,
      explain: "The key maps to the original outcome, so the repeat has no new side effects.",
    },
    {
      q: "Why add jitter to retry delays?",
      options: [
        "To make retries faster",
        "So many clients don't retry at exactly the same moment and overload the server again",
        "To encrypt the request",
        "Jitter is required by HTTP",
      ],
      answer: 1,
      explain: "Synchronised retries create waves of load. Random spread smooths them out.",
    },
  ],
  article: [
    {
      heading: "Why retries are dangerous",
      paragraphs: [
        "In a distributed system any call can fail partway: the request may never arrive, the server may crash mid-work, or the response may be lost. From the client's side all three look like a timeout. Retrying is necessary for reliability, but if the operation has side effects, such as charging a card, sending an email or creating an order, a blind retry can do it twice.",
      ],
    },
    {
      heading: "Idempotency",
      paragraphs: [
        "An operation is idempotent if performing it multiple times has the same effect as performing it once. HTTP defines GET, HEAD, PUT and DELETE as idempotent; POST and PATCH are not guaranteed to be. Designing operations to be idempotent (\"set status to paid\" rather than \"add $50\") makes systems far easier to make reliable.",
      ],
    },
    {
      heading: "Idempotency keys",
      paragraphs: [
        "For operations that aren't naturally idempotent, the client sends a unique idempotency key (often a UUID) with the request. The server records the key and the result atomically with the operation. If the same key arrives again, the server returns the stored result instead of repeating the work. Keys are typically kept for 24 hours or more. Payment APIs such as Stripe's use exactly this pattern.",
        "Message consumers use the same idea: store the IDs of processed messages and skip duplicates. It's how at-least-once delivery becomes effectively-once processing.",
      ],
    },
    {
      heading: "Retry strategy",
      paragraphs: [
        "Retry only errors that might succeed next time: timeouts, 429, 502, 503 and 504, not 400 or 404. Use exponential backoff with jitter, cap the number of attempts and the total time, and combine retries with circuit breakers so a failing dependency isn't hammered. In interviews, mention idempotency whenever your design involves payments, orders or message processing.",
      ],
    },
  ],
};

export default lesson;
