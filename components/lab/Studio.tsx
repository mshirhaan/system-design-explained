"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ALLOWED, KINDS, LEARN, PALETTE, SIZE_LABEL, sizesOf, spec, type NodeKind, type Size } from "@/lib/lab/catalog";
import { CHALLENGES, costOf, node as makeNode, starsFor, withFailure, type Challenge, type GoalCtx } from "@/lib/lab/challenges";
import { DEFAULT_WORKLOAD, canConnect, simulate, type Design, type LabNode, type Workload } from "@/lib/lab/model";
import { PROFILES, clock, startRun, stepRun, summarise, type RunState } from "@/lib/lab/run";
import { TEMPLATES } from "@/lib/lab/templates";
import { SceneDefs } from "@/components/scene/SceneDefs";
import { NodeArt } from "./art";
import { Board, CELL, MAX_ZOOM, MIN_ZOOM, gridToWorld, noteSize, worldToGrid, type Selection, type View } from "./Board";
import { DayChart, Sparkline } from "./Charts";

/* ---------------- helpers ---------------- */
type Mode = { kind: "challenge"; index: number } | { kind: "free" };
const modeKey = (m: Mode) => (m.kind === "free" ? "free" : CHALLENGES[m.index].id);
const STORE = "sde.studio.v1";
const TICK_HOURS = 0.05; // 3 simulated minutes per tick
const FREE_START: Design = {
  nodes: [makeNode("users", "users", 0, 2), makeNode("lb", "lb", 2, 2), makeNode("app", "app", 4, 2, { count: 3 }), makeNode("cache", "cache", 6, 1), makeNode("db", "db", 8, 2)],
  edges: [
    { id: "e1", from: "users", to: "lb" },
    { id: "e2", from: "lb", to: "app" },
    { id: "e3", from: "app", to: "cache" },
    { id: "e4", from: "cache", to: "db" },
    { id: "e5", from: "app", to: "db" },
  ],
};

interface Stored {
  stars: Record<string, number>;
  designs: Record<string, Design>;
  free?: { workload: Workload; profile: string };
  seenHelp?: boolean;
}
const readStore = (): Stored => {
  try {
    const raw = localStorage.getItem(STORE);
    if (raw) return { stars: {}, designs: {}, ...JSON.parse(raw) };
  } catch {}
  return { stars: {}, designs: {} };
};
const writeStore = (s: Stored) => {
  try {
    localStorage.setItem(STORE, JSON.stringify(s));
  } catch {}
};

let uid = 0;
const newId = (p: string) => `${p}-${Date.now().toString(36)}${(uid++).toString(36)}`;
const clone = (d: Design): Design => ({
  nodes: d.nodes.map((n) => ({ ...n, autoscale: n.autoscale ? { ...n.autoscale } : undefined })),
  edges: d.edges.map((e) => ({ ...e })),
  notes: (d.notes ?? []).map((n) => ({ ...n })),
});

