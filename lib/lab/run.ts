/**
 * "Run a day": plays 24 simulated hours through a design, tick by tick.
 * Traffic follows a profile, autoscaling adds and removes app servers with a boot delay,
 * scheduled failures take instances down, and queue backlogs carry over between ticks.
 */

import { simulate, type Design, type LabNode, type SimResult, type Workload } from "./model";
import type { NodeKind } from "./catalog";

export interface ProfilePoint {
  k: number; // multiplier on the workload's peak rps
  writeShare?: number;
}

export interface Profile {
  id: string;
  label: string;
  at: (hour: number) => ProfilePoint;
}

/** People's daily rhythm: quietest around 4am, busiest around 8pm (share of peak traffic). */
const DAY_SHAPE: [number, number][] = [
  [0, 0.45], [2, 0.25], [4, 0.15], [6, 0.22], [8, 0.42], [10, 0.55], [12, 0.65], [14, 0.62],
  [17, 0.7], [19, 0.92], [20, 1], [21, 0.95], [22, 0.8], [24, 0.45],
];
const daily = (h: number) => {
  const x = ((h % 24) + 24) % 24;
  for (let i = 1; i < DAY_SHAPE.length; i++) {
    const [h1, v1] = DAY_SHAPE[i];
    const [h0, v0] = DAY_SHAPE[i - 1];
    if (x <= h1) {
      const t = (x - h0) / (h1 - h0);
      const smooth = t * t * (3 - 2 * t);
      return v0 + (v1 - v0) * smooth;
    }
  }
  return DAY_SHAPE[0][1];
};

export const PROFILES: Record<string, Profile> = {
  steady: { id: "steady", label: "Steady", at: () => ({ k: 1 }) },
  daily: { id: "daily", label: "Daily cycle", at: (h) => ({ k: daily(h) }) },
  spike: {
    id: "spike",
    label: "Daily cycle + viral spike",
    at: (h) => ({ k: Math.max(daily(h) * 0.45, h >= 12 && h < 14 ? 1 - Math.abs(h - 12.6) * 0.25 : 0) }),
  },
  flash: {
    id: "flash",
    label: "Flash sale at noon",
    at: (h) => {
      const base = daily(h) * 0.2;
      // Shoppers start arriving half an hour early, then the sale opens at 12:00 for 90 minutes.
      if (h >= 11.5 && h < 12) return { k: Math.max(base, (h - 11.5) * 1.2), writeShare: 0.2 };
      if (h >= 12 && h < 13.5) return { k: Math.max(base, 1 - (h - 12) * 0.35), writeShare: 0.4 };
      return { k: base };
    },
  },
};

/** Autoscaling aims for app servers to be about this busy. */
export const TARGET = 0.6;

export interface FailureEvent {
  at: number; // hour
  kind: NodeKind; // which kind of block is hit (the biggest group of that kind)
  instances: number; // how many instances go down (Infinity = the whole block)
  hours: number; // how long until it recovers
  label: string;
}

export interface Sample {
  hour: number;
  rps: number;
  errorRate: number;
  latencyMs: number;
  costPerHour: number;
  appInstances: number;
  backlog: number;
  queueDelayMin: number;
}

export interface RunState {
  hour: number;
  counts: Record<string, number>;
  pending: { id: string; ready: number; delta: number }[];
  backlog: Record<string, number>;
  failures: { nodeId: string; until: number; n: number; label: string }[];
  lastUtil: Record<string, number>;
  lastScale: Record<string, number>;
  history: Sample[];
  log: { hour: number; text: string; tone: "bad" | "good" | "info" }[];
  totals: { requests: number; failed: number; latencyWeighted: number; succeeded: number; cost: number; maxDelayMin: number; peakLatency: number };
  last?: SimResult;
}

