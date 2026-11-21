import type { LearnKey, NodeKind } from "./catalog";
import { simulate, type Design, type LabEdge, type LabNode, type SimResult, type Workload } from "./model";
import type { DaySummary, FailureEvent } from "./run";

export interface GoalCtx {
  steady: SimResult;
  day?: DaySummary;
  design: Design;
  workload: Workload;
  /** Re-run the steady simulation with some instances of a kind of block failed. */
  withFailure: (kind: NodeKind, instances: number) => SimResult;
}

export interface Goal {
  text: string;
  check: (c: GoalCtx) => boolean;
  /** Only checkable after running the day. */
  needsDay?: boolean;
}

export interface Challenge {
  id: string;
  title: string;
  story: string;
  mode: "steady" | "day";
  workload: Workload;
  profile?: string;
  events?: FailureEvent[];
  goals: Goal[];
  /** Cost limits for the 2nd and 3rd star (per month for steady challenges, per day for day challenges). */
  stars: [number, number];
  hint: string;
  teaches: LearnKey[];
  start: Design;
}

/* ---------- helpers ---------- */
export function node(id: string, kind: NodeKind, gx: number, gy: number, extra: Partial<LabNode> = {}): LabNode {
  return { id, kind, gx, gy, count: 1, size: "s", failed: 0, ...extra };
}
const edge = (from: string, to: string): LabEdge => ({ id: `${from}-${to}`, from, to });

export function withFailure(design: Design, workload: Workload, kind: NodeKind, instances: number): SimResult {
  const target = design.nodes.filter((n) => n.kind === kind).sort((a, b) => b.count - a.count)[0];
  if (!target) return simulate(design, workload);
  return simulate(
    { nodes: design.nodes.map((n) => (n.id === target.id ? { ...n, failed: Math.min(n.count, n.failed + instances) } : n)), edges: design.edges },
    workload,
  );
}

const pct = (x: number) => `${x}%`;
const errorsBelow = (p: number): Goal => ({ text: `Fewer than ${pct(p)} of requests fail`, check: (c) => c.steady.errorRate * 100 < p });
const latencyBelow = (ms: number): Goal => ({ text: `Average response under ${ms} ms`, check: (c) => c.steady.succeeded > 0 && c.steady.avgLatencyMs < ms });
const monthlyBudget = (usd: number): Goal => ({ text: `Costs no more than $${usd.toLocaleString()} a month`, check: (c) => c.steady.costPerMonth <= usd });
const dayErrors = (p: number): Goal => ({ text: `Fewer than ${pct(p)} of the day's requests fail`, needsDay: true, check: (c) => !!c.day && c.day.errorRate * 100 < p });
const dayPeakLatency = (ms: number): Goal => ({ text: `Even the slowest hour averages under ${ms} ms`, needsDay: true, check: (c) => !!c.day && c.day.peakLatencyMs < ms });
const dayBudget = (usd: number): Goal => ({ text: `The day costs no more than $${usd}`, needsDay: true, check: (c) => !!c.day && c.day.costPerDay <= usd });

export function costOf(ch: Challenge, ctx: GoalCtx): number | undefined {
  return ch.mode === "day" ? ctx.day?.costPerDay : ctx.steady.costPerMonth;
}

export function starsFor(ch: Challenge, ctx: GoalCtx): 0 | 1 | 2 | 3 {
  if (!ch.goals.every((g) => g.check(ctx))) return 0;
  const cost = costOf(ch, ctx);
  if (cost === undefined) return 1;
  if (cost <= ch.stars[1]) return 3;
  if (cost <= ch.stars[0]) return 2;
  return 1;
}

const starter: Design = {
  nodes: [node("users", "users", 0, 3), node("app", "app", 3, 3), node("db", "db", 6, 3)],
  edges: [edge("users", "app"), edge("app", "db")],
};
const base = { writeShare: 0.1, staticShare: 0.3, cacheHit: 0.85 };

