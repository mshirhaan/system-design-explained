/**
 * The Design Studio's traffic model. Pure functions, no React.
 *
 * Traffic starts at Users and flows along connections as three kinds of request:
 *  - static: images, scripts and styles. A CDN answers these near the user; otherwise app servers serve them.
 *  - reads: need data. Caches answer most; misses go to the database or replicas.
 *  - writes: change data. They must reach the main database, directly or through a queue.
 *
 * Every block has a capacity (requests per second across its working instances) and a base latency.
 * As load approaches capacity, waiting grows as base × (1 + u / (1 − u)); above capacity the
 * excess is dropped and counts as failed requests.
 */

import { ALLOWED, KINDS, spec, type LearnKey, type NodeKind, type Size } from "./catalog";

export interface Autoscale {
  on: boolean;
  min: number;
  max: number;
}

export interface LabNode {
  id: string;
  kind: NodeKind;
  gx: number;
  gy: number;
  count: number; // instances
  size: Size;
  failed: number; // instances currently down
  autoscale?: Autoscale;
}

export interface LabEdge {
  id: string;
  from: string;
  to: string;
}

export interface Design {
  nodes: LabNode[];
  edges: LabEdge[];
}

export interface Workload {
  rps: number;
  writeShare: number; // 0–1 of all requests
  staticShare: number; // 0–1 of all requests
  cacheHit: number; // 0–1 of reads a cache can answer
}

export const DEFAULT_WORKLOAD: Workload = { rps: 1_000, writeShare: 0.1, staticShare: 0.3, cacheHit: 0.85 };

export const INTERNET_MS = 50; // user to data centre and back
export const EDGE_MS = 12; // user to a nearby CDN and back

export interface NodeStats {
  instances: number; // working instances taking traffic
  capacity: number;
  load: number;
  served: number;
  dropped: number;
  utilisation: number;
  latencyMs: number;
  costPerMonth: number;
  down: boolean;
}

export interface QueueStats {
  inflow: number; // writes accepted per second
  processed: number; // writes saved to the database per second
  growth: number; // backlog change per second (inflow + catch-up − processed)
}

export interface Problem {
  text: string;
  nodeId?: string;
  learn?: LearnKey;
  severity: "bad" | "warn";
}

export interface SimResult {
  nodes: Record<string, NodeStats>;
  edges: Record<string, number>;
  queues: Record<string, QueueStats>;
  offered: number;
  succeeded: number;
  errorRate: number;
  avgLatencyMs: number;
  costPerMonth: number;
  problems: Problem[];
}

export interface SimOptions {
  /** Instance counts to use instead of the design's (used by autoscaling during a run). */
  counts?: Record<string, number>;
  /** Writes waiting in each queue, and the tick length, so workers can catch up. */
  backlog?: Record<string, number>;
  tickSeconds?: number;
}

const waitFactor = (u: number) => {
  const x = Math.min(u, 0.985);
  return 1 + x / (1 - x);
};

type Flow = { st: number; rd: number; wr: number; q: number }; // q = writes coming out of a queue
const ZERO: Flow = { st: 0, rd: 0, wr: 0, q: 0 };
const total = (f: Flow) => f.st + f.rd + f.wr + f.q;
const scale = (f: Flow, k: number): Flow => ({ st: f.st * k, rd: f.rd * k, wr: f.wr * k, q: f.q * k });

const ORDER: NodeKind[] = ["cdn", "lb", "app", "cache", "queue", "replica", "db"];

