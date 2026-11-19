import type { LabEdge, LabNode, SimResult } from "./model";

export interface Goal {
  text: string;
  check: (r: SimResult) => boolean;
}

export interface Challenge {
  id: string;
  title: string;
  story: string;
  rps: number;
  goals: Goal[];
  hint: string;
  start: { nodes: LabNode[]; edges: LabEdge[] };
}

const errorsBelow = (pct: number): Goal => ({ text: `Fewer than ${pct}% of requests fail`, check: (r) => r.errorRate * 100 < pct });
const latencyBelow = (ms: number): Goal => ({ text: `Average response under ${ms} ms`, check: (r) => r.succeeded > 0 && r.avgLatencyMs < ms });
const budget = (usd: number): Goal => ({ text: `Costs under $${usd.toLocaleString()} per month`, check: (r) => r.costPerMonth <= usd });

const starter = {
  nodes: [
    { id: "u", kind: "users" as const, gx: 0, gy: 3 },
    { id: "a1", kind: "app" as const, gx: 3, gy: 3 },
    { id: "d1", kind: "db" as const, gx: 6, gy: 3 },
  ],
  edges: [
    { id: "e1", from: "u", to: "a1" },
    { id: "e2", from: "a1", to: "d1" },
  ],
};

export const CHALLENGES: Challenge[] = [
  {
    id: "first-users",
    title: "1. Your first users",
    story: "Your shop just launched. About 50 people browse it every second. One app server and one database should be plenty. Check that everything is green.",
    rps: 50,
    goals: [errorsBelow(1), latencyBelow(120), budget(500)],
    hint: "This one already works. Try raising the traffic slider in Free play to see where it breaks.",
    start: starter,
  },
  {
    id: "launch-day",
    title: "2. Launch day",
    story: "A newsletter goes out and traffic jumps to 1,200 requests per second. One app server handles about 300. Keep the site up without overspending.",
    rps: 1200,
    goals: [errorsBelow(1), latencyBelow(150), budget(1_200)],
    hint: "Add a load balancer in front, then several app servers behind it. Watch the database: 1,200 requests a second is more than it can take. A cache in front of it answers most reads.",
    start: starter,
  },
  {
    id: "going-viral",
    title: "3. Going viral",
    story: "A celebrity shares your product. 6,000 requests per second, mostly people browsing. Users are everywhere, so speed matters too.",
    rps: 6000,
    goals: [errorsBelow(1), latencyBelow(100), budget(3_000)],
    hint: "A CDN answers a big share of requests close to users, which cuts both load and latency. Behind it you'll still need a load balancer, enough app servers and a cache.",
    start: starter,
  },
];