export function startRun(design: Design, workload?: Workload, profile?: Profile): RunState {
  const counts: Record<string, number> = {};
  for (const n of design.nodes) counts[n.id] = n.count;
  // Autoscaled groups start the day at the size the autoscaler would have settled on overnight.
  const scaled = design.nodes.filter((n) => n.kind === "app" && n.autoscale?.on);
  if (scaled.length && workload && profile) {
    const probe: Record<string, number> = { ...counts };
    for (const n of scaled) probe[n.id] = n.autoscale!.max;
    const first = profile.at(0);
    const r = simulate(design, { ...workload, rps: workload.rps * first.k, writeShare: first.writeShare ?? workload.writeShare }, { counts: probe });
    for (const n of scaled) {
      const per = r.nodes[n.id] ? r.nodes[n.id].capacity / Math.max(1, r.nodes[n.id].instances) : 1;
      const want = Math.ceil((r.nodes[n.id]?.load ?? 0) / Math.max(1, per * TARGET));
      counts[n.id] = Math.max(n.autoscale!.min, Math.min(n.autoscale!.max, want));
    }
  } else for (const n of scaled) counts[n.id] = Math.max(n.autoscale!.min, Math.min(n.count, n.autoscale!.max));
  return {
    hour: 0,
    counts,
    pending: [],
    backlog: {},
    failures: [],
    lastUtil: {},
    lastScale: {},
    history: [],
    log: [{ hour: 0, text: "Day starts. Traffic is light.", tone: "info" }],
    totals: { requests: 0, failed: 0, latencyWeighted: 0, succeeded: 0, cost: 0, maxDelayMin: 0, peakLatency: 0 },
  };
}

const fmt = (h: number) => (h >= 24 ? "24:00" : `${String(Math.floor(h)).padStart(2, "0")}:${String(Math.floor((h % 1) * 60)).padStart(2, "0")}`);
export const clock = fmt;

function biggest(design: Design, kind: NodeKind, counts: Record<string, number>): LabNode | undefined {
  return design.nodes.filter((n) => n.kind === kind).sort((a, b) => (counts[b.id] ?? b.count) - (counts[a.id] ?? a.count))[0];
}

