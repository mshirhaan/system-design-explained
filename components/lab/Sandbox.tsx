"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { f } from "@/components/scene/geometry";
import { INK } from "@/components/scene/palette";
import { Box, Cylinder, Phone, Pill } from "@/components/scene/primitives";
import { SceneDefs } from "@/components/scene/SceneDefs";
import { CHALLENGES, type Challenge } from "@/lib/lab/challenges";
import { ALLOWED, SPECS, simulate, type LabEdge, type LabNode, type NodeKind } from "@/lib/lab/model";

/* ---------- grid ↔ screen ---------- */
const S = 84; // one grid cell, in world units
const GX = [0, 6] as const;
const GY = [0, 5] as const;
const toScreen = (gx: number, gy: number) => ({ x: (gx - gy) * S, y: (gx + gy) * (S / 2) - 120 });
const toGrid = (x: number, y: number) => {
  const X = x / S;
  const Y = (y + 120) / (S / 2);
  return { gx: Math.round((X + Y) / 2), gy: Math.round((Y - X) / 2) };
};
const VIEW = { x: -480, y: -215, w: 1040, h: 610 };

const ART = 1.25; // blocks are drawn a little larger on the board
const HEIGHT: Record<NodeKind, number> = { users: 70, cdn: 46, lb: 34, app: 56, cache: 40, db: 52, replica: 46 };
const PALETTE: NodeKind[] = ["users", "cdn", "lb", "app", "cache", "db", "replica"];

let uid = 0;
const newId = (p: string) => `${p}${Date.now().toString(36)}${(uid++).toString(36)}`;

function NodeArt({ kind, x, y }: { kind: NodeKind; x: number; y: number }) {
  switch (kind) {
    case "users":
      return (
        <g>
          <Box cx={x} cy={y} w={60} h={10} r={10} />
          <Phone cx={x - 10} cy={y - 10} />
        </g>
      );
    case "cdn":
      return <Box cx={x} cy={y} w={40} h={34} r={10} color="purple" icon="globe" />;
    case "lb":
      return <Box cx={x} cy={y} w={42} h={22} r={9} color="green" icon="bolt" />;
    case "app":
      return <Box cx={x} cy={y} w={38} h={48} r={10} color="blue" text={["App"]} textSize={13} />;
    case "cache":
      return <Box cx={x} cy={y} w={36} h={28} r={9} color="orange" icon="bolt" />;
    case "db":
      return <Cylinder cx={x} cy={y} rx={30} h={44} color="yellow" />;
    case "replica":
      return <Cylinder cx={x} cy={y} rx={25} h={36} color="green" />;
  }
}

type Mode = { kind: "challenge"; c: Challenge } | { kind: "free" };

