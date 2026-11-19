/**
 * The Design Sandbox's traffic model. Pure functions, no React.
 *
 * Traffic starts at the Users node and flows along connections. Each component
 * has a capacity (requests per second it can serve) and a base latency. When
 * load approaches capacity, waiting time grows as base × (1 + u / (1 − u));
 * above capacity, the excess is dropped and counts as errors.
 */

export type NodeKind = "users" | "cdn" | "lb" | "app" | "cache" | "db" | "replica";

export interface LabNode {
  id: string;
  kind: NodeKind;
  gx: number; // grid position
  gy: number;
}

export interface LabEdge {
  id: string;
  from: string;
  to: string;
}

export interface Spec {
  label: string;
  short: string;
  capacity: number; // requests per second
  latencyMs: number; // base time spent here per request
  costPerMonth: number; // USD
  blurb: string;
}

export const SPECS: Record<NodeKind, Spec> = {
  users: { label: "Users", short: "Users", capacity: Infinity, latencyMs: 0, costPerMonth: 0, blurb: "Where traffic comes from. Set how many requests per second they send." },
  cdn: {
    label: "CDN",
    short: "CDN",
    capacity: 100_000,
    latencyMs: 10,
    costPerMonth: 150,
    blurb: "Servers near users that answer requests for images, scripts and cached pages. Here it answers 60% of requests itself.",
  },
  lb: { label: "Load balancer", short: "LB", capacity: 20_000, latencyMs: 1, costPerMonth: 25, blurb: "Spreads incoming requests evenly across the app servers it connects to." },
  app: { label: "App server", short: "App", capacity: 300, latencyMs: 20, costPerMonth: 70, blurb: "Runs your code. Handles about 300 requests per second." },
  cache: {
    label: "Cache (Redis)",
    short: "Cache",
    capacity: 50_000,
    latencyMs: 1,
    costPerMonth: 60,
    blurb: "Keeps popular data in memory. Answers about 85% of reads in ~1 ms; misses go to the database.",
  },
  db: { label: "Database", short: "DB", capacity: 1_000, latencyMs: 8, costPerMonth: 250, blurb: "The main database. Handles about 1,000 queries per second. All writes must come here." },
  replica: { label: "Read replica", short: "Replica", capacity: 1_000, latencyMs: 8, costPerMonth: 250, blurb: "A read-only copy of the database. Adds read capacity, but can't take writes." },
};

/** Which connections make sense, from → allowed to. */
export const ALLOWED: Record<NodeKind, NodeKind[]> = {
  users: ["cdn", "lb", "app"],
  cdn: ["lb", "app"],
  lb: ["app"],
  app: ["cache", "db", "replica"],
  cache: ["db", "replica"],
  db: [],
  replica: [],
};

export const CDN_SHARE = 0.6; // share of user requests the CDN can answer itself
export const CACHE_HIT = 0.85; // share of reads the cache answers
export const INTERNET_MS = 50; // user ↔ data centre round trip
export const EDGE_MS = 15; // user ↔ nearby CDN round trip

export interface NodeStats {
  load: number; // requests per second arriving
  served: number;
  dropped: number;
  utilisation: number; // 0–1+, load / capacity
  latencyMs: number; // time per request here, including waiting
}

export interface SimResult {
  nodes: Record<string, NodeStats>;
  edges: Record<string, number>; // requests per second on each connection
  offered: number;
  succeeded: number;
  errorRate: number; // 0–1
  avgLatencyMs: number;
  costPerMonth: number;
  bottleneck?: string; // id of the most overloaded node
  problems: string[]; // plain-language explanations of what's wrong
}

function waitFactor(u: number) {
  const x = Math.min(u, 0.98);
  return 1 + x / (1 - x);
}