export function simulate(design: Design, w: Workload, opts: SimOptions = {}): SimResult {
  const { nodes, edges } = design;
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const outs = (id: string) => edges.filter((e) => e.from === id && byId.has(e.to));
  const ins = (id: string) => edges.filter((e) => e.to === id && byId.has(e.from));
  const problems: Problem[] = [];
  const say = (p: Problem) => problems.push(p);

  const stats: Record<string, NodeStats> = {};
  const edgeLoad: Record<string, number> = {};
  const queues: Record<string, QueueStats> = {};
  for (const e of edges) edgeLoad[e.id] = 0;

  const configured = (n: LabNode) => Math.max(0, Math.round(opts.counts?.[n.id] ?? n.count));
  /** A block with no working instances. Load balancers and app servers route around these. */
  const isDown = (id: string) => {
    const n = byId.get(id);
    return !!n && n.kind !== "users" && configured(n) - n.failed <= 0;
  };
  let cost = 0;
  for (const n of nodes) {
    const c = n.kind === "users" ? 0 : spec(n.kind, n.size).cost * configured(n);
    cost += c;
    stats[n.id] = { instances: 0, capacity: 0, load: 0, served: 0, dropped: 0, utilisation: 0, latencyMs: 0, costPerMonth: c, down: false };
  }

  const inbox = new Map<string, Flow>();
  const send = (to: string, f: Flow, edgeId?: string) => {
    const cur = inbox.get(to) ?? { ...ZERO };
    inbox.set(to, { st: cur.st + f.st, rd: cur.rd + f.rd, wr: cur.wr + f.wr, q: cur.q + f.q });
    if (edgeId) edgeLoad[edgeId] += total(f);
  };
  const spread = (targets: { id: string; to: string }[], f: Flow) => {
    for (const e of targets) send(e.to, scale(f, 1 / targets.length), e.id);
  };

  let failed = 0;
  let succeeded = 0;
  let latencySum = 0; // Σ requests × ms, for requests that succeed

  // ---- Users
  const users = nodes.filter((n) => n.kind === "users");
  if (!users.length) say({ text: "Add a Users block so there is traffic to serve.", severity: "bad" });
  for (const u of users) {
    const share = 1 / users.length;
    const f: Flow = {
      st: w.rps * w.staticShare * share,
      wr: w.rps * w.writeShare * share,
      rd: w.rps * Math.max(0, 1 - w.staticShare - w.writeShare) * share,
      q: 0,
    };
    const next = outs(u.id);
    stats[u.id].load = total(f);
    if (!next.length) {
      failed += total(f);
      say({ text: "Users aren't connected to anything, so every request fails.", nodeId: u.id, severity: "bad" });
    } else spread(next, f);
  }

  // Requests that end successfully at a node: record their latency budget (block time is added separately).
  const finish = (n: number, edge: boolean) => {
    succeeded += n;
    latencySum += n * (edge ? EDGE_MS : INTERNET_MS);
  };

  const queueWritesAtDb = new Map<string, number>(); // db id → queued writes arriving
  const queueOrigin = new Map<string, { queueId: string; amount: number }[]>();

  for (const kind of ORDER) {
    for (const n of nodes.filter((x) => x.kind === kind)) {
      const f = inbox.get(n.id);
      const info = KINDS[n.kind];
      const s = stats[n.id];
      const per = spec(n.kind, n.size).capacity;
      let working = Math.max(0, configured(n) - n.failed);

      // App groups only share traffic if a load balancer sits in front of them.
      if (n.kind === "app" && working > 1) {
        const parents = ins(n.id).map((e) => byId.get(e.from)!.kind);
        if (parents.length && parents.some((k) => k !== "lb")) {
          working = 1;
          say({
            text: `${configured(n)} app servers, but no load balancer in front, so one instance takes all the traffic.`,
            nodeId: n.id,
            learn: "lb",
            severity: "bad",
          });
        }
      }
      s.instances = working;
      s.capacity = per * working;
      s.down = working === 0;
      if (!f) continue;

      const load = total(f);
      s.load = load;
      if (s.down) {
        s.dropped = load - f.q;
        failed += load - f.q;
        if (load > 0) say({ text: `${info.label} ${n.failed ? "is down" : "has no instances"}, so its traffic fails.`, nodeId: n.id, learn: "spof", severity: "bad" });
        if (f.q > 0) for (const o of queueOrigin.get(n.id) ?? []) queues[o.queueId].processed -= o.amount;
        continue;
      }

      const served = Math.min(load, s.capacity);
      const keep = load > 0 ? served / load : 1;
      s.served = served;
      s.dropped = load - served;
      s.utilisation = s.capacity > 0 ? load / s.capacity : 0;
      s.latencyMs = info.latencyMs * waitFactor(s.utilisation);
      // Queued writes that a busy database can't take go back to the queue instead of failing.
      const droppedQueued = f.q * (1 - keep);
      failed += s.dropped - droppedQueued;
      if (droppedQueued > 0) for (const o of queueOrigin.get(n.id) ?? []) queues[o.queueId].processed -= o.amount * (1 - keep);
      // Every request (except background queue writes) waits here.
      latencySum += (served - f.q * keep) * s.latencyMs;
      const flow = scale(f, keep);
      const next = outs(n.id);
      const to = (kinds: NodeKind[]) => next.filter((e) => kinds.includes(byId.get(e.to)!.kind));

      if (s.utilisation > 1) {
        say({
          text: `${info.label} overloaded: ${Math.round(load).toLocaleString()} req/s arrive, ${Math.round(s.capacity).toLocaleString()} can be handled.`,
          nodeId: n.id,
          learn: n.kind === "db" || n.kind === "replica" ? "scaling" : n.kind === "app" ? "scaling" : "queueing",
          severity: "bad",
        });
      } else if (s.utilisation > 0.85) {
        say({ text: `${info.label} is ${Math.round(s.utilisation * 100)}% busy, so requests queue up there.`, nodeId: n.id, learn: "queueing", severity: "warn" });
      }

      if (kind === "cdn") {
        finish(flow.st, true);
        const onward = { ...flow, st: 0 };
        if (total(onward) > 0) {
          if (next.length) spread(next, onward);
          else {
            failed += total(onward);
            say({ text: "The CDN only answers static files. Connect it to your load balancer or app servers for the rest.", nodeId: n.id, learn: "cdn", severity: "bad" });
          }
        }
        continue;
      }

      if (kind === "lb") {
        const healthy = next.filter((e) => !isDown(e.to));
        if (healthy.length) spread(healthy, flow);
        else {
          failed += total(flow);
          say({ text: "The load balancer has no app servers behind it.", nodeId: n.id, learn: "lb", severity: "bad" });
        }
        continue;
      }

      if (kind === "app") {
        finish(flow.st, false); // app servers can serve static files themselves
        const caches = to(["cache"]).filter((e) => !isDown(e.to));
        const qs = to(["queue"]).filter((e) => !isDown(e.to));
        const dbs = to(["db"]);
        const readers = to(["db", "replica"]).filter((e) => !isDown(e.to));
        // Writes: a queue if there is one, else the main database (directly or via a cache that reaches it).
        if (flow.wr > 0) {
          const cacheToDb = caches.filter((c) => outs(c.to).some((e) => byId.get(e.to)!.kind === "db"));
          if (qs.length) spread(qs, { ...ZERO, wr: flow.wr });
          else if (dbs.length) spread(dbs, { ...ZERO, wr: flow.wr });
          else if (cacheToDb.length) spread(cacheToDb, { ...ZERO, wr: flow.wr });
          else {
            failed += flow.wr;
            say({ text: "Writes (orders, sign-ups, posts) have nowhere to go. Connect the app servers to the main Database.", nodeId: n.id, severity: "bad" });
          }
        }
        if (flow.rd > 0) {
          if (caches.length) spread(caches, { ...ZERO, rd: flow.rd });
          else if (readers.length) spread(readers, { ...ZERO, rd: flow.rd });
          else {
            failed += flow.rd;
            say({ text: "Reads have nowhere to go. Connect the app servers to a cache or database.", nodeId: n.id, severity: "bad" });
          }
        }
        continue;
      }

      if (kind === "cache") {
        const hits = flow.rd * w.cacheHit;
        finish(hits, false);
        const misses = flow.rd - hits;
        const readers = to(["db", "replica"]).filter((e) => !isDown(e.to));
        const dbs = to(["db"]);
        if (misses > 0) {
          if (readers.length) spread(readers, { ...ZERO, rd: misses });
          else {
            failed += misses;
            say({ text: "Cache misses have nowhere to go. Connect the cache to a database.", nodeId: n.id, learn: "cache", severity: "bad" });
          }
        }
        if (flow.wr > 0) {
          if (dbs.length) spread(dbs, { ...ZERO, wr: flow.wr });
          else failed += flow.wr;
        }
        continue;
      }

      if (kind === "queue") {
        // Writes are accepted straight away: from the user's point of view they succeeded.
        finish(flow.wr, false);
        const backlog = opts.backlog?.[n.id] ?? 0;
        const tick = opts.tickSeconds ?? 60;
        const workers = spec("queue", n.size).capacity * working;
        const want = flow.wr + backlog / tick;
        const drain = Math.min(want, workers);
        const dbs = to(["db"]);
        queues[n.id] = { inflow: flow.wr, processed: dbs.length ? drain : 0, growth: 0 };
        if (dbs.length) {
          for (const e of dbs) {
            const amount = drain / dbs.length;
            send(e.to, { ...ZERO, q: amount }, e.id);
            queueOrigin.set(e.to, [...(queueOrigin.get(e.to) ?? []), { queueId: n.id, amount }]);
          }
        } else say({ text: "The queue has nowhere to save writes. Connect it to the main Database.", nodeId: n.id, learn: "queues", severity: "bad" });
        if (workers < flow.wr) say({ text: `Queue workers save ${Math.round(workers).toLocaleString()} writes/s but ${Math.round(flow.wr).toLocaleString()} arrive, so a backlog builds.`, nodeId: n.id, learn: "queues", severity: "warn" });
        continue;
      }

      if (kind === "replica") {
        finish(flow.rd, false);
        if (flow.wr + flow.q > 0) failed += flow.wr; // replicas can't take writes
        continue;
      }

      if (kind === "db") {
        finish(flow.rd + flow.wr, false);
        if (flow.q > 0) queueWritesAtDb.set(n.id, flow.q);
      }
    }
  }

  for (const q of Object.values(queues)) {
    q.processed = Math.max(0, q.processed);
    q.growth = q.inflow - q.processed;
  }

  const offered = w.rps;
  succeeded = Math.min(succeeded, offered);
  const failRate = offered > 0 ? Math.min(1, Math.max(0, failed / offered)) : 0;
  return {
    nodes: stats,
    edges: edgeLoad,
    queues,
    offered,
    succeeded: Math.max(0, offered * (1 - failRate)),
    errorRate: failRate,
    avgLatencyMs: succeeded > 0 ? latencySum / succeeded : 0,
    costPerMonth: cost,
    problems: dedupe(problems).sort((a, b) => (a.severity === b.severity ? 0 : a.severity === "bad" ? -1 : 1)),
  };
}

function dedupe(ps: Problem[]): Problem[] {
  const seen = new Set<string>();
  return ps.filter((p) => (seen.has(p.text) ? false : (seen.add(p.text), true)));
}

export function canConnect(design: Design, from: string, to: string): { ok: true } | { ok: false; reason: string } {
  const a = design.nodes.find((n) => n.id === from);
  const b = design.nodes.find((n) => n.id === to);
  if (!a || !b || a.id === b.id) return { ok: false, reason: "Pick two different blocks." };
  if (design.edges.some((e) => e.from === from && e.to === to)) return { ok: false, reason: "Those are already connected." };
  if (!ALLOWED[a.kind].includes(b.kind)) {
    const ok = ALLOWED[a.kind].map((k) => KINDS[k].label);
    return {
      ok: false,
      reason: ok.length ? `${KINDS[a.kind].label} can send traffic to: ${ok.join(", ")}.` : `${KINDS[a.kind].label} doesn't send traffic onward.`,
    };
  }
  return { ok: true };
}
