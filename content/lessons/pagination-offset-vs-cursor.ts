import type { LessonContent } from "@/components/scene/types";
import { clientServerDb, csLinks, rows } from "./_layouts";

const req = (tag: string) => ({ path: ["cli", "srvL"], kind: "request" as const, at: 0.3, dur: 1.2, tag });
const res = (tag: string, at = 3) => ({ path: ["srvL", "cli"], kind: "response" as const, at, dur: 1.2, tag });
const db = (tag?: string) => [
  { path: ["srvR", "db"], kind: "request" as const, at: 1.6, dur: 0.6, tag },
  { path: ["db", "srvR"], kind: "response" as const, at: 2.3, dur: 0.6 },
];
const page = (tags: string[], from = 4.2) => ({ at: "page", gap: [0, 21] as [number, number], items: tags.map((t, i) => ({ kind: "row" as const, tag: t, from: from + i * 0.15 })) });
const table = ["post 1", "post 2", "post 3", "post 4", "post 5", "post 6", "post 7"];

const lesson: LessonContent = {
  slug: "pagination-offset-vs-cursor",
  intro:
    "Nobody loads a million posts at once. APIs return them a page at a time. The obvious way, \"skip 20, take 10\", breaks when new posts arrive and gets slow deep down. Watch both problems, then the cursor fix.",
  learn: [
    "Why APIs paginate",
    "How offset pagination works",
    "Why offsets duplicate or skip items when data changes",
    "Why large offsets are slow",
    "How cursor pagination fixes both",
  ],
  keyIdea:
    "Offset pagination counts positions, so it shifts when rows are added and must skip over everything before the page. Cursor pagination remembers the last item seen and asks for what comes after it: stable and fast at any depth.",
  scene: clientServerDb({ clientName: "feed app", client: "phone", dbName: "posts", points: { page: [-430, -40], cliLabel: [-360, 60] } }),
  steps: [
    {
      title: "Too much to send at once",
      body:
        "The posts table has a million rows. Sending them all would take ages and crash the phone. So the API returns a page at a time, say 3 posts, and the app asks for more as you scroll.",
      tokens: [rows(table.slice(0, 6))],
      labels: [
        { at: "dbLabel", text: "1,000,000 posts", icon: "db", tone: "yellow", from: 0.2 },
        { at: "cliLabel", text: "show 3 at a time", icon: "page", from: 0.8 },
      ],
      hold: 2.6,
    },
    {
      title: "Offset pagination: page 1",
      body:
        "The simplest approach: ?offset=0&limit=3 means skip 0 rows, take 3. The database runs LIMIT 3 OFFSET 0 and returns posts 1–3.",
      links: csLinks(),
      packets: [req("GET /posts?offset=0&limit=3"), ...db("OFFSET 0 LIMIT 3"), res("posts 1–3")],
      tokens: [rows(table.slice(0, 6)), page(["post 1", "post 2", "post 3"])],
    },
    {
      title: "A new post shifts everything",
      body:
        "While you read, someone publishes a new post at the top. Now ask for page 2 with offset=3. Every row moved down one place, so the 4th row is post 3, which you've already seen. Duplicates appear (and deletions cause skips).",
      links: csLinks(),
      packets: [req("GET /posts?offset=3&limit=3"), ...db("OFFSET 3 LIMIT 3"), res("posts 3–5")],
      tokens: [rows(["NEW post", ...table.slice(0, 5)], { from: (i) => (i === 0 ? 0.2 : undefined) }), page(["post 3 (again!)", "post 4", "post 5"])],
      labels: [{ at: "cliLabel", text: "seen post 3 twice", icon: "info", tone: "orange", from: 4.8 }],
    },
    {
      title: "Deep pages get slow",
      body:
        "Jump to page 300,000 and the database must read and throw away 900,000 rows to find where the page starts. The deeper you go, the slower each page gets.",
      links: csLinks(),
      packets: [req("GET /posts?offset=900000"), { path: ["srvR", "db"], kind: "request", at: 1.6, dur: 0.6, tag: "OFFSET 900000" }, { path: ["db", "srvR"], kind: "response", at: 4.2, dur: 0.6 }, res("posts 900001…", 5)],
      tokens: [rows(table.slice(0, 6))],
      focus: ["db"],
      labels: [{ at: "dbLabel", text: "scanning 900,000 rows…", icon: "clock", tone: "orange", from: 2.2 }],
    },
    {
      title: "Cursor pagination",
      body:
        "Instead of a position, the server returns a cursor pointing at the last item you got, for example after=post_3. The next request asks for posts after that one: WHERE id < 3 ORDER BY id DESC LIMIT 3. An index finds the spot instantly.",
      links: csLinks(),
      packets: [req("GET /posts?after=post_3"), ...db("WHERE id < 3 LIMIT 3"), res("posts 4–6 · next: post_6")],
      tokens: [rows(["NEW post", ...table.slice(0, 5)]), page(["post 4", "post 5", "post 6"])],
      labels: [{ at: "dbLabel", text: "index jump, no scanning", icon: "bolt", tone: "green", from: 2.3 }],
    },
    {
      title: "Stable while data changes",
      body:
        "More posts arrive at the top, but the cursor still says \"after post 6\", so the next page is exactly posts 7, 8, 9. No duplicates, no gaps, and page 300,000 is as fast as page 1.",
      links: csLinks(),
      packets: [req("GET /posts?after=post_6"), ...db(), res("posts 7–9")],
      tokens: [rows(["NEW", "NEW post", ...table.slice(0, 4)], { from: (i) => (i === 0 ? 0.3 : undefined) }), page(["post 7", "post 8", "post 9"])],
      labels: [{ at: "cliLabel", text: "no repeats", icon: "check", tone: "green", from: 4.8 }],
    },
    {
      title: "Which to use",
      body:
        "Cursors suit feeds, timelines and infinite scroll, and any large or fast-changing list. Offsets are fine for small, stable lists where users want numbered pages. The catch with cursors: you can't jump straight to page 50.",
      focus: ["client"],
      labels: [
        { at: "cliLabel", text: "feeds → cursor", icon: "check", tone: "green", from: 0.3 },
        { at: "srvLabel", text: "small admin tables → offset is fine", icon: "page", from: 1 },
      ],
      hold: 3,
    },
  ],
  quiz: [
    {
      q: "Why does offset pagination show duplicates when new items are added?",
      options: ["The database has a bug", "New rows shift every position, so the next offset lands on items already seen", "Cursors are cached", "The client sends the wrong limit"],
      answer: 1,
      explain: "Offsets count positions. Inserting at the top pushes existing rows down, so page boundaries move.",
    },
    {
      q: "Why is OFFSET 900000 slow?",
      options: ["Network latency", "The database reads and discards 900,000 rows before returning the page", "JSON is slow", "The client is slow"],
      answer: 1,
      explain: "OFFSET can't jump; it walks past every skipped row. Cursor queries use an index to start right at the cursor.",
    },
    {
      q: "What's a drawback of cursor pagination?",
      options: ["It's slow on deep pages", "It shows duplicates", "You can't jump directly to an arbitrary page number", "It needs no index"],
      answer: 2,
      explain: "Cursors are relative to the last item, so \"go to page 50\" isn't possible without walking there.",
    },
  ],
  article: [
    {
      heading: "Why paginate",
      paragraphs: [
        "Any endpoint that returns a list should be paginated: it keeps responses small and fast, protects the database and lets clients load data as needed. The two main approaches are offset-based and cursor-based (also called keyset) pagination.",
      ],
    },
    {
      heading: "Offset pagination",
      paragraphs: [
        "Offset pagination uses parameters like ?offset=40&limit=20 or ?page=3, translated to SQL LIMIT 20 OFFSET 40. It's simple and supports jumping to any page, but it has two problems. When rows are inserted or deleted between requests, page boundaries shift, causing duplicates or missed items. And the database must scan and discard all the offset rows, so deep pages get progressively slower.",
      ],
    },
    {
      heading: "Cursor pagination",
      paragraphs: [
        "Cursor pagination returns an opaque token identifying the last item of the page, often an encoded ID or (timestamp, id) pair. The next request asks for items after that cursor, which becomes a query like WHERE (created_at, id) < (?, ?) ORDER BY created_at DESC, id DESC LIMIT 20. With an index on those columns, every page costs the same regardless of depth, and inserts elsewhere don't disturb the sequence.",
        "Include a tiebreaker (usually the ID) so ordering is unique, and encode the cursor so clients treat it as opaque and you can change its format later.",
      ],
    },
    {
      heading: "In interviews",
      paragraphs: [
        "When you design a feed, timeline, chat history or search results, say you'll use cursor-based pagination and why. It's a small detail that signals you've thought about scale and correctness.",
      ],
    },
  ],
};

export default lesson;