export function simulate(nodes: LabNode[], edges: LabEdge[], rps: number, writeShare = 0.1): SimResult {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const out = (id: string) => edges.filter((e) => e.from === id && byId.has(e.to));
  const stats: Record<string, NodeStats> = {};
  const edgeLoad: Record<string, number> = {};
  for (const n of nodes) stats[n.id] = { load: 0, served: 0, dropped: 0, utilisation: 0, latencyMs: 0 };
  for (const e of edges) edgeLoad[e.id] = 0;
  const problems: string[] = [];
  let failed = 0;
  let latencySum = 0; // Σ requests × ms

  // Requests carry a kind: reads and writes behave differently below the app tier.
  type Flow = { reads: number; writes: number };
  const inbox = new Map<string, Flow>();
  const add = (id: string, f: Flow, edgeId?: string) => {
    const cur = inbox.get(id) ?? { reads: 0, writes: 0 };
    cur.reads += f.reads;
    cur.writes += f.writes;
    inbox.set(id, cur);
    if (edgeId) edgeLoad[edgeId] += f.reads + f.writes;
  };
  const split = (targets: LabEdge[], f: Flow) => {
    for (const e of targets) add(e.to, { reads: f.reads / targets.length, writes: f.writes / targets.length }, e.id);
  };

  const users = nodes.filter((n) => n.kind === "users");
  if (users.length === 0) problems.push("Add a Users block so there's traffic to serve.");
  for (const u of users) {
    const first = out(u.id);
    const f = { reads: (rps * (1 - writeShare)) / users.length, writes: (rps * writeShare) / users.length };
    if (first.length === 0) {
      failed += f.reads + f.writes;
      problems.push("Users aren't connected to anything, so every request fails.");
      continue;
    }
    split(first, f);
  }

  // Process in dependency order: users → cdn → lb → app → cache → db/replica.
  const order: NodeKind[] = ["cdn", "lb", "app", "cache", "db", "replica"];
  for (const kind of order) {
    for (const n of nodes.filter((x) => x.kind === kind)) {
      const f = inbox.get(n.id);
      if (!f) continue;
      const spec = SPECS[n.kind];
      const load = f.reads + f.writes;
      const served = Math.min(load, spec.capacity);
      const dropped = load - served;
      const keep = load > 0 ? served / load : 0;
      const u = load / spec.capacity;
      const lat = spec.latencyMs * waitFactor(u);
      stats[n.id] = { load, served, dropped, utilisation: u, latencyMs: lat };
      failed += dropped;
      latencySum += served * lat;
      const flow = { reads: f.reads * keep, writes: f.writes * keep };
      const next = out(n.id);

      if (kind === "cdn") {
        const atEdge = { reads: flow.reads * CDN_SHARE, writes: 0 };
        const onward = { reads: flow.reads - atEdge.reads, writes: flow.writes };
        // Requests answered at the edge only pay the short trip to the CDN.
        latencySum += atEdge.reads * EDGE_MS;
        if (next.length) split(next, onward);
        else if (onward.reads + onward.writes > 0) {
          failed += onward.reads + onward.writes;
          problems.push("The CDN can't answer everything itself. Connect it to a load balancer or app server.");
        }
        continue;
      }
      if (kind === "lb" || kind === "users") {
        if (next.length) split(next, flow);
        else {
          failed += load;
          problems.push("The load balancer isn't connected to any app servers.");
        }
        continue;
      }
      if (kind === "app") {
        const caches = next.filter((e) => byId.get(e.to)?.kind === "cache");
        const dbs = next.filter((e) => byId.get(e.to)?.kind === "db");
        const readDbs = next.filter((e) => ["db", "replica"].includes(byId.get(e.to)!.kind));
        if (!next.length) {
          failed += load;
          problems.push("An app server has nowhere to read or save data. Connect it to a database.");
          continue;
        }
        // Writes must reach the main database, directly or through a cache.
        const cacheDbs = caches.flatMap((c) => out(c.to).filter((e) => byId.get(e.to)?.kind === "db"));
        if (flow.writes > 0) {
          if (dbs.length) split(dbs, { reads: 0, writes: flow.writes });
          else if (cacheDbs.length) {
            split(caches, { reads: 0, writes: flow.writes });
          } else {
            failed += flow.writes;
            problems.push("Writes (like new orders) need the main Database; replicas and caches can't store them.");
          }
        }
        if (caches.length) split(caches, { reads: flow.reads, writes: 0 });
        else if (readDbs.length) split(readDbs, { reads: flow.reads, writes: 0 });
        else {
          failed += flow.reads;
          problems.push("Reads have nowhere to go. Connect the app server to a cache or database.");
        }
        continue;
      }
      if (kind === "cache") {
        const misses = { reads: flow.reads * (1 - CACHE_HIT), writes: flow.writes };
        const readDbs = next.filter((e) => ["db", "replica"].includes(byId.get(e.to)!.kind));
        const dbs = next.filter((e) => byId.get(e.to)?.kind === "db");
        if (misses.reads > 0) {
          if (readDbs.length) split(readDbs, { reads: misses.reads, writes: 0 });
          else {
            failed += misses.reads;
            problems.push("Cache misses have nowhere to go. Connect the cache to a database.");
          }
        }
        if (misses.writes > 0) {
          if (dbs.length) split(dbs, { reads: 0, writes: misses.writes });
          else failed += misses.writes;
        }
        continue;
      }
      if (kind === "replica" && f.writes > 0) {
        // Shouldn't happen given routing, but keep the model honest.
        failed += f.writes;
      }
    }
  }

  const offered = rps;
  const succeeded = Math.max(0, offered - failed);
  // Every successful request that reached the data centre also paid the internet round trip.
  const viaEdgeOnly = nodes.filter((n) => n.kind === "cdn").reduce((a, n) => a + (stats[n.id].served * CDN_SHARE * (1 - writeShare)), 0);
  const viaDc = Math.max(0, succeeded - viaEdgeOnly);
  const avgLatencyMs = succeeded > 0 ? (latencySum + viaDc * INTERNET_MS) / succeeded : 0;

  let bottleneck: string | undefined;
  let worst = 0;
  for (const n of nodes) {
    if (n.kind === "users") continue;
    const u = stats[n.id].utilisation;
    if (u > worst) {
      worst = u;
      bottleneck = n.id;
    }
  }
  if (bottleneck && worst > 1) {
    const n = byId.get(bottleneck)!;
    problems.unshift(`${SPECS[n.kind].label} is overloaded: ${Math.round(stats[n.id].load).toLocaleString()} requests/s arrive but it handles ${SPECS[n.kind].capacity.toLocaleString()}.`);
  } else if (bottleneck && worst > 0.8) {
    const n = byId.get(bottleneck)!;
    problems.unshift(`${SPECS[n.kind].label} is ${Math.round(worst * 100)}% busy, so requests are waiting in line there.`);
  }

  return {
    nodes: stats,
    edges: edgeLoad,
    offered,
    succeeded,
    errorRate: offered > 0 ? failed / offered : 0,
    avgLatencyMs,
    costPerMonth: nodes.reduce((a, n) => a + SPECS[n.kind].costPerMonth, 0),
    bottleneck: worst > 0.8 ? bottleneck : undefined,
    problems: [...new Set(problems)],
  };
}
