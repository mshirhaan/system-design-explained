/**
 * Everything the Design Studio knows about its building blocks.
 * Numbers are rough but realistic, chosen so trade-offs show up clearly.
 */

export type NodeKind = "users" | "cdn" | "lb" | "app" | "cache" | "queue" | "db" | "replica";
export type Size = "s" | "m" | "l";

export interface SizeSpec {
  capacity: number; // requests per second per instance
  cost: number; // USD per month per instance
}

export interface KindInfo {
  label: string;
  short: string;
  description: string;
  latencyMs: number;
  /** Can this block run several instances? */
  scalable: boolean;
  maxCount: number;
  sizes: Partial<Record<Size, SizeSpec>>;
  /** Colour used in the minimap. */
  dot: string;
}

export const SIZE_LABEL: Record<Size, string> = { s: "Small", m: "Medium", l: "Large" };

export const KINDS: Record<NodeKind, KindInfo> = {
  users: {
    label: "Users",
    short: "Users",
    description: "Where traffic comes from. The workload decides how many requests per second they send and what kind.",
    latencyMs: 0,
    scalable: false,
    maxCount: 1,
    sizes: { s: { capacity: Infinity, cost: 0 } },
    dot: "#6f6961",
  },
  cdn: {
    label: "CDN",
    short: "CDN",
    description: "Servers close to users that answer requests for static files (images, scripts, styles) without touching your data centre.",
    latencyMs: 8,
    scalable: false,
    maxCount: 1,
    sizes: { s: { capacity: 200_000, cost: 150 } },
    dot: "#c9b8e5",
  },
  lb: {
    label: "Load balancer",
    short: "LB",
    description: "Spreads incoming requests across every app server behind it, and skips instances that are down.",
    latencyMs: 1,
    scalable: false,
    maxCount: 1,
    sizes: { s: { capacity: 50_000, cost: 25 } },
    dot: "#b0d59c",
  },
  app: {
    label: "App servers",
    short: "App",
    description: "Run your code. Add instances to scale out (needs a load balancer), or pick a bigger size to scale up.",
    latencyMs: 20,
    scalable: true,
    maxCount: 60,
    sizes: { s: { capacity: 300, cost: 70 }, m: { capacity: 800, cost: 170 }, l: { capacity: 2_000, cost: 420 } },
    dot: "#a7c3e7",
  },
  cache: {
    label: "Cache (Redis)",
    short: "Cache",
    description: "Keeps popular data in memory and answers most reads in about 1 ms. Misses go on to the database.",
    latencyMs: 1,
    scalable: true,
    maxCount: 8,
    sizes: { s: { capacity: 30_000, cost: 60 }, m: { capacity: 80_000, cost: 150 } },
    dot: "#f2b27c",
  },
  queue: {
    label: "Queue & workers",
    short: "Queue",
    description:
      "Accepts writes instantly and saves them to the database in the background. Absorbs bursts; if workers fall behind, a backlog builds up.",
    latencyMs: 3,
    scalable: true,
    maxCount: 20,
    sizes: { s: { capacity: 500, cost: 40 }, m: { capacity: 1_500, cost: 100 } },
    dot: "#f5cb7f",
  },
  db: {
    label: "Database",
    short: "DB",
    description: "The main database. Every write must end up here. Scale it up with a bigger size; replicas only add read capacity.",
    latencyMs: 8,
    scalable: false,
    maxCount: 1,
    sizes: { s: { capacity: 1_000, cost: 250 }, m: { capacity: 3_000, cost: 700 }, l: { capacity: 8_000, cost: 1_800 } },
    dot: "#fcda9a",
  },
  replica: {
    label: "Read replicas",
    short: "Replica",
    description: "Read-only copies of the database. Each adds read capacity and keeps reads working if the main database is down.",
    latencyMs: 8,
    scalable: true,
    maxCount: 8,
    sizes: { s: { capacity: 1_000, cost: 250 }, m: { capacity: 3_000, cost: 700 }, l: { capacity: 8_000, cost: 1_800 } },
    dot: "#c2e0b1",
  },
};

export const PALETTE: NodeKind[] = ["users", "cdn", "lb", "app", "cache", "queue", "db", "replica"];

/** Which connections make sense: from → allowed targets. */
export const ALLOWED: Record<NodeKind, NodeKind[]> = {
  users: ["cdn", "lb", "app"],
  cdn: ["lb", "app"],
  lb: ["app"],
  app: ["cache", "queue", "db", "replica"],
  cache: ["db", "replica"],
  queue: ["db"],
  db: [],
  replica: [],
};

export function sizesOf(kind: NodeKind): Size[] {
  return (Object.keys(KINDS[kind].sizes) as Size[]).filter((s) => KINDS[kind].sizes[s]);
}

export function spec(kind: NodeKind, size: Size): SizeSpec {
  return KINDS[kind].sizes[size] ?? KINDS[kind].sizes.s!;
}

/** Lessons that explain each problem, by curriculum slug. */
export const LEARN = {
  scaling: { title: "Vertical vs horizontal scaling", slug: "vertical-vs-horizontal-scaling" },
  lb: { title: "Load balancers: L4 vs L7", slug: "load-balancers-l4-vs-l7" },
  cache: { title: "Why caching works", slug: "why-caching-works" },
  cdn: { title: "CDNs and edge caching", slug: "cdns-and-edge-caching" },
  replicas: { title: "Read replicas", slug: "read-replicas" },
  queues: { title: "Why go async", slug: "why-go-async" },
  queueing: { title: "Throughput, bandwidth and queues", slug: "throughput-bandwidth-and-queues" },
  spof: { title: "Redundancy and single points of failure", slug: "redundancy-and-single-points-of-failure" },
  autoscaling: { title: "Autoscaling", slug: "autoscaling" },
} as const;

export type LearnKey = keyof typeof LEARN;