export function Sandbox() {
  const [mode, setMode] = useState<Mode>({ kind: "challenge", c: CHALLENGES[1] });
  const [nodes, setNodes] = useState<LabNode[]>(CHALLENGES[1].start.nodes);
  const [edges, setEdges] = useState<LabEdge[]>(CHALLENGES[1].start.edges);
  const [freeRps, setFreeRps] = useState(800);
  const [selected, setSelected] = useState<{ type: "node" | "edge"; id: string } | null>(null);
  const [connectFrom, setConnectFrom] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef<{ id: string; moved: boolean; startX: number; startY: number } | null>(null);

  const rps = mode.kind === "challenge" ? mode.c.rps : freeRps;
  const sim = useMemo(() => simulate(nodes, edges, rps), [nodes, edges, rps]);
  const byId = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);

  const say = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast((t) => (t === msg ? null : t)), 2600);
  }, []);

  const loadChallenge = (c: Challenge) => {
    setMode({ kind: "challenge", c });
    setNodes(c.start.nodes.map((n) => ({ ...n })));
    setEdges(c.start.edges.map((e) => ({ ...e })));
    setSelected(null);
    setConnectFrom(null);
  };

  const occupied = (gx: number, gy: number, except?: string) => nodes.some((n) => n.gx === gx && n.gy === gy && n.id !== except);

  const addNode = (kind: NodeKind) => {
    // Find the free cell closest to the middle of the board.
    // Prefer free cells with no neighbours, close to the middle of the board.
    const crowd = (gx: number, gy: number) => nodes.filter((n) => Math.max(Math.abs(n.gx - gx), Math.abs(n.gy - gy)) <= 1).length;
    const cells: { gx: number; gy: number; d: number }[] = [];
    for (let gx = GX[0]; gx <= GX[1]; gx++)
      for (let gy = GY[0]; gy <= GY[1]; gy++) cells.push({ gx, gy, d: crowd(gx, gy) * 10 + Math.abs(gx - 3) + Math.abs(gy - 2.5) });
    const free = cells.filter((c) => !occupied(c.gx, c.gy)).sort((a, b) => a.d - b.d)[0];
    if (!free) return say("The board is full. Remove something first.");
    const n: LabNode = { id: newId(kind), kind, gx: free.gx, gy: free.gy };
    setNodes((ns) => [...ns, n]);
    setSelected({ type: "node", id: n.id });
  };

  /** Lay blocks out in columns, left to right in the order traffic flows. */
  const tidy = () => {
    const columns: [NodeKind[], number[]][] = [
      [["users"], [0]],
      [["cdn"], [1]],
      [["lb"], [2]],
      [["app"], [3, 4]],
      [["cache"], [5]],
      [["db", "replica"], [6]],
    ];
    const rows = GY[1] - GY[0] + 1;
    const taken = new Set<string>();
    const placed = new Map<string, { gx: number; gy: number }>();
    for (const [kinds, cols] of columns) {
      const group = nodes.filter((n) => kinds.includes(n.kind));
      // Share the group evenly between its columns, leaving gaps between rows when there's room.
      const perCol = Math.min(rows, Math.ceil(group.length / cols.length));
      let i = 0;
      for (const gx of cols) {
        const here = group.slice(i, i + perCol);
        i += here.length;
        const step = here.length > 1 ? Math.max(1, Math.floor((rows - 1) / (here.length - 1))) : 1;
        const top = GY[0] + Math.floor((rows - 1 - step * (here.length - 1)) / 2);
        here.forEach((n, k) => {
          placed.set(n.id, { gx, gy: top + k * step });
          taken.add(`${gx},${top + k * step}`);
        });
      }
      // Anything that didn't fit goes in the nearest free cell.
      for (const n of group.slice(i)) {
        for (let gx = GX[0]; gx <= GX[1] && !placed.has(n.id); gx++)
          for (let gy = GY[0]; gy <= GY[1] && !placed.has(n.id); gy++)
            if (!taken.has(`${gx},${gy}`)) {
              placed.set(n.id, { gx, gy });
              taken.add(`${gx},${gy}`);
            }
      }
    }
    setNodes((ns) => ns.map((n) => ({ ...n, ...(placed.get(n.id) ?? {}) })));
  };

  const connect = (from: string, to: string) => {
    const a = byId.get(from);
    const b = byId.get(to);
    if (!a || !b || from === to) return;
    if (!ALLOWED[a.kind].includes(b.kind)) {
      const ok = ALLOWED[a.kind].map((k) => SPECS[k].label).join(", ");
      return say(ok ? `${SPECS[a.kind].label} can send traffic to: ${ok}.` : `${SPECS[a.kind].label} doesn't send traffic onward.`);
    }
    if (edges.some((e) => e.from === from && e.to === to)) return say("Those are already connected.");
    setEdges((es) => [...es, { id: newId("e"), from, to }]);
  };

  const remove = () => {
    if (!selected) return;
    if (selected.type === "node") {
      setNodes((ns) => ns.filter((n) => n.id !== selected.id));
      setEdges((es) => es.filter((e) => e.from !== selected.id && e.to !== selected.id));
    } else setEdges((es) => es.filter((e) => e.id !== selected.id));
    setSelected(null);
    setConnectFrom(null);
  };

  /* ---------- pointer handling ---------- */
  const svgPoint = (clientX: number, clientY: number) => {
    const svg = svgRef.current!;
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    return pt.matrixTransform(svg.getScreenCTM()!.inverse());
  };

  const onNodeDown = (e: React.PointerEvent, id: string) => {
    e.stopPropagation();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    drag.current = { id, moved: false, startX: e.clientX, startY: e.clientY };
  };

  useEffect(() => {
    const move = (e: PointerEvent) => {
      const d = drag.current;
      if (!d) return;
      if (!d.moved && Math.hypot(e.clientX - d.startX, e.clientY - d.startY) < 5) return;
      d.moved = true;
      const p = svgPoint(e.clientX, e.clientY);
      const g = toGrid(p.x, p.y + 20);
      const gx = Math.max(GX[0], Math.min(GX[1], g.gx));
      const gy = Math.max(GY[0], Math.min(GY[1], g.gy));
      setNodes((ns) => (ns.some((n) => n.gx === gx && n.gy === gy && n.id !== d.id) ? ns : ns.map((n) => (n.id === d.id ? { ...n, gx, gy } : n))));
    };
    const up = () => {
      const d = drag.current;
      drag.current = null;
      if (!d || d.moved) return;
      // A click, not a drag.
      if (connectFrom && connectFrom !== d.id) {
        connect(connectFrom, d.id);
        setConnectFrom(null);
        setSelected({ type: "node", id: d.id });
      } else setSelected({ type: "node", id: d.id });
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  });

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest("input, textarea")) return;
      if ((e.key === "Delete" || e.key === "Backspace") && selected) remove();
      if (e.key === "Escape") {
        setConnectFrom(null);
        setSelected(null);
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  });

  /* ---------- drawing helpers ---------- */
  const anchor = (n: LabNode) => {
    const p = toScreen(n.gx, n.gy);
    return { x: p.x, y: p.y - (HEIGHT[n.kind] * ART) / 2 };
  };
  const sortedNodes = [...nodes].sort((a, b) => a.gx + a.gy - (b.gx + b.gy));
  const selNode = selected?.type === "node" ? byId.get(selected.id) : undefined;
  const selStats = selNode ? sim.nodes[selNode.id] : undefined;
  const goals = mode.kind === "challenge" ? mode.c.goals.map((g) => ({ text: g.text, ok: g.check(sim) })) : [];
  const allOk = goals.length > 0 && goals.every((g) => g.ok);

  const cells: React.ReactNode[] = [];
  for (let gx = GX[0]; gx <= GX[1]; gx++)
    for (let gy = GY[0]; gy <= GY[1]; gy++) {
      const p = toScreen(gx, gy);
      cells.push(
        <path
          key={`${gx},${gy}`}
          d={`M${p.x},${p.y - S / 2} L${p.x + S},${p.y} L${p.x},${p.y + S / 2} L${p.x - S},${p.y} Z`}
          fill="#fbf6ef"
          fillOpacity={0.35}
          stroke="#a8916f"
          strokeOpacity={0.28}
          strokeWidth={1}
        />,
      );
    }

  return (
    <div className="lab">
      <div className="lab-modes" role="tablist" aria-label="Mode">
        {CHALLENGES.map((c) => (
          <button key={c.id} role="tab" aria-selected={mode.kind === "challenge" && mode.c.id === c.id} className="btn btn-sm" aria-pressed={mode.kind === "challenge" && mode.c.id === c.id} onClick={() => loadChallenge(c)}>
            {c.title}
          </button>
        ))}
        <button role="tab" aria-selected={mode.kind === "free"} className="btn btn-sm" aria-pressed={mode.kind === "free"} onClick={() => { setMode({ kind: "free" }); setSelected(null); }}>
          Free play
        </button>
      </div>

      <div className="lab-grid">
        <aside className="lab-palette card" aria-label="Components">
          <h2>Add a component</h2>
          {PALETTE.map((k) => (
            <button key={k} className="lab-part" onClick={() => addNode(k)}>
              <svg viewBox="-60 -70 120 90" aria-hidden="true">
                <SceneDefs />
                <NodeArt kind={k} x={0} y={0} />
              </svg>
              <span>
                <b>{SPECS[k].label}</b>
                <small>{k === "users" ? "traffic source" : `${SPECS[k].capacity.toLocaleString()} req/s, $${SPECS[k].costPerMonth}/mo`}</small>
              </span>
            </button>
          ))}
          <p className="lab-help">Drag blocks to move them. Select a block, then press “Connect” and click another block to draw an arrow.</p>
        </aside>

        <div className="lab-board card">
          {mode.kind === "challenge" ? (
            <div className="lab-story">
              <b>{mode.c.title}</b>
              <p>{mode.c.story}</p>
            </div>
          ) : (
            <div className="lab-story">
              <b>Free play</b>
              <label className="lab-slider" htmlFor="rps">
                <span>Traffic: <b>{freeRps.toLocaleString()}</b> requests per second</span>
                <input
                  id="rps"
                  type="range"
                  min={0}
                  max={100}
                  value={Math.round((Math.log10(freeRps) - 1) * 25)}
                  onChange={(e) => setFreeRps(Math.round(10 ** (1 + Number(e.target.value) / 25) / 10) * 10)}
                />
              </label>
            </div>
          )}
          <div className="lab-toolbar">
            <button className="btn btn-sm" onClick={tidy}>Tidy up the layout</button>
            <span className="lab-count">{nodes.length} blocks, {edges.length} connections</span>
          </div>
          <div className="lab-canvas-wrap">
            <svg
              ref={svgRef}
              className={`lab-canvas${connectFrom ? " is-connecting" : ""}`}
              viewBox={`${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}`}
              onPointerDown={() => {
                setSelected(null);
                setConnectFrom(null);
              }}
              role="application"
              aria-label="System design board"
            >
              <SceneDefs />
              <g>{cells}</g>
              {/* connections */}
              {edges.map((e) => {
                const a = byId.get(e.from);
                const b = byId.get(e.to);
                if (!a || !b) return null;
                const pa = anchor(a);
                const pb = anchor(b);
                const len = Math.hypot(pb.x - pa.x, pb.y - pa.y) || 1;
                const ux = (pb.x - pa.x) / len;
                const uy = (pb.y - pa.y) / len;
                const x1 = pa.x + ux * 26, y1 = pa.y + uy * 26, x2 = pb.x - ux * 30, y2 = pb.y - uy * 30;
                const load = sim.edges[e.id] ?? 0;
                const target = sim.nodes[b.id];
                const hot = target && target.utilisation > 1;
                const isSel = selected?.type === "edge" && selected.id === e.id;
                const dots = load > 0 ? Math.max(1, Math.min(4, Math.round(Math.log10(load + 1) * 1.2))) : 0;
                const dur = 1.6;
                const d = `M${f(x1)},${f(y1)} L${f(x2)},${f(y2)}`;
                return (
                  <g key={e.id}>
                    <path
                      d={d}
                      stroke="transparent"
                      strokeWidth={16}
                      onPointerDown={(ev) => {
                        ev.stopPropagation();
                        setSelected({ type: "edge", id: e.id });
                        setConnectFrom(null);
                      }}
                      style={{ cursor: "pointer" }}
                    />
                    <path d={d} stroke={isSel ? "#5a43a6" : load > 0 ? INK : "#a59c90"} strokeWidth={isSel ? 3.4 : 2.4} strokeLinecap="round" markerEnd={load > 0 ? "url(#arrow)" : "url(#arrow-muted)"} pointerEvents="none" />
                    {Array.from({ length: dots }).map((_, i) => (
                      <circle key={i} r={5.5} fill={hot ? "#e8a9bd" : "#f6b98a"} stroke={INK} strokeWidth={1.4} pointerEvents="none">
                        <animateMotion path={d} dur={`${dur}s`} begin={`${-(i * dur) / dots}s`} repeatCount="indefinite" />
                      </circle>
                    ))}
                    {load > 0 && (isSel || (selected?.type === "node" && (selected.id === e.from || selected.id === e.to))) && (
                      <g pointerEvents="none">
                        <Pill x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 14} text={`${Math.round(load).toLocaleString()}/s`} size={10} weight={700} tone={hot ? "orange" : "plain"} />
                      </g>
                    )}
                  </g>
                );
              })}
              {/* components */}
              {sortedNodes.map((n) => {
                const p = toScreen(n.gx, n.gy);
                const st = sim.nodes[n.id];
                const u = n.kind === "users" ? 0 : st?.utilisation ?? 0;
                const over = u > 1;
                const busy = u > 0.8;
                const isSel = selected?.type === "node" && selected.id === n.id;
                const isFrom = connectFrom === n.id;
                return (
                  <g key={n.id} onPointerDown={(e) => onNodeDown(e, n.id)} style={{ cursor: connectFrom ? "crosshair" : "grab" }} className="lab-node" data-id={n.id} data-kind={n.kind}>
                    {(isSel || isFrom || over) && (
                      <ellipse cx={p.x} cy={p.y + 4} rx={62} ry={31} fill={over ? "#e8a9bd" : "#7c63d0"} fillOpacity={0.12} stroke={over ? "#c0392b" : "#7c63d0"} strokeWidth={2} strokeDasharray="6 6">
                        {over && <animate attributeName="opacity" values="0.4;1;0.4" dur="1s" repeatCount="indefinite" />}
                      </ellipse>
                    )}
                    <g transform={`translate(${p.x} ${p.y}) scale(${ART}) translate(${-p.x} ${-p.y})`}>
                      <NodeArt kind={n.kind} x={p.x} y={p.y} />
                    </g>
                    <g pointerEvents="none">
                      <Pill
                        x={p.x}
                        y={p.y + 50}
                        text={n.kind === "users" ? `${rps.toLocaleString()} req/s` : `${SPECS[n.kind].short} ${Math.min(999, Math.round(u * 100))}%`}
                        size={11}
                        weight={700}
                        tone={n.kind === "users" ? "yellow" : over ? "orange" : busy ? "yellow" : u > 0 ? "green" : "plain"}
                      />
                    </g>
                  </g>
                );
              })}
            </svg>
            {connectFrom && <div className="lab-hint">Click the block to connect to. Press Esc to cancel.</div>}
            {toast && <div className="lab-toast" role="status">{toast}</div>}
          </div>
        </div>

        <aside className="lab-side">
          <div className="card lab-metrics">
            <h2>How it's doing</h2>
            <dl>
              <div><dt>Traffic</dt><dd>{rps.toLocaleString()} req/s</dd></div>
              <div><dt>Served</dt><dd>{Math.round(sim.succeeded).toLocaleString()} req/s</dd></div>
              <div className={sim.errorRate > 0.01 ? "bad" : ""}><dt>Failing</dt><dd>{(sim.errorRate * 100).toFixed(sim.errorRate > 0 && sim.errorRate < 0.01 ? 2 : 1)}%</dd></div>
              <div><dt>Avg response</dt><dd>{sim.succeeded > 0 ? `${Math.round(sim.avgLatencyMs)} ms` : "n/a"}</dd></div>
              <div><dt>Monthly cost</dt><dd>${sim.costPerMonth.toLocaleString()}</dd></div>
            </dl>
          </div>

          {mode.kind === "challenge" && (
            <div className={`card lab-goals${allOk ? " is-done" : ""}`}>
              <h2>{allOk ? "Challenge complete!" : "Goals"}</h2>
              <ul>
                {goals.map((g) => (
                  <li key={g.text} className={g.ok ? "ok" : "no"}>
                    <span aria-hidden="true">{g.ok ? "✓" : "✗"}</span> {g.text}
                  </li>
                ))}
              </ul>
              {!allOk && (
                <details className="lab-hintbox">
                  <summary>Need a hint?</summary>
                  <p>{mode.c.hint}</p>
                </details>
              )}
              <button className="btn btn-sm" onClick={() => loadChallenge(mode.c)}>Start this challenge again</button>
            </div>
          )}

          {sim.problems.length > 0 && (
            <div className="card lab-problems">
              <h2>What's going on</h2>
              <ul>
                {sim.problems.slice(0, 3).map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="card lab-inspect">
            {selNode && selStats ? (
              <>
                <h2>{SPECS[selNode.kind].label}</h2>
                <p>{SPECS[selNode.kind].blurb}</p>
                {selNode.kind !== "users" && (
                  <dl>
                    <div><dt>Arriving</dt><dd>{Math.round(selStats.load).toLocaleString()} req/s</dd></div>
                    <div><dt>Can handle</dt><dd>{SPECS[selNode.kind].capacity.toLocaleString()} req/s</dd></div>
                    <div><dt>Busy</dt><dd>{Math.round(selStats.utilisation * 100)}%</dd></div>
                    <div><dt>Time here</dt><dd>{selStats.load > 0 ? `${Math.round(selStats.latencyMs)} ms` : "n/a"}</dd></div>
                    {selStats.dropped > 0 && <div className="bad"><dt>Dropping</dt><dd>{Math.round(selStats.dropped).toLocaleString()} req/s</dd></div>}
                  </dl>
                )}
                <div className="lab-actions">
                  {ALLOWED[selNode.kind].length > 0 && (
                    <button className="btn btn-sm btn-primary" onClick={() => setConnectFrom(selNode.id)}>Connect to…</button>
                  )}
                  <button className="btn btn-sm" onClick={remove}>Remove</button>
                </div>
              </>
            ) : selected?.type === "edge" ? (
              <>
                <h2>Connection</h2>
                <p>{Math.round(sim.edges[selected.id] ?? 0).toLocaleString()} requests per second flow along this arrow.</p>
                <div className="lab-actions">
                  <button className="btn btn-sm" onClick={remove}>Remove connection</button>
                </div>
              </>
            ) : (
              <>
                <h2>Inspect</h2>
                <p>Click a block to see how busy it is, connect it to others or remove it.</p>
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