export const CHALLENGES: Challenge[] = [
  {
    id: "first-users",
    title: "Your first users",
    story:
      "Your shop just launched with about 50 visitors a second. Learn the controls: drag a Cache from the Blocks list onto the canvas, then drag from the app server's ＋ handle onto the cache, and from the cache's ＋ handle onto the database.",
    mode: "steady",
    workload: { rps: 50, ...base },
    goals: [
      {
        text: "A cache sits between the app server and the database",
        check: (c) => {
          const kind = new Map(c.design.nodes.map((n) => [n.id, n.kind]));
          const has = (a: string, b: string) => c.design.edges.some((e) => kind.get(e.from) === a && kind.get(e.to) === b);
          return has("app", "cache") && has("cache", "db");
        },
      },
      errorsBelow(1),
      latencyBelow(120),
      monthlyBudget(500),
    ],
    stars: [450, 400],
    hint: "Drag the orange Cache block onto the canvas. Hover the App block and drag its purple ＋ handle onto the cache. Then do the same from the cache to the database. Once it's green, open Free play later and push the traffic up to see what breaks first.",
    teaches: ["cache", "queueing"],
    start: starter,
  },
  {
    id: "launch-day",
    title: "Launch day",
    story: "A newsletter goes out and traffic jumps to 1,200 requests per second. One small app server handles about 300. Keep the site up without overspending.",
    mode: "steady",
    workload: { rps: 1200, ...base },
    goals: [errorsBelow(1), latencyBelow(150), monthlyBudget(1200)],
    stars: [800, 690],
    hint: "Put a load balancer in front and give the app servers more instances (select them and press +). Then look at the database: a cache in front of it answers most reads.",
    teaches: ["lb", "scaling", "cache"],
    start: starter,
  },
  {
    id: "going-viral",
    title: "Going viral",
    story: "A celebrity shares your product: 6,000 requests per second, and most of them are for product photos and page files. Users are everywhere, so speed matters too.",
    mode: "steady",
    workload: { rps: 6000, writeShare: 0.05, staticShare: 0.6, cacheHit: 0.9 },
    goals: [errorsBelow(1), latencyBelow(100), monthlyBudget(3000)],
    stars: [1600, 1250],
    hint: "Static files are 60% of the traffic. A CDN answers them close to users, which cuts both load and latency. Behind it you still need a load balancer, app servers and a cache.",
    teaches: ["cdn", "cache"],
    start: starter,
  },
  {
    id: "too-many-writes",
    title: "Too many writes",
    story: "Your app is now a social network: 4,000 requests per second, and 30% are writes (posts, likes, comments). Writes can't be cached and can't go to replicas.",
    mode: "steady",
    workload: { rps: 4000, writeShare: 0.3, staticShare: 0.3, cacheHit: 0.85 },
    goals: [errorsBelow(1), latencyBelow(150), monthlyBudget(2500)],
    stars: [2050, 1990],
    hint: "1,200 writes per second is more than a small database can take, and replicas won't help with writes. Select the database and pick a bigger size: that's scaling up.",
    teaches: ["scaling", "replicas"],
    start: starter,
  },
  {
    id: "survive-a-crash",
    title: "Survive a crash",
    story: "Machines fail. At 1,500 requests per second, your design must keep working when an app server crashes, and reads must keep working even if the main database goes down.",
    mode: "steady",
    workload: { rps: 1500, ...base },
    goals: [
      errorsBelow(1),
      { text: "Fewer than 1% fail when one app server crashes", check: (c) => c.withFailure("app", 1).errorRate < 0.01 },
      { text: "If the database crashes, under 15% fail", check: (c) => c.withFailure("db", Infinity).errorRate < 0.15 },
      monthlyBudget(2500),
    ],
    stars: [1300, 1100],
    hint: "Give the app servers one instance more than the traffic needs (N+1). For the database, add read replicas and connect the cache to them, so reads still work while the main database is down.",
    teaches: ["spof", "replicas", "lb"],
    start: starter,
  },
  {
    id: "day-in-the-life",
    title: "A day in the life",
    story: "Traffic follows people's days: quiet at 4am, 5,000 requests per second at 8pm. Paying for peak capacity all day is wasteful. Press Run the day to test your design over 24 hours.",
    mode: "day",
    workload: { rps: 5000, ...base },
    profile: "daily",
    goals: [dayErrors(1), dayPeakLatency(250), dayBudget(52)],
    stars: [50, 48.5],
    hint: "Select the app servers and switch on autoscaling with a sensible minimum and maximum. New servers take a few minutes to boot, so don't set the threshold too tight: keep a little headroom.",
    teaches: ["autoscaling", "cache"],
    start: starter,
  },
  {
    id: "flash-sale",
    title: "Flash sale",
    story: "At noon a flash sale starts: traffic jumps to 10,000 requests per second, and 40% are orders. No database you can afford saves 4,000 orders a second, but nobody's order may be lost.",
    mode: "day",
    workload: { rps: 10000, ...base },
    profile: "flash",
    goals: [dayErrors(1), { text: "Every order is saved within 30 minutes", needsDay: true, check: (c) => !!c.day && c.day.maxQueueDelayMin <= 30 }, dayBudget(80)],
    stars: [66, 60],
    hint: "Put a Queue & workers block between the app servers and the database. It accepts orders instantly and saves them as fast as the database allows, so the burst turns into a short backlog instead of errors.",
    teaches: ["queues", "autoscaling"],
    start: starter,
  },
  {
    id: "chaos-day",
    title: "Chaos day",
    story: "Today things break on schedule: app servers crash at 09:00 and 20:00, a cache instance dies at 13:00 and the main database is down from 17:00 to 18:30. Keep failures low all day with 2,000 requests per second at peak.",
    mode: "day",
    workload: { rps: 2000, ...base },
    profile: "daily",
    events: [
      { at: 9, kind: "app", instances: 1, hours: 2, label: "09:00 One app server crashed." },
      { at: 13, kind: "cache", instances: 1, hours: 1, label: "13:00 A cache instance died." },
      { at: 17, kind: "db", instances: Infinity, hours: 1.5, label: "17:00 The main database crashed. It takes 90 minutes to recover." },
      { at: 20, kind: "app", instances: 2, hours: 1, label: "20:00 Two app servers crashed at peak time." },
    ],
    goals: [dayErrors(1), dayPeakLatency(400), dayBudget(70)],
    stars: [55, 48],
    hint: "Every block needs a spare: extra app servers behind a load balancer, two cache instances, read replicas for when the database is down, and the app servers connected to the database directly as a fallback if the cache dies.",
    teaches: ["spof", "replicas", "lb"],
    start: starter,
  },
];