export function stepRun(design: Design, workload: Workload, profile: Profile, events: FailureEvent[], prev: RunState, dtHours: number): RunState {
  const s: RunState = {
    ...prev,
    counts: { ...prev.counts },
    pending: [...prev.pending],
    backlog: { ...prev.backlog },
    failures: [...prev.failures],
    lastUtil: { ...prev.lastUtil },
    lastScale: { ...prev.lastScale },
    history: [...prev.history],
    log: [...prev.log],
    totals: { ...prev.totals },
  };
  const from = s.hour;
  const h = Math.min(24, from + dtHours);
  s.hour = h;

  // Scheduled failures and recoveries.
  for (const ev of events) {
    if (ev.at > from && ev.at <= h) {
      const target = biggest(design, ev.kind, s.counts);
      if (target) {
        const n = Number.isFinite(ev.instances) ? ev.instances : s.counts[target.id] ?? target.count;
        s.failures.push({ nodeId: target.id, until: ev.at + ev.hours, n, label: ev.label });
        s.log.push({ hour: ev.at, text: ev.label, tone: "bad" });
      }
    }
  }
  const before = s.failures.length;
  s.failures = s.failures.filter((f) => f.until > h);
  if (s.failures.length < before) s.log.push({ hour: h, text: "A failed block recovered.", tone: "good" });

  // Servers that finished booting join the group.
  for (const p of s.pending.filter((p) => p.ready <= h)) {
    s.counts[p.id] = (s.counts[p.id] ?? 0) + p.delta;
    s.log.push({ hour: p.ready, text: `Autoscaling: ${p.delta} new app server${p.delta > 1 ? "s" : ""} ready (${s.counts[p.id]} running).`, tone: "good" });
  }
  s.pending = s.pending.filter((p) => p.ready > h);

  // Autoscaling decisions (target tracking): every 3 simulated minutes, size each group so it runs
  // about 60% busy. New servers take 5 minutes to boot; groups shrink one server at a time.
  for (const n of design.nodes) {
    const a = n.autoscale;
    if (n.kind !== "app" || !a?.on) continue;
    if (h - (s.lastScale[n.id] ?? -1) < 3 / 60) continue;
    const u = s.lastUtil[n.id] ?? 0;
    const cur = s.counts[n.id] ?? n.count;
    const booting = s.pending.filter((p) => p.id === n.id).reduce((x, p) => x + p.delta, 0);
    const want = Math.max(a.min, Math.min(a.max, Math.ceil((cur * u) / TARGET)));
    if (u > 0.72 && want > cur + booting) {
      const add = want - cur - booting;
      s.pending.push({ id: n.id, ready: h + 5 / 60, delta: add });
      s.lastScale[n.id] = h;
      s.log.push({ hour: h, text: `Autoscaling: app servers ${Math.round(u * 100)}% busy, starting ${add} more.`, tone: "info" });
    } else if (u < 0.35 && booting === 0 && cur > a.min) {
      s.counts[n.id] = cur - 1;
      s.lastScale[n.id] = h;
    }
  }

  // Apply failures as extra failed instances.
  const failedBy: Record<string, number> = {};
  for (const f of s.failures) failedBy[f.nodeId] = (failedBy[f.nodeId] ?? 0) + f.n;
  const live: Design = {
    nodes: design.nodes.map((n) => ({ ...n, failed: Math.min(s.counts[n.id] ?? n.count, n.failed + (failedBy[n.id] ?? 0)) })),
    edges: design.edges,
  };

  const mid = (from + h) / 2;
  const pt = profile.at(mid);
  const wl: Workload = { ...workload, rps: Math.round(workload.rps * pt.k), writeShare: pt.writeShare ?? workload.writeShare };
  const dtSec = (h - from) * 3600;
  const r = simulate(live, wl, { counts: s.counts, backlog: s.backlog, tickSeconds: dtSec });
  s.last = r;

  for (const n of design.nodes) s.lastUtil[n.id] = r.nodes[n.id]?.utilisation ?? 0;
  let backlogTotal = 0;
  let delay = 0;
  for (const [id, q] of Object.entries(r.queues)) {
    s.backlog[id] = Math.max(0, (s.backlog[id] ?? 0) + q.growth * dtSec);
    backlogTotal += s.backlog[id];
    if (s.backlog[id] > 0) delay = Math.max(delay, s.backlog[id] / Math.max(1, q.processed) / 60);
  }

  const reqs = wl.rps * dtSec;
  s.totals.requests += reqs;
  s.totals.failed += reqs * r.errorRate;
  s.totals.succeeded += reqs * (1 - r.errorRate);
  s.totals.latencyWeighted += reqs * (1 - r.errorRate) * r.avgLatencyMs;
  s.totals.cost += (r.costPerMonth / 730) * (h - from);
  s.totals.maxDelayMin = Math.max(s.totals.maxDelayMin, delay);
  if (wl.rps > 0 && r.succeeded > 0) s.totals.peakLatency = Math.max(s.totals.peakLatency, r.avgLatencyMs);

  if (r.errorRate > 0.05 && (s.history.at(-1)?.errorRate ?? 0) <= 0.05) s.log.push({ hour: h, text: `Errors climbing: ${Math.round(r.errorRate * 100)}% of requests failing.`, tone: "bad" });
  if (r.errorRate <= 0.01 && (s.history.at(-1)?.errorRate ?? 0) > 0.05) s.log.push({ hour: h, text: "Errors back under 1%.", tone: "good" });

  s.history.push({
    hour: h,
    rps: wl.rps,
    errorRate: r.errorRate,
    latencyMs: r.avgLatencyMs,
    costPerHour: r.costPerMonth / 730,
    appInstances: design.nodes.filter((n) => n.kind === "app").reduce((x, n) => x + (s.counts[n.id] ?? n.count), 0),
    backlog: backlogTotal,
    queueDelayMin: delay,
  });
  if (h >= 24) s.log.push({ hour: 24, text: "Day complete.", tone: "info" });
  return s;
}

export interface DaySummary {
  errorRate: number;
  avgLatencyMs: number;
  peakLatencyMs: number;
  costPerDay: number;
  maxQueueDelayMin: number;
}

export function summarise(s: RunState): DaySummary {
  const t = s.totals;
  return {
    errorRate: t.requests > 0 ? t.failed / t.requests : 0,
    avgLatencyMs: t.succeeded > 0 ? t.latencyWeighted / t.succeeded : 0,
    peakLatencyMs: t.peakLatency,
    costPerDay: t.cost,
    maxQueueDelayMin: t.maxDelayMin,
  };
}

/** Run a whole day at once (for checking goals without animation). */
export function runDay(design: Design, workload: Workload, profile: Profile, events: FailureEvent[], dtHours = 0.05): RunState {
  let s = startRun(design, workload, profile);
  while (s.hour < 24) s = stepRun(design, workload, profile, events, s, dtHours);
  return s;
}