function encodeDesign(mode: string, d: Design): string {
  const compact = {
    m: mode,
    n: d.nodes.map((n) => [n.id, n.kind, n.gx, n.gy, n.count, n.size, n.autoscale?.on ? [n.autoscale.min, n.autoscale.max] : 0]),
    e: d.edges.map((e) => [e.from, e.to]),
    t: (d.notes ?? []).map((n) => [Math.round(n.x), Math.round(n.y), n.text]),
  };
  return btoa(unescape(encodeURIComponent(JSON.stringify(compact)))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function decodeDesign(s: string): { mode: string; design: Design } | null {
  try {
    const json = JSON.parse(decodeURIComponent(escape(atob(s.replace(/-/g, "+").replace(/_/g, "/")))));
    const nodes: LabNode[] = json.n.map((a: [string, NodeKind, number, number, number, Size, 0 | [number, number]]) => ({
      id: a[0], kind: a[1], gx: a[2], gy: a[3], count: a[4], size: a[5], failed: 0,
      autoscale: a[6] ? { on: true, min: a[6][0], max: a[6][1] } : undefined,
    }));
    const edges = json.e.map((a: [string, string], i: number) => ({ id: `e${i}-${a[0]}-${a[1]}`, from: a[0], to: a[1] }));
    if (!nodes.every((n) => n.kind in KINDS)) return null;
    const notes = (json.t ?? []).map((a: [number, number, string], i: number) => ({ id: `note-${i}`, x: a[0], y: a[1], text: String(a[2]).slice(0, 400) }));
    return { mode: json.m, design: { nodes, edges, notes } };
  } catch {
    return null;
  }
}

const money = (n: number) => `$${n >= 100 ? Math.round(n).toLocaleString() : n.toFixed(2)}`;
const ms = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)} s` : `${Math.round(n)} ms`);

/* ---------------- component ---------------- */
export function Studio() {
  const [mode, setMode] = useState<Mode>({ kind: "challenge", index: 1 });
  const [design, setDesign] = useState<Design>(() => clone(CHALLENGES[1].start));
  const past = useRef<Design[]>([]);
  const future = useRef<Design[]>([]);
  const [, force] = useState(0);
  const [selection, setSelection] = useState<Selection>({ nodes: [], edge: null });
  const [view, setView] = useState<View>({ x: 400, y: 120, k: 0.8 });
  const boardSize = useRef({ w: 900, h: 600 });
  const [freeWl, setFreeWl] = useState<Workload>({ ...DEFAULT_WORKLOAD, rps: 2000 });
  const [freeProfile, setFreeProfile] = useState("steady");
  const [run, setRun] = useState<RunState | null>(null);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [panel, setPanel] = useState<"goals" | "inspect" | "workload" | "log">("goals");
  const [menu, setMenu] = useState<MenuState | null>(null);
  const [editing, setEditing] = useState<{ id: string; text: string } | null>(null);
  const [toast, setToast] = useState<{ text: string; tone: "info" | "bad" | "good" } | null>(null);
  const [store, setStore] = useState<Stored>({ stars: {}, designs: {} });
  const [picker, setPicker] = useState(false);
  const [help, setHelp] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(true);
  const [celebrate, setCelebrate] = useState<number | null>(null);
  const [report, setReport] = useState(false);
  const [confetti, setConfetti] = useState(0);
  const clipboard = useRef<Design | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const loaded = useRef(false);

  const ch: Challenge | null = mode.kind === "challenge" ? CHALLENGES[mode.index] : null;
  const workload = ch ? ch.workload : freeWl;
  const profileId = ch ? ch.profile ?? "steady" : freeProfile;
  const profile = PROFILES[profileId] ?? PROFILES.steady;
  const events = ch?.events ?? [];
  const dayMode = ch ? ch.mode === "day" : profileId !== "steady";

  const say = useCallback((text: string, tone: "info" | "bad" | "good" = "info") => {
    setToast({ text, tone });
    window.setTimeout(() => setToast((t) => (t?.text === text ? null : t)), 3200);
  }, []);

  /* ----- simulation ----- */
  const preview: Workload = useMemo(() => {
    if (!dayMode) return workload;
    let best = { k: 0, writeShare: workload.writeShare };
    for (let h = 0; h < 24; h += 0.25) {
      const p = profile.at(h);
      if (p.k > best.k) best = { k: p.k, writeShare: p.writeShare ?? workload.writeShare };
    }
    return { ...workload, rps: Math.round(workload.rps * best.k), writeShare: best.writeShare };
  }, [dayMode, workload, profile]);

  const steady = useMemo(() => simulate(design, preview), [design, preview]);
  const live = run?.last ?? steady;
  const daySummary = run && run.hour >= 24 ? summarise(run) : undefined;
  const ctx: GoalCtx = useMemo(
    () => ({ steady, day: daySummary, design, workload: preview, withFailure: (k, n) => withFailure(design, preview, k, n) }),
    [steady, daySummary, design, preview],
  );
  const stars = ch ? starsFor(ch, ctx) : 0;

  /* ----- history ----- */
  const commit = useCallback(
    (next: Design | ((d: Design) => Design)) => {
      setDesign((cur) => {
        const n = typeof next === "function" ? next(cur) : next;
        if (n === cur) return cur;
        past.current.push(cur);
        if (past.current.length > 120) past.current.shift();
        future.current = [];
        return n;
      });
      setRun(null);
      setPlaying(false);
      force((x) => x + 1);
    },
    [],
  );
  const undo = () => {
    const prev = past.current.pop();
    if (!prev) return;
    future.current.push(design);
    setDesign(prev);
    setRun(null);
    setPlaying(false);
    force((x) => x + 1);
  };
  const redo = () => {
    const next = future.current.pop();
    if (!next) return;
    past.current.push(design);
    setDesign(next);
    setRun(null);
    setPlaying(false);
    force((x) => x + 1);
  };

  /* ----- view ----- */
  const fit = useCallback((d: Design = design) => {
    const { w, h } = boardSize.current;
    if (!d.nodes.length) return setView({ x: w / 2, y: h / 2, k: 1 });
    const pts = d.nodes.map((n) => gridToWorld(n.gx, n.gy));
    const x1 = Math.min(...pts.map((p) => p.x)) - 110, x2 = Math.max(...pts.map((p) => p.x)) + 110;
    const y1 = Math.min(...pts.map((p) => p.y)) - 150, y2 = Math.max(...pts.map((p) => p.y)) + 110;
    // Leave room for the floating panels.
    const padL = paletteOpen && w > 760 ? 230 : 20, padR = 20, padB = w > 760 ? 120 : 60;
    const k = Math.max(MIN_ZOOM, Math.min(1.15, (w - padL - padR) / (x2 - x1), (h - padB - 20) / (y2 - y1)));
    setView({ k, x: padL + (w - padL - padR) / 2 - ((x1 + x2) / 2) * k, y: 20 + (h - padB - 20) / 2 - ((y1 + y2) / 2) * k });
  }, [design, paletteOpen]);
  const zoomBy = (factor: number) => {
    const { w, h } = boardSize.current;
    setView((v) => {
      const k = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, v.k * factor));
      return { k, x: w / 2 - (w / 2 - v.x) * (k / v.k), y: h / 2 - (h / 2 - v.y) * (k / v.k) };
    });
  };

  /* ----- load / save ----- */
  const loadMode = useCallback(
    (m: Mode, from?: Design) => {
      const s = readStore();
      const key = modeKey(m);
      const d = clone(from ?? s.designs[key] ?? (m.kind === "free" ? FREE_START : CHALLENGES[m.index].start));
      setMode(m);
      setDesign(d);
      past.current = [];
      future.current = [];
      setRun(null);
      setPlaying(false);
      setSelection({ nodes: [], edge: null });
      setPanel(m.kind === "free" ? "workload" : "goals");
      setCelebrate(null);
      window.setTimeout(() => fit(d), 30);
    },
    [fit],
  );

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    const s = readStore();
    setStore(s);
    if (s.free) {
      setFreeWl(s.free.workload);
      setFreeProfile(s.free.profile);
    }
    const hash = typeof location !== "undefined" ? location.hash : "";
    const shared = hash.startsWith("#d=") ? decodeDesign(hash.slice(3)) : null;
    if (shared) {
      const idx = CHALLENGES.findIndex((c) => c.id === shared.mode);
      loadMode(idx >= 0 ? { kind: "challenge", index: idx } : { kind: "free" }, shared.design);
      say("Loaded a shared design.", "good");
    } else {
      const first = CHALLENGES.findIndex((c) => !s.stars[c.id]);
      loadMode({ kind: "challenge", index: first < 0 ? 0 : first });
    }
    if (!s.seenHelp) setHelp(true);
    if (window.innerWidth < 820) setPaletteOpen(false);
  }, [loadMode, say]);

  // Save the design for this mode whenever it changes.
  useEffect(() => {
    if (!loaded.current) return;
    const id = window.setTimeout(() => {
      const s = readStore();
      s.designs[modeKey(mode)] = design;
      s.free = { workload: freeWl, profile: freeProfile };
      writeStore(s);
    }, 300);
    return () => window.clearTimeout(id);
  }, [design, mode, freeWl, freeProfile]);

  // Record stars when a challenge is completed.
  useEffect(() => {
    if (!ch || stars === 0) return;
    const s = readStore();
    if ((s.stars[ch.id] ?? 0) < stars) {
      s.stars[ch.id] = stars;
      writeStore(s);
      setStore(s);
      setCelebrate(stars);
      setConfetti((c) => c + 1);
    }
  }, [ch, stars]);

  /* ----- run the day ----- */
  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      setRun((prev) => {
        const base = prev ?? startRun(design, workload, profile);
        if (base.hour >= 24) return base;
        return stepRun(design, workload, profile, events, base, TICK_HOURS * speed);
      });
    }, 100);
    return () => window.clearInterval(id);
  }, [playing, speed, design, workload, profile, events]);
  const finished = !!run && run.hour >= 24;
  useEffect(() => {
    if (finished) {
      setPlaying(false);
      setReport(true);
    }
  }, [finished]);
  const startOrPause = () => {
    if (playing) return setPlaying(false);
    if (!run || run.hour >= 24) setRun(startRun(design, workload, profile));
    setPlaying(true);
    setPanel(ch ? "goals" : "log");
  };

  /* ----- editing ----- */
  const occupied = (d: Design, gx: number, gy: number, except: string[] = []) => d.nodes.some((n) => n.gx === gx && n.gy === gy && !except.includes(n.id));
  const freeCellNear = (d: Design, gx: number, gy: number) => {
    for (let r = 0; r < 12; r++)
      for (let dx = -r; dx <= r; dx++)
        for (let dy = -r; dy <= r; dy++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
          if (!occupied(d, gx + dx, gy + dy)) return { gx: gx + dx, gy: gy + dy };
        }
    return { gx, gy };
  };
  const viewCenterCell = () => {
    const { w, h } = boardSize.current;
    return worldToGrid((w / 2 - view.x) / view.k, (h / 2 - view.y) / view.k);
  };

  const addNode = (kind: NodeKind, at?: { gx: number; gy: number }, connectFrom?: string | null) => {
    if (kind === "users" && design.nodes.some((n) => n.kind === "users")) return say("There's already a Users block. Traffic comes from one place.", "bad");
    const c = at ?? viewCenterCell();
    const cell = freeCellNear(design, c.gx, c.gy);
    const n = makeNode(newId(kind), kind, cell.gx, cell.gy);
    commit((d) => {
      const next = { nodes: [...d.nodes, n], edges: [...d.edges] };
      if (connectFrom) {
        const ok = canConnect(next, connectFrom, n.id);
        if (ok.ok) next.edges.push({ id: newId("e"), from: connectFrom, to: n.id });
      }
      return next;
    });
    setSelection({ nodes: [n.id], edge: null });
    setPanel("inspect");
  };

  const connect = (from: string, to: string) => {
    const ok = canConnect(design, from, to);
    if (!ok.ok) {
      // Maybe the user dragged the other way round.
      const rev = canConnect(design, to, from);
      if (rev.ok) {
        commit((d) => ({ ...d, edges: [...d.edges, { id: newId("e"), from: to, to: from }] }));
        return say("Connected (traffic flows the other way, so the arrow was flipped).", "good");
      }
      return say(ok.reason, "bad");
    }
    commit((d) => ({ ...d, edges: [...d.edges, { id: newId("e"), from, to }] }));
  };

  const moveNodes = (ids: string[], dgx: number, dgy: number) => {
    commit((d) => {
      const moving = new Set(ids);
      for (const n of d.nodes) if (moving.has(n.id) && occupied(d, n.gx + dgx, n.gy + dgy, ids)) return d;
      return { ...d, nodes: d.nodes.map((n) => (moving.has(n.id) ? { ...n, gx: n.gx + dgx, gy: n.gy + dgy } : n)) };
    });
  };

  const removeSelection = () => {
    if (selection.note) {
      const id = selection.note;
      commit((d) => ({ ...d, notes: (d.notes ?? []).filter((n) => n.id !== id) }));
    } else if (selection.edge) {
      const id = selection.edge;
      commit((d) => ({ ...d, edges: d.edges.filter((e) => e.id !== id) }));
    } else if (selection.nodes.length) {
      const ids = new Set(selection.nodes);
      commit((d) => ({ nodes: d.nodes.filter((n) => !ids.has(n.id)), edges: d.edges.filter((e) => !ids.has(e.from) && !ids.has(e.to)) }));
    }
    setSelection({ nodes: [], edge: null });
  };

  const copy = () => {
    const ids = new Set(selection.nodes);
    if (!ids.size) return;
    clipboard.current = clone({ nodes: design.nodes.filter((n) => ids.has(n.id)), edges: design.edges.filter((e) => ids.has(e.from) && ids.has(e.to)) });
    say(`Copied ${ids.size} block${ids.size > 1 ? "s" : ""}.`);
  };
  const paste = (src = clipboard.current) => {
    if (!src || !src.nodes.length) return;
    const map = new Map<string, string>();
    const nodes: LabNode[] = [];
    const tmp: Design = clone(design);
    for (const n of src.nodes) {
      if (n.kind === "users") continue;
      const id = newId(n.kind);
      map.set(n.id, id);
      const cell = freeCellNear(tmp, n.gx + 1, n.gy + 1);
      const nn = { ...n, id, gx: cell.gx, gy: cell.gy, failed: 0 };
      tmp.nodes.push(nn);
      nodes.push(nn);
    }
    const edges = src.edges.filter((e) => map.has(e.from) && map.has(e.to)).map((e) => ({ id: newId("e"), from: map.get(e.from)!, to: map.get(e.to)! }));
    commit((d) => ({ nodes: [...d.nodes, ...nodes], edges: [...d.edges, ...edges] }));
    setSelection({ nodes: nodes.map((n) => n.id), edge: null });
  };
  const duplicate = () => {
    const ids = new Set(selection.nodes);
    paste(clone({ nodes: design.nodes.filter((n) => ids.has(n.id)), edges: design.edges.filter((e) => ids.has(e.from) && ids.has(e.to)) }));
  };

  const patchNode = (id: string, p: Partial<LabNode>) => commit((d) => ({ ...d, nodes: d.nodes.map((n) => (n.id === id ? { ...n, ...p } : n)) }));

  const tidy = () => {
    const col: Record<NodeKind, number> = { users: 0, cdn: 2, lb: 4, app: 6, cache: 8, queue: 8, db: 10, replica: 10 };
    commit((d) => {
      const byCol = new Map<number, LabNode[]>();
      for (const n of d.nodes) byCol.set(col[n.kind], [...(byCol.get(col[n.kind]) ?? []), n]);
      const placed = new Map<string, { gx: number; gy: number }>();
      for (const [c, list] of byCol) {
        list.sort((a, b) => a.gy - b.gy || a.kind.localeCompare(b.kind));
        list.forEach((n, i) => placed.set(n.id, { gx: c, gy: Math.round((i - (list.length - 1) / 2) * 2) + 2 }));
      }
      return { ...d, nodes: d.nodes.map((n) => ({ ...n, ...placed.get(n.id) })) };
    });
    window.setTimeout(() => fit(), 40);
  };

  /** Crash a random working instance somewhere, to test how resilient the design is. */
  const breakSomething = () => {
    const candidates = design.nodes.filter((n) => n.kind !== "users" && (run?.counts[n.id] ?? n.count) - n.failed > 0);
    if (!candidates.length) return say("Nothing left to break.");
    const n = candidates[Math.floor(Math.random() * candidates.length)];
    const what = KINDS[n.kind].scalable && n.count > 1 ? `One ${KINDS[n.kind].label.toLowerCase()} instance` : KINDS[n.kind].label;
    if (run && playing) {
      setRun((prev) =>
        prev
          ? {
              ...prev,
              failures: [...prev.failures, { nodeId: n.id, until: prev.hour + 1, n: 1, label: `${what} crashed` }],
              log: [...prev.log, { hour: prev.hour, text: `${what} crashed (you broke it). It recovers in an hour.`, tone: "bad" as const }],
            }
          : prev,
      );
    } else patchNode(n.id, { failed: n.failed + 1 });
    setSelection({ nodes: [n.id], edge: null });
    say(`${what} crashed. Watch what happens.`, "bad");
  };
  const anyFailed = design.nodes.some((n) => n.failed > 0);
  const recoverAll = () => commit((d) => ({ ...d, nodes: d.nodes.map((n) => ({ ...n, failed: 0 })) }));

  /* ----- notes ----- */
  const addNote = (wx: number, wy: number) => {
    const id = newId("note");
    commit((d) => ({ ...d, notes: [...(d.notes ?? []), { id, x: Math.round(wx - 60), y: Math.round(wy - 20), text: "" }] }));
    setSelection({ nodes: [], edge: null, note: id });
    setEditing({ id, text: "" });
  };
  const saveNote = () => {
    if (!editing) return;
    const text = editing.text.trim();
    const id = editing.id;
    commit((d) => ({ ...d, notes: text ? (d.notes ?? []).map((n) => (n.id === id ? { ...n, text } : n)) : (d.notes ?? []).filter((n) => n.id !== id) }));
    setEditing(null);
  };
  const viewCenterWorld = () => {
    const { w, h } = boardSize.current;
    return { x: (w / 2 - view.x) / view.k, y: (h / 2 - view.y) / view.k };
  };

  /* ----- image export ----- */
  const downloadImage = () => {
    const svg = rootRef.current?.querySelector(".board-svg") as SVGSVGElement | null;
    if (!svg) return;
    const copy = svg.cloneNode(true) as SVGSVGElement;
    copy.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    const style = document.createElementNS("http://www.w3.org/2000/svg", "style");
    style.textContent = ".st{font-family:'JetBrains Mono',ui-monospace,Menlo,Consolas,monospace;fill:#1d1b18}";
    copy.insertBefore(style, copy.firstChild);
    const w = Number(svg.getAttribute("width"));
    const h = Number(svg.getAttribute("height"));
    const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(copy)], { type: "image/svg+xml" }));
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = w * 2;
      c.height = h * 2;
      const ctx2 = c.getContext("2d")!;
      ctx2.scale(2, 2);
      ctx2.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      const a = document.createElement("a");
      a.download = `${ch ? ch.id : "my-design"}.png`;
      a.href = c.toDataURL("image/png");
      a.click();
      say("Image saved.", "good");
    };
    img.src = url;
  };

  const share = async () => {
    const url = `${location.origin}${location.pathname}#d=${encodeDesign(modeKey(mode), design)}`;
    try {
      await navigator.clipboard.writeText(url);
      say("Share link copied to your clipboard.", "good");
    } catch {
      window.prompt("Copy this link:", url);
    }
  };

  const fullscreen = () => {
    try {
      if (document.fullscreenElement) document.exitFullscreen();
      else rootRef.current?.requestFullscreen();
    } catch {}
  };

  const resetChallenge = () => {
    if (!ch) return;
    commit(clone(ch.start));
    window.setTimeout(() => fit(ch.start), 30);
  };

  /* ----- keyboard ----- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("input, textarea, select, [contenteditable]")) return;
      const mod = e.metaKey || e.ctrlKey;
      const key = e.key.toLowerCase();
      if (mod && key === "z") (e.preventDefault(), e.shiftKey ? redo() : undo());
      else if (mod && key === "y") (e.preventDefault(), redo());
      else if (mod && key === "c") copy();
      else if (mod && key === "v") (e.preventDefault(), paste());
      else if (mod && key === "d") (e.preventDefault(), duplicate());
      else if (mod && key === "a") (e.preventDefault(), setSelection({ nodes: design.nodes.map((n) => n.id), edge: null }));
      else if (key === "delete" || key === "backspace") removeSelection();
      else if (key === "escape") (setSelection({ nodes: [], edge: null }), setMenu(null), setHelp(false), setPicker(false), setReport(false), setEditing(null));
      else if (key === "n" && !mod) (e.preventDefault(), addNote(viewCenterWorld().x, viewCenterWorld().y));
      else if (key === "f") fit();
      else if (key === "=" || key === "+") zoomBy(1.2);
      else if (key === "-") zoomBy(1 / 1.2);
      else if (key === "0") setView((v) => ({ ...v, k: 1 }));
      else if (key === "?") setHelp((x) => !x);
      else if (key === " " && dayMode) (e.preventDefault(), startOrPause());
      else if (key.startsWith("arrow") && selection.nodes.length) {
        e.preventDefault();
        // The grid runs diagonally: right/left move along one axis, down/up along the other.
        const step: Record<string, [number, number]> = { arrowright: [1, 0], arrowleft: [-1, 0], arrowdown: [0, 1], arrowup: [0, -1] };
        const [dx, dy] = step[key] ?? [0, 0];
        moveNodes(selection.nodes, dx, dy);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  /* ----- derived ----- */
  const byId = new Map(design.nodes.map((n) => [n.id, n]));
  const selNodes = selection.nodes.map((id) => byId.get(id)).filter(Boolean) as LabNode[];
  const one = selNodes.length === 1 ? selNodes[0] : null;
  const history = run?.history ?? [];
  const appCount = design.nodes.filter((n) => n.kind === "app").reduce((a, n) => a + (run?.counts[n.id] ?? n.count), 0);
  const costLabel = dayMode && run ? `${money(run.totals.cost)} so far` : `${money(live.costPerMonth)}/mo`;

  useEffect(() => {
    if (selection.nodes.length || selection.edge) setPanel("inspect");
  }, [selection]);

  /* ---------------- render ---------------- */
  return (
    <div className="studio" ref={rootRef}>
      {/* ===== top bar ===== */}
      <div className="studio-bar">
        <div className="studio-bar-left">
          <button className="studio-picker btn" onClick={() => setPicker((x) => !x)} aria-expanded={picker}>
            <span className="studio-picker-k">{ch ? `Challenge ${mode.kind === "challenge" ? mode.index + 1 : ""} of ${CHALLENGES.length}` : "Free play"}</span>
            <b>{ch ? ch.title : "Your own design"}</b>
            {ch && <Stars n={store.stars[ch.id] ?? 0} />}
            <span aria-hidden="true">▾</span>
          </button>
          {picker && (
            <div className="studio-menu studio-picker-menu" role="menu">
              {CHALLENGES.map((c, i) => (
                <button key={c.id} role="menuitem" className={mode.kind === "challenge" && mode.index === i ? "is-on" : ""} onClick={() => (setPicker(false), loadMode({ kind: "challenge", index: i }))}>
                  <span className="pm-n">{i + 1}</span>
                  <span className="pm-t">
                    <b>{c.title}</b>
                    <small>{c.mode === "day" ? "Run a 24-hour day" : `${c.workload.rps.toLocaleString()} req/s`}</small>
                  </span>
                  <Stars n={store.stars[c.id] ?? 0} />
                </button>
              ))}
              <button role="menuitem" className={mode.kind === "free" ? "is-on" : ""} onClick={() => (setPicker(false), loadMode({ kind: "free" }))}>
                <span className="pm-n">∞</span>
                <span className="pm-t">
                  <b>Free play</b>
                  <small>Your own traffic and design</small>
                </span>
              </button>
            </div>
          )}
        </div>

        {dayMode && (
          <div className="studio-run">
            <button className={`btn btn-sm ${playing ? "" : "btn-primary"}`} onClick={startOrPause}>
              {playing ? "❚❚ Pause" : run && run.hour < 24 ? "▶ Resume" : run ? "↻ Run again" : "▶ Run the day"}
            </button>
            <div className="studio-clock" aria-label="Simulated time">
              <span>{clock(run?.hour ?? 0)}</span>
              <div className="studio-clockbar">
                <i style={{ width: `${((run?.hour ?? 0) / 24) * 100}%` }} />
                {events.map((e) => (
                  <b key={e.label} style={{ left: `${(e.at / 24) * 100}%` }} title={e.label} />
                ))}
              </div>
            </div>
            <div className="seg" role="group" aria-label="Speed">
              {[1, 2, 4].map((s) => (
                <button key={s} className="btn btn-sm" aria-pressed={speed === s} onClick={() => setSpeed(s)}>
                  {s}×
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="studio-tools">
          {anyFailed && (
            <button className="btn btn-sm btn-primary" onClick={recoverAll}>
              Recover all
            </button>
          )}
          <button className="btn btn-sm studio-break" onClick={breakSomething} title="Crash a random part of your design">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M13 2 4 14h7l-1 8 9-12h-7z" />
            </svg>
            <span>Break something</span>
          </button>
          <IconBtn label="Undo (Ctrl+Z)" onClick={undo} disabled={!past.current.length} d="M9 14 4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3" />
          <IconBtn label="Redo (Ctrl+Shift+Z)" onClick={redo} disabled={!future.current.length} d="m15 14 5-5-5-5M20 9H10a6 6 0 0 0 0 12h3" />
          <IconBtn label="Tidy up the layout" onClick={tidy} d="M4 6h16M4 12h10M4 18h6" />
          <IconBtn label="Fit everything in view (F)" onClick={() => fit()} d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
          <IconBtn label="Download the canvas as an image" onClick={downloadImage} d="M12 3v12m0 0-4-4m4 4 4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
          <IconBtn label="Copy a share link" onClick={share} d="M10 14a4 4 0 0 0 5.6 0l3-3a4 4 0 0 0-5.6-5.6l-1 1M14 10a4 4 0 0 0-5.6 0l-3 3a4 4 0 0 0 5.6 5.6l1-1" />
          <IconBtn label="Keyboard shortcuts and tips (?)" onClick={() => setHelp(true)} d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z" />
          <IconBtn label="Full screen" onClick={fullscreen} d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
        </div>
      </div>

      {/* ===== workspace ===== */}
      <div className="studio-body">
        <div className="studio-canvas">
          <Board
            design={design}
            sim={live}
            counts={run?.counts}
            selection={selection}
            view={view}
            onView={setView}
            onSelect={(s) => (setSelection(s), setMenu(null))}
            onMove={moveNodes}
            onConnect={connect}
            onQuickAdd={(from, gx, gy, cx, cy) => setMenu({ x: cx, y: cy, quick: { from, gx, gy } })}
            onDropKind={(kind, gx, gy) => addNode(kind, { gx, gy })}
            onContext={(t, x, y) => setMenu({ x, y, ...t })}
            onCanvasMenu={(gx, gy, wx, wy, x, y) => setMenu({ x, y, canvas: { gx, gy, wx, wy } })}
            onMoveNote={(id, x, y) => commit((d) => ({ ...d, notes: (d.notes ?? []).map((n) => (n.id === id ? { ...n, x, y } : n)) }))}
            onEditNote={(id) => setEditing({ id, text: design.notes?.find((n) => n.id === id)?.text ?? "" })}
            onSize={(w, h) => (boardSize.current = { w, h })}
          />

          {/* palette */}
          <aside className={`studio-palette${paletteOpen ? "" : " is-closed"}`} aria-label="Building blocks">
            <button className="studio-palette-toggle" onClick={() => setPaletteOpen((x) => !x)} aria-expanded={paletteOpen}>
              {paletteOpen ? "‹ Blocks" : "Blocks ›"}
            </button>
            {paletteOpen && (
              <div className="studio-palette-list">
                {PALETTE.map((k) => {
                  const sp = spec(k, "s");
                  return (
                    <button
                      key={k}
                      className="studio-part"
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/x-lab-kind", k);
                        e.dataTransfer.effectAllowed = "copy";
                      }}
                      onClick={() => addNode(k)}
                      title={`${KINDS[k].description} Drag onto the canvas, or click to add.`}
                    >
                      <svg viewBox="-62 -78 124 100" aria-hidden="true">
                        <SceneDefs />
                        <NodeArt kind={k} x={0} y={0} />
                      </svg>
                      <span>
                        <b>{KINDS[k].label}</b>
                        <small>{k === "users" ? "traffic source" : `${sp.capacity.toLocaleString()} req/s, $${sp.cost}/mo`}</small>
                      </span>
                    </button>
                  );
                })}
                <button className="studio-part studio-part-note" onClick={() => addNote(viewCenterWorld().x, viewCenterWorld().y)} title="Add a sticky note (N)">
                  <svg viewBox="-30 -26 60 52" aria-hidden="true">
                    <rect x={-20} y={-15} width={40} height={30} rx={4} fill="#1d1b18" transform="translate(2 3)" />
                    <rect x={-20} y={-15} width={40} height={30} rx={4} fill="#fff4d8" stroke="#1d1b18" strokeWidth={1.6} />
                    <path d="M-12,-5 H10 M-12,3 H4" stroke="#a59c90" strokeWidth={2} strokeLinecap="round" />
                  </svg>
                  <span>
                    <b>Note</b>
                    <small>write on the canvas</small>
                  </span>
                </button>
                <p className="studio-tip">Drag a block onto the canvas. Drag from a block's ＋ handle to connect it. Right-click empty space for more.</p>
              </div>
            )}
          </aside>

          {/* zoom controls + minimap */}
          <div className="studio-zoom">
            <button className="btn btn-sm" onClick={() => zoomBy(1 / 1.2)} aria-label="Zoom out">−</button>
            <button className="btn btn-sm studio-zoom-k" onClick={() => setView((v) => ({ ...v, k: 1 }))} title="Reset zoom to 100%">
              {Math.round(view.k * 100)}%
            </button>
            <button className="btn btn-sm" onClick={() => zoomBy(1.2)} aria-label="Zoom in">+</button>
          </div>
          <Minimap design={design} view={view} size={boardSize.current} onView={setView} sim={live} />

          {/* metrics HUD */}
          <div className="studio-hud" aria-live="polite">
            <Metric label="Traffic" value={`${Math.round(live.offered).toLocaleString()} req/s`} spark={history.map((s) => s.rps)} color="#5d82b5" />
            <Metric label="Failing" value={`${(live.errorRate * 100).toFixed(live.errorRate > 0 && live.errorRate < 0.01 ? 2 : 1)}%`} spark={history.map((s) => s.errorRate)} color="#d9577a" bad={live.errorRate > 0.01} max={0.25} />
            <Metric label="Avg response" value={live.succeeded > 0 ? ms(live.avgLatencyMs) : "n/a"} spark={history.map((s) => Math.min(2000, s.latencyMs))} color="#1d1b18" bad={live.avgLatencyMs > 400} />
            <Metric label="App servers" value={String(appCount)} spark={history.map((s) => s.appInstances)} color="#7fc278" />
            <Metric label={dayMode && run ? "Cost today" : "Cost"} value={costLabel} spark={history.map((s) => s.costPerHour)} color="#f2b27c" />
            {!run && dayMode && <span className="studio-hud-note">Showing the busiest hour. Press Run the day to test all 24 hours.</span>}
          </div>

          {toast && <div className={`studio-toast is-${toast.tone}`} role="status">{toast.text}</div>}

          {editing && (() => {
            const nt = design.notes?.find((n) => n.id === editing.id);
            if (!nt) return null;
            const { w } = noteSize(nt.text || "New note text here");
            return (
              <div className="note-editor" style={{ left: nt.x * view.k + view.x, top: nt.y * view.k + view.y }}>
                <textarea
                  id="note-editor"
                  autoFocus
                  value={editing.text}
                  placeholder="Write a note…"
                  style={{ width: Math.max(220, w * view.k) }}
                  onChange={(e) => setEditing({ ...editing, text: e.target.value })}
                  onBlur={saveNote}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") (e.preventDefault(), saveNote());
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) (e.preventDefault(), saveNote());
                  }}
                />
                <small>Ctrl+Enter or click outside to save</small>
              </div>
            );
          })()}

          {menu && (
            <ContextMenu
              menu={menu}
              design={design}
              onClose={() => setMenu(null)}
              actions={{
                addNote,
                editNote: (id) => setEditing({ id, text: design.notes?.find((n) => n.id === id)?.text ?? "" }),
                removeNote: (id) => commit((d) => ({ ...d, notes: (d.notes ?? []).filter((n) => n.id !== id) })),
                add: (kind, at, from) => addNode(kind, at, from),
                duplicate,
                remove: removeSelection,
                patch: patchNode,
                removeEdge: (id) => commit((d) => ({ ...d, edges: d.edges.filter((e) => e.id !== id) })),
              }}
            />
          )}
        </div>

        {/* ===== side panel ===== */}
        <aside className="studio-side">
          <div className="studio-tabs" role="tablist">
            {(["goals", "inspect", "workload", "log"] as const).map((t) => (
              <button key={t} role="tab" aria-selected={panel === t} className={panel === t ? "is-on" : ""} onClick={() => setPanel(t)}>
                {t === "goals" ? (ch ? "Goals" : "Tips") : t === "inspect" ? "Inspect" : t === "workload" ? "Traffic" : "Timeline"}
              </button>
            ))}
          </div>
          <div className="studio-panel">
            {panel === "goals" && (
              <GoalsPanel
                ch={ch}
                ctx={ctx}
                stars={stars}
                best={ch ? store.stars[ch.id] ?? 0 : 0}
                ranDay={!!daySummary}
                celebrate={celebrate}
                problems={live.problems}
                onFocus={(id) => (setSelection({ nodes: [id], edge: null }))}
                onReset={resetChallenge}
                onNext={() => mode.kind === "challenge" && mode.index < CHALLENGES.length - 1 && loadMode({ kind: "challenge", index: mode.index + 1 })}
                onTemplate={(d) => {
                  commit(clone(d));
                  window.setTimeout(() => fit(d), 30);
                }}
                hasNext={mode.kind === "challenge" && mode.index < CHALLENGES.length - 1}
                run={run}
              />
            )}
            {panel === "inspect" && (
              <InspectPanel
                one={one}
                many={selNodes}
                edgeId={selection.edge}
                design={design}
                sim={live}
                counts={run?.counts}
                onPatch={patchNode}
                onRemove={removeSelection}
                onDuplicate={duplicate}
              />
            )}
            {panel === "workload" && (
              <WorkloadPanel
                ch={ch}
                wl={workload}
                profileId={profileId}
                onWl={(w) => (setFreeWl(w), setRun(null), setPlaying(false))}
                onProfile={(p) => (setFreeProfile(p), setRun(null), setPlaying(false))}
                preview={preview}
              />
            )}
            {panel === "log" && <LogPanel run={run} events={events} dayMode={dayMode} />}
          </div>
        </aside>
      </div>

      {confetti > 0 && celebrate && (
        <div className="confetti" key={confetti} aria-hidden="true">
          {Array.from({ length: 36 }).map((_, i) => {
            const a = (i / 36) * Math.PI * 2;
            const r = 180 + (i % 5) * 60;
            const colors = ["#cfe3b2", "#e7ddf5", "#fcdcbd", "#fee7b8", "#d6e5f6", "#f6dbe4"];
            return (
              <i
                key={i}
                style={{
                  background: colors[i % colors.length],
                  ["--dx" as string]: `${Math.cos(a) * r}px`,
                  ["--dy" as string]: `${Math.sin(a) * r - 80}px`,
                  ["--r" as string]: `${(i % 7) * 60}deg`,
                  animationDelay: `${(i % 6) * 0.03}s`,
                }}
              />
            );
          })}
        </div>
      )}

      {report && run && (
        <div className="studio-modal" role="dialog" aria-modal="true" aria-label="End of day report" onClick={() => setReport(false)}>
          <div className="studio-report card-pop" onClick={(e) => e.stopPropagation()}>
            {(() => {
              const sum = summarise(run);
              const crashed = run.log.filter((l) => l.tone === "bad").length;
              return (
                <>
                  <span className="eyebrow">End of the day</span>
                  <h2>{ch ? (stars > 0 ? "Challenge complete!" : "Not quite yet") : "Your day in numbers"}</h2>
                  {ch && <Stars n={stars} />}
                  <div className="report-grid">
                    <div className={sum.errorRate > 0.01 ? "is-bad" : "is-good"}>
                      <small>Requests failed</small>
                      <b>{(sum.errorRate * 100).toFixed(2)}%</b>
                    </div>
                    <div>
                      <small>Average response</small>
                      <b>{ms(sum.avgLatencyMs)}</b>
                    </div>
                    <div className={sum.peakLatencyMs > 400 ? "is-bad" : ""}>
                      <small>Slowest hour</small>
                      <b>{ms(sum.peakLatencyMs)}</b>
                    </div>
                    <div>
                      <small>Cost of the day</small>
                      <b>{money(sum.costPerDay)}</b>
                    </div>
                    {sum.maxQueueDelayMin > 0 && (
                      <div className={sum.maxQueueDelayMin > 30 ? "is-bad" : ""}>
                        <small>Longest queue wait</small>
                        <b>{Math.round(sum.maxQueueDelayMin)} min</b>
                      </div>
                    )}
                    <div>
                      <small>Incidents</small>
                      <b>{crashed}</b>
                    </div>
                  </div>
                  <DayChart history={run.history} events={events} hour={24} />
                  {ch && stars === 0 && <p className="panel-text">Check the Goals tab to see which goal failed, and the Timeline tab to see when.</p>}
                  <div className="btn-row">
                    {ch && stars > 0 && mode.kind === "challenge" && mode.index < CHALLENGES.length - 1 && (
                      <button className="btn btn-primary" onClick={() => (setReport(false), loadMode({ kind: "challenge", index: mode.index + 1 }))}>
                        Next challenge →
                      </button>
                    )}
                    <button className="btn" onClick={() => (setReport(false), setPanel("log"))}>
                      See the timeline
                    </button>
                    <button className="btn" onClick={() => setReport(false)}>
                      Keep building
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {help && (
        <div className="studio-modal" role="dialog" aria-modal="true" aria-label="How to use the Design Studio" onClick={() => setHelp(false)}>
          <div className="studio-help card-pop" onClick={(e) => e.stopPropagation()}>
            <h2>Design Studio</h2>
            <p>Build a system from blocks, send it traffic and watch what happens. Every number updates as you edit.</p>
            <div className="help-grid">
              <div>
                <h3>Build</h3>
                <ul>
                  <li><b>Add</b>: drag a block from the left, or click it</li>
                  <li><b>Connect</b>: drag from a block's ＋ handle onto another block, or onto empty space to create one</li>
                  <li><b>Group</b>: select a block and press + for more instances</li>
                  <li><b>Menu</b>: right-click a block, an arrow or empty space</li>
                  <li><b>Notes</b>: press <kbd>N</kbd>, double-click a note to edit it</li>
                </ul>
              </div>
              <div>
                <h3>Move around</h3>
                <ul>
                  <li><b>Pan</b>: drag the background, or scroll with two fingers</li>
                  <li><b>Zoom</b>: mouse wheel, pinch, or <kbd>+</kbd> <kbd>−</kbd></li>
                  <li><b>Fit view</b>: <kbd>F</kbd></li>
                  <li><b>Select many</b>: <kbd>Shift</kbd> + drag a box</li>
                </ul>
              </div>
              <div>
                <h3>Shortcuts</h3>
                <ul>
                  <li><kbd>Ctrl</kbd> <kbd>Z</kbd> undo, <kbd>Ctrl</kbd> <kbd>Shift</kbd> <kbd>Z</kbd> redo</li>
                  <li><kbd>Ctrl</kbd> <kbd>C</kbd> / <kbd>V</kbd> copy and paste, <kbd>Ctrl</kbd> <kbd>D</kbd> duplicate</li>
                  <li><kbd>Delete</kbd> remove, <kbd>Esc</kbd> deselect</li>
                  <li><kbd>Space</kbd> run or pause the day</li>
                </ul>
              </div>
            </div>
            <button
              className="btn btn-primary"
              onClick={() => {
                setHelp(false);
                const s = readStore();
                s.seenHelp = true;
                writeStore(s);
              }}
            >
              Start building
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- small parts ---------------- */
function Stars({ n }: { n: number }) {
  return (
    <span className="stars" aria-label={`${n} of 3 stars`}>
      {[1, 2, 3].map((i) => (
        <span key={i} className={i <= n ? "on" : ""}>★</span>
      ))}
    </span>
  );
}

function IconBtn({ label, onClick, d, disabled }: { label: string; onClick: () => void; d: string; disabled?: boolean }) {
  return (
    <button className="btn btn-sm studio-icon" onClick={onClick} disabled={disabled} aria-label={label} title={label}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d={d} />
      </svg>
    </button>
  );
}

function Metric({ label, value, spark, color, bad, max }: { label: string; value: string; spark: number[]; color: string; bad?: boolean; max?: number }) {
  return (
    <div className={`metric-tile${bad ? " is-bad" : ""}`}>
      <small>{label}</small>
      <b>{value}</b>
      {spark.length > 1 && <Sparkline values={spark.slice(-160)} color={color} max={max} />}
    </div>
  );
}

function Minimap({ design, view, size, onView, sim }: { design: Design; view: View; size: { w: number; h: number }; onView: (v: View) => void; sim: ReturnType<typeof simulate> }) {
  const W = 168, H = 108;
  if (!design.nodes.length) return null;
  const pts = design.nodes.map((n) => ({ n, ...gridToWorld(n.gx, n.gy) }));
  const vx1 = -view.x / view.k, vy1 = -view.y / view.k, vx2 = vx1 + size.w / view.k, vy2 = vy1 + size.h / view.k;
  const x1 = Math.min(vx1, ...pts.map((p) => p.x)) - CELL, x2 = Math.max(vx2, ...pts.map((p) => p.x)) + CELL;
  const y1 = Math.min(vy1, ...pts.map((p) => p.y)) - CELL, y2 = Math.max(vy2, ...pts.map((p) => p.y)) + CELL;
  const s = Math.min(W / (x2 - x1), H / (y2 - y1));
  const ox = (W - (x2 - x1) * s) / 2, oy = (H - (y2 - y1) * s) / 2;
  const mx = (x: number) => ox + (x - x1) * s, my = (y: number) => oy + (y - y1) * s;
  const jump = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const wx = x1 + (e.clientX - r.left - ox) / s, wy = y1 + (e.clientY - r.top - oy) / s;
    onView({ ...view, x: size.w / 2 - wx * view.k, y: size.h / 2 - wy * view.k });
  };
  return (
    <svg className="studio-minimap" width={W} height={H} onPointerDown={(e) => (e.currentTarget.setPointerCapture(e.pointerId), jump(e))} onPointerMove={(e) => e.buttons && jump(e)} role="img" aria-label="Minimap. Click to move the view.">
      {design.edges.map((e) => {
        const a = pts.find((p) => p.n.id === e.from), b = pts.find((p) => p.n.id === e.to);
        return a && b ? <line key={e.id} x1={mx(a.x)} y1={my(a.y)} x2={mx(b.x)} y2={my(b.y)} stroke="#a59c90" strokeWidth={1} /> : null;
      })}
      {pts.map((p) => {
        const u = sim.nodes[p.n.id]?.utilisation ?? 0;
        return <circle key={p.n.id} cx={mx(p.x)} cy={my(p.y)} r={4} fill={sim.nodes[p.n.id]?.down || u > 1 ? "#d9577a" : KINDS[p.n.kind].dot} stroke="#1d1b18" strokeWidth={1} />;
      })}
      <rect x={mx(vx1)} y={my(vy1)} width={(vx2 - vx1) * s} height={(vy2 - vy1) * s} fill="#7c63d0" fillOpacity={0.08} stroke="#5a43a6" strokeWidth={1.5} rx={3} />
    </svg>
  );
}

type MenuState = {
  x: number;
  y: number;
  node?: string;
  edge?: string;
  note?: string;
  quick?: { from: string | null; gx: number; gy: number };
  canvas?: { gx: number; gy: number; wx: number; wy: number };
};

function ContextMenu({
  menu,
  design,
  onClose,
  actions,
}: {
  menu: MenuState;
  design: Design;
  onClose: () => void;
  actions: {
    addNote: (wx: number, wy: number) => void;
    editNote: (id: string) => void;
    removeNote: (id: string) => void;
    add: (kind: NodeKind, at: { gx: number; gy: number }, from: string | null) => void;
    duplicate: () => void;
    remove: () => void;
    patch: (id: string, p: Partial<LabNode>) => void;
    removeEdge: (id: string) => void;
  };
}) {
  useEffect(() => {
    const close = () => onClose();
    window.addEventListener("pointerdown", close);
    return () => window.removeEventListener("pointerdown", close);
  }, [onClose]);
  const n = menu.node ? design.nodes.find((x) => x.id === menu.node) : undefined;
  const from = menu.quick?.from ? design.nodes.find((x) => x.id === menu.quick!.from) : undefined;
  const kinds = menu.quick ? (from ? ALLOWED[from.kind] : PALETTE) : [];
  const item = (label: string, fn: () => void, danger = false) => (
    <button
      role="menuitem"
      className={danger ? "is-danger" : ""}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={() => {
        fn();
        onClose();
      }}
    >
      {label}
    </button>
  );
  const style = { left: Math.min(menu.x, (typeof window !== "undefined" ? window.innerWidth : 1200) - 240), top: Math.min(menu.y, (typeof window !== "undefined" ? window.innerHeight : 800) - 320) };
  return (
    <div className="studio-menu studio-context" style={style} role="menu" onPointerDown={(e) => e.stopPropagation()}>
      {menu.quick && (
        <>
          <p className="menu-title">{from ? `Add and connect from ${KINDS[from.kind].label}` : "Add a block"}</p>
          {kinds.length === 0 && <p className="menu-note">{from ? `${KINDS[from.kind].label} doesn't send traffic onward.` : ""}</p>}
          {kinds.map((k) => item(KINDS[k].label, () => actions.add(k, { gx: menu.quick!.gx, gy: menu.quick!.gy }, menu.quick!.from)))}
        </>
      )}
      {n && (
        <>
          <p className="menu-title">{KINDS[n.kind].label}</p>
          {KINDS[n.kind].scalable && item(`Add an instance (${n.count + 1})`, () => actions.patch(n.id, { count: Math.min(KINDS[n.kind].maxCount, n.count + 1) }))}
          {KINDS[n.kind].scalable && n.count > 1 && item(`Remove an instance (${n.count - 1})`, () => actions.patch(n.id, { count: n.count - 1, failed: Math.min(n.failed, n.count - 1) }))}
          {n.kind !== "users" && n.failed < n.count && item(n.count > 1 ? "Crash one instance" : "Crash it", () => actions.patch(n.id, { failed: n.failed + 1 }), true)}
          {n.failed > 0 && item("Recover", () => actions.patch(n.id, { failed: 0 }))}
          {n.kind !== "users" && item("Duplicate", actions.duplicate)}
          {item("Delete", actions.remove, true)}
        </>
      )}
      {menu.edge && item("Delete connection", () => actions.removeEdge(menu.edge!), true)}
      {menu.note && (
        <>
          <p className="menu-title">Note</p>
          {item("Edit note", () => actions.editNote(menu.note!))}
          {item("Delete note", () => actions.removeNote(menu.note!), true)}
        </>
      )}
      {menu.canvas && (
        <>
          <p className="menu-title">Add here</p>
          {item("A note", () => actions.addNote(menu.canvas!.wx, menu.canvas!.wy))}
          {PALETTE.filter((k) => k !== "users" || !design.nodes.some((n) => n.kind === "users")).map((k) =>
            item(KINDS[k].label, () => actions.add(k, { gx: menu.canvas!.gx, gy: menu.canvas!.gy }, null)),
          )}
        </>
      )}
    </div>
  );
}

function GoalsPanel(props: {
  ch: Challenge | null;
  ctx: GoalCtx;
  stars: number;
  best: number;
  ranDay: boolean;
  celebrate: number | null;
  problems: ReturnType<typeof simulate>["problems"];
  onFocus: (id: string) => void;
  onReset: () => void;
  onNext: () => void;
  hasNext: boolean;
  run: RunState | null;
  onTemplate: (d: Design) => void;
}) {
  const { ch, ctx, stars, problems } = props;
  const cost = ch ? costOf(ch, ctx) : undefined;
  return (
    <div className="panel-stack">
      {ch ? (
        <>
          <section>
            <h2>{ch.title}</h2>
            <p className="panel-text">{ch.story}</p>
          </section>
          {stars > 0 && (
            <section className={`goal-done${props.celebrate ? " is-new" : ""}`}>
              <Stars n={stars} />
              <b>{stars === 3 ? "Perfect! Three stars." : "Challenge complete!"}</b>
              <p className="panel-text">
                {stars < 3
                  ? `For ${stars + 1} stars, get the cost down to ${ch.mode === "day" ? `$${ch.stars[stars - 1]} a day` : `$${ch.stars[stars - 1].toLocaleString()} a month`}.`
                  : "As cheap as it gets without breaking anything."}
              </p>
              {props.hasNext && (
                <button className="btn btn-primary btn-sm" onClick={props.onNext}>
                  Next challenge →
                </button>
              )}
            </section>
          )}
          <section>
            <h3>Goals</h3>
            <ul className="goal-list">
              {ch.goals.map((g) => {
                const waiting = g.needsDay && !props.ranDay;
                const ok = !waiting && g.check(ctx);
                return (
                  <li key={g.text} className={waiting ? "is-wait" : ok ? "is-ok" : "is-no"}>
                    <span aria-hidden="true">{waiting ? "?" : ok ? "✓" : "✗"}</span>
                    {g.text}
                  </li>
                );
              })}
            </ul>
            {ch.mode === "day" && !props.ranDay && (
              <p className="panel-note">{props.run ? `Running… ${clock(props.run.hour)}` : "Press ▶ Run the day to check the day's goals."}</p>
            )}
            <p className="panel-note">
              Stars: ★ for passing, ★★ under {ch.mode === "day" ? `$${ch.stars[0]}/day` : `$${ch.stars[0].toLocaleString()}/mo`}, ★★★ under{" "}
              {ch.mode === "day" ? `$${ch.stars[1]}/day` : `$${ch.stars[1].toLocaleString()}/mo`}.
              {cost !== undefined && ` Now: ${ch.mode === "day" ? `$${cost.toFixed(2)}/day` : `$${Math.round(cost).toLocaleString()}/mo`}.`}
            </p>
          </section>
        </>
      ) : (
        <section>
          <h2>Free play</h2>
          <p className="panel-text">Set any traffic in the Traffic tab, then build and break your own design. Pick a traffic pattern other than Steady to run a full day.</p>
          <h3>Start from a template</h3>
          <div className="templates">
            {TEMPLATES.map((t) => (
              <button key={t.id} className="template" onClick={() => props.onTemplate(t.design)}>
                <b>{t.title}</b>
                <small>{t.text}</small>
              </button>
            ))}
          </div>
        </section>
      )}

      {problems.length > 0 && (
        <section className="problems">
          <h3>What's going on</h3>
          <ul>
            {problems.slice(0, 4).map((p) => (
              <li key={p.text} className={`is-${p.severity}`}>
                <button className="problem-text" onClick={() => p.nodeId && props.onFocus(p.nodeId)} disabled={!p.nodeId}>
                  {p.text}
                </button>
                {p.learn && (
                  <Link className="learn-link" href={`/lessons/${LEARN[p.learn].slug}`} target="_blank">
                    Learn: {LEARN[p.learn].title} ↗
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {ch && (
        <section>
          <details className="hint">
            <summary>Need a hint?</summary>
            <p className="panel-text">{ch.hint}</p>
          </details>
          <div className="teaches">
            {ch.teaches.map((t) => (
              <Link key={t} href={`/lessons/${LEARN[t].slug}`} target="_blank" className="tag">
                {LEARN[t].title} ↗
              </Link>
            ))}
          </div>
          <button className="btn btn-sm" onClick={props.onReset}>
            Start this challenge again
          </button>
        </section>
      )}
    </div>
  );
}

function Stepper({ value, min, max, onChange, label }: { value: number; min: number; max: number; onChange: (n: number) => void; label: string }) {
  return (
    <div className="stepper-input" role="group" aria-label={label}>
      <button className="btn btn-sm" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} aria-label={`Fewer ${label}`}>
        −
      </button>
      <input
        id={`stepper-${label.replace(/\s+/g, "-")}`}
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) => {
          const v = Math.round(Number(e.target.value));
          if (Number.isFinite(v)) onChange(Math.max(min, Math.min(max, v)));
        }}
      />
      <button className="btn btn-sm" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} aria-label={`More ${label}`}>
        +
      </button>
    </div>
  );
}

function InspectPanel(props: {
  one: LabNode | null;
  many: LabNode[];
  edgeId: string | null;
  design: Design;
  sim: ReturnType<typeof simulate>;
  counts?: Record<string, number>;
  onPatch: (id: string, p: Partial<LabNode>) => void;
  onRemove: () => void;
  onDuplicate: () => void;
}) {
  const { one: n, sim } = props;
  if (props.edgeId) {
    const e = props.design.edges.find((x) => x.id === props.edgeId);
    const a = e && props.design.nodes.find((x) => x.id === e.from);
    const b = e && props.design.nodes.find((x) => x.id === e.to);
    return (
      <div className="panel-stack">
        <section>
          <h2>Connection</h2>
          {a && b && <p className="panel-text">{KINDS[a.kind].label} sends traffic to {KINDS[b.kind].label}.</p>}
          <p className="big-number">{Math.round(sim.edges[props.edgeId] ?? 0).toLocaleString()} <small>req/s</small></p>
          <button className="btn btn-sm" onClick={props.onRemove}>Delete connection</button>
        </section>
      </div>
    );
  }
  if (!n) {
    if (props.many.length > 1)
      return (
        <div className="panel-stack">
          <section>
            <h2>{props.many.length} blocks selected</h2>
            <p className="panel-text">Drag any of them to move them together, or use the arrow keys.</p>
            <div className="btn-row">
              <button className="btn btn-sm" onClick={props.onDuplicate}>Duplicate</button>
              <button className="btn btn-sm" onClick={props.onRemove}>Delete</button>
            </div>
          </section>
        </div>
      );
    return (
      <div className="panel-stack">
        <section>
          <h2>Inspect</h2>
          <p className="panel-text">Click a block to see how busy it is and change its size, instances or autoscaling. Click an arrow to see the traffic on it.</p>
        </section>
      </div>
    );
  }
  const info = KINDS[n.kind];
  const st = sim.nodes[n.id];
  const sizes = sizesOf(n.kind);
  const sp = spec(n.kind, n.size);
  const running = props.counts?.[n.id] ?? n.count;
  return (
    <div className="panel-stack">
      <section>
        <h2>{info.label}</h2>
        <p className="panel-text">{info.description}</p>
      </section>
      {n.kind !== "users" && (
        <section>
          {info.scalable && (
            <div className="field">
              <label htmlFor={`stepper-instances`}>Instances</label>
              <Stepper label="instances" value={n.count} min={1} max={info.maxCount} onChange={(c) => props.onPatch(n.id, { count: c, failed: Math.min(n.failed, c) })} />
            </div>
          )}
          {sizes.length > 1 && (
            <div className="field">
              <span className="field-label">Size</span>
              <div className="seg">
                {sizes.map((s) => (
                  <button key={s} className="btn btn-sm" aria-pressed={n.size === s} onClick={() => props.onPatch(n.id, { size: s })}>
                    {SIZE_LABEL[s]}
                  </button>
                ))}
              </div>
              <small className="field-help">
                {SIZE_LABEL[n.size]}: {sp.capacity.toLocaleString()} req/s for ${sp.cost}/mo each
              </small>
            </div>
          )}
          {n.kind === "app" && (
            <div className="field">
              <label className="toggle">
                <input
                  type="checkbox"
                  id="autoscale"
                  checked={!!n.autoscale?.on}
                  onChange={(e) => props.onPatch(n.id, { autoscale: { on: e.target.checked, min: n.autoscale?.min ?? Math.max(1, Math.min(n.count, 2)), max: n.autoscale?.max ?? Math.max(10, n.count * 3) } })}
                />
                <span>Autoscaling</span>
              </label>
              {n.autoscale?.on && (
                <div className="autoscale-row">
                  <div>
                    <small>At least</small>
                    <Stepper label="minimum" value={n.autoscale.min} min={1} max={n.autoscale.max} onChange={(v) => props.onPatch(n.id, { autoscale: { ...n.autoscale!, min: v } })} />
                  </div>
                  <div>
                    <small>At most</small>
                    <Stepper label="maximum" value={n.autoscale.max} min={n.autoscale.min} max={info.maxCount} onChange={(v) => props.onPatch(n.id, { autoscale: { ...n.autoscale!, max: v } })} />
                  </div>
                </div>
              )}
              <small className="field-help">During a day run, adds servers when they're over 72% busy (they take 5 minutes to boot) and removes them when quiet.</small>
            </div>
          )}
        </section>
      )}
      {n.kind !== "users" && st && (
        <section>
          <h3>Right now</h3>
          <dl className="stat-list">
            <div><dt>Arriving</dt><dd>{Math.round(st.load).toLocaleString()} req/s</dd></div>
            <div><dt>Can handle</dt><dd>{Math.round(st.capacity).toLocaleString()} req/s</dd></div>
            <div><dt>Busy</dt><dd>{Math.round(st.utilisation * 100)}%</dd></div>
            <div><dt>Time per request</dt><dd>{st.load > 0 ? ms(st.latencyMs) : "n/a"}</dd></div>
            {info.scalable && <div><dt>Running</dt><dd>{st.instances} of {running}</dd></div>}
            {st.dropped > 0.5 && <div className="is-bad"><dt>Dropping</dt><dd>{Math.round(st.dropped).toLocaleString()} req/s</dd></div>}
            <div><dt>Cost</dt><dd>${Math.round(st.costPerMonth).toLocaleString()}/mo</dd></div>
          </dl>
          <div className="meter" aria-hidden="true">
            <i style={{ width: `${Math.min(100, st.utilisation * 100)}%` }} className={st.utilisation > 1 ? "is-bad" : st.utilisation > 0.85 ? "is-warn" : ""} />
          </div>
        </section>
      )}
      <section>
        <h3>Test a failure</h3>
        <div className="btn-row">
          {n.kind !== "users" && n.failed < n.count && (
            <button className="btn btn-sm" onClick={() => props.onPatch(n.id, { failed: n.failed + 1 })}>
              {n.count > 1 ? "Crash one instance" : "Crash it"}
            </button>
          )}
          {n.failed > 0 && <button className="btn btn-sm btn-primary" onClick={() => props.onPatch(n.id, { failed: 0 })}>Recover</button>}
        </div>
        <div className="btn-row">
          {n.kind !== "users" && <button className="btn btn-sm" onClick={props.onDuplicate}>Duplicate</button>}
          <button className="btn btn-sm" onClick={props.onRemove}>Delete</button>
        </div>
        {ALLOWED[n.kind].length > 0 && <p className="panel-note">To connect, drag from the ＋ handle beside the block.</p>}
      </section>
    </div>
  );
}

function Slider({ id, label, value, min, max, step, format, onChange }: { id: string; label: string; value: number; min: number; max: number; step: number; format: (v: number) => string; onChange: (v: number) => void }) {
  return (
    <div className="field">
      <label htmlFor={id} className="field-row">
        <span>{label}</span>
        <b>{format(value)}</b>
      </label>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  );
}

function WorkloadPanel({ ch, wl, profileId, onWl, onProfile, preview }: { ch: Challenge | null; wl: Workload; profileId: string; onWl: (w: Workload) => void; onProfile: (p: string) => void; preview: Workload }) {
  const reads = Math.max(0, 1 - wl.writeShare - wl.staticShare);
  if (ch)
    return (
      <div className="panel-stack">
        <section>
          <h2>Traffic in this challenge</h2>
          <dl className="stat-list">
            <div><dt>{ch.mode === "day" ? "Peak traffic" : "Traffic"}</dt><dd>{wl.rps.toLocaleString()} req/s</dd></div>
            <div><dt>Pattern</dt><dd>{PROFILES[profileId]?.label}</dd></div>
            <div><dt>Writes</dt><dd>{Math.round(wl.writeShare * 100)}%</dd></div>
            <div><dt>Static files</dt><dd>{Math.round(wl.staticShare * 100)}%</dd></div>
            <div><dt>Reads</dt><dd>{Math.round(reads * 100)}%</dd></div>
            <div><dt>Cache hit rate</dt><dd>{Math.round(wl.cacheHit * 100)}%</dd></div>
          </dl>
          <p className="panel-note">Want to change these? Try Free play.</p>
        </section>
      </div>
    );
  const logRps = Math.log10(wl.rps);
  return (
    <div className="panel-stack">
      <section>
        <h2>Traffic</h2>
        <Slider id="rps" label={profileId === "steady" ? "Requests per second" : "Peak requests per second"} value={logRps} min={1} max={4.7} step={0.01} format={() => wl.rps.toLocaleString()} onChange={(v) => onWl({ ...wl, rps: Math.round(10 ** v / 10) * 10 || 10 })} />
        <Slider id="writes" label="Writes (orders, posts…)" value={wl.writeShare} min={0} max={0.6} step={0.01} format={(v) => `${Math.round(v * 100)}%`} onChange={(v) => onWl({ ...wl, writeShare: Math.min(v, 1 - wl.staticShare) })} />
        <Slider id="static" label="Static files (images, scripts)" value={wl.staticShare} min={0} max={0.8} step={0.01} format={(v) => `${Math.round(v * 100)}%`} onChange={(v) => onWl({ ...wl, staticShare: Math.min(v, 1 - wl.writeShare) })} />
        <Slider id="hit" label="Cache hit rate" value={wl.cacheHit} min={0} max={0.99} step={0.01} format={(v) => `${Math.round(v * 100)}%`} onChange={(v) => onWl({ ...wl, cacheHit: v })} />
        <p className="panel-note">Reads make up the rest: {Math.round(reads * 100)}%.</p>
      </section>
      <section>
        <h3>Pattern over the day</h3>
        <div className="seg seg-wrap">
          {Object.values(PROFILES).map((p) => (
            <button key={p.id} className="btn btn-sm" aria-pressed={profileId === p.id} onClick={() => onProfile(p.id)}>
              {p.label}
            </button>
          ))}
        </div>
        {profileId !== "steady" && <p className="panel-note">The canvas shows the busiest hour ({preview.rps.toLocaleString()} req/s). Press ▶ Run the day to play all 24 hours.</p>}
      </section>
    </div>
  );
}

function LogPanel({ run, events, dayMode }: { run: RunState | null; events: Challenge["events"]; dayMode: boolean }) {
  if (!dayMode)
    return (
      <div className="panel-stack">
        <section>
          <h2>Timeline</h2>
          <p className="panel-text">Pick a traffic pattern in the Traffic tab (or a day challenge) to play 24 hours and see what happens hour by hour.</p>
        </section>
      </div>
    );
  return (
    <div className="panel-stack">
      <section>
        <h2>The day so far</h2>
        <DayChart history={run?.history ?? []} events={events ?? []} hour={run?.hour ?? 0} />
        <div className="chart-key">
          <span><i style={{ background: "#a7c3e7" }} /> traffic</span>
          <span><i style={{ background: "#d9577a" }} /> failures</span>
          <span><i style={{ background: "#1d1b18" }} /> response time</span>
        </div>
      </section>
      <section>
        <h3>Events</h3>
        <ol className="log">
          {(run?.log ?? []).slice().reverse().slice(0, 40).map((l, i) => (
            <li key={i} className={`is-${l.tone}`}>
              <time>{clock(l.hour)}</time> {l.text}
            </li>
          ))}
          {!run && <li className="is-info">Press ▶ Run the day to start.</li>}
        </ol>
      </section>
    </div>
  );
}
