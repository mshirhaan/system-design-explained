"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { f } from "@/components/scene/geometry";
import { INK } from "@/components/scene/palette";
import { Pill } from "@/components/scene/primitives";
import { SceneDefs } from "@/components/scene/SceneDefs";
import { ALLOWED, KINDS, type NodeKind } from "@/lib/lab/catalog";
import type { Design, LabNode, SimResult } from "@/lib/lab/model";
import { ART_HEIGHT, CountBadge, NodeArt, SIZE_SCALE } from "./art";

export const CELL = 92;
export const gridToWorld = (gx: number, gy: number) => ({ x: (gx - gy) * CELL, y: ((gx + gy) * CELL) / 2 });
export const worldToGrid = (x: number, y: number) => {
  const X = x / CELL;
  const Y = y / (CELL / 2);
  return { gx: Math.round((X + Y) / 2), gy: Math.round((Y - X) / 2) };
};

export interface View {
  x: number;
  y: number;
  k: number;
}
export interface Selection {
  nodes: string[];
  edge: string | null;
}

export const MIN_ZOOM = 0.2;
export const MAX_ZOOM = 2.4;
const ART = 1.3; // blocks are drawn a bit larger than lesson scenes

type Gesture =
  | { type: "pan"; sx: number; sy: number; vx: number; vy: number; moved: boolean }
  | { type: "marquee"; wx: number; wy: number }
  | { type: "drag"; ids: string[]; wx: number; wy: number; moved: boolean; clicked: string; additive: boolean }
  | { type: "link"; from: string }
  | { type: "pinch"; d0: number; k0: number; cx: number; cy: number; vx: number; vy: number };

export interface BoardProps {
  design: Design;
  sim: SimResult;
  counts?: Record<string, number>;
  selection: Selection;
  view: View;
  onView: (v: View) => void;
  onSelect: (s: Selection) => void;
  onMove: (ids: string[], dgx: number, dgy: number) => void;
  onConnect: (from: string, to: string) => void;
  onQuickAdd: (from: string | null, gx: number, gy: number, clientX: number, clientY: number) => void;
  onDropKind: (kind: NodeKind, gx: number, gy: number) => void;
  onContext: (target: { node?: string; edge?: string }, clientX: number, clientY: number) => void;
  onSize?: (w: number, h: number) => void;
}

export function nodeTop(n: LabNode) {
  const p = gridToWorld(n.gx, n.gy);
  return { x: p.x, y: p.y - (ART_HEIGHT[n.kind] * SIZE_SCALE[n.size] * ART) / 2 };
}

export function Board(props: BoardProps) {
  const { design, sim, counts, selection, view, onView, onSelect } = props;
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [size, setSize] = useState({ w: 900, h: 600 });
  const gesture = useRef<Gesture | null>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const [drag, setDrag] = useState<{ ids: string[]; dgx: number; dgy: number } | null>(null);
  const [link, setLink] = useState<{ from: string; x: number; y: number; over: string | null } | null>(null);
  const [marquee, setMarquee] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const [hover, setHoverNow] = useState<string | null>(null);
  const hoverTimer = useRef<number | undefined>(undefined);
  /** Hover with a short grace period, so moving from a block onto its handle doesn't hide the handle. */
  const setHover = (id: string | null) => {
    window.clearTimeout(hoverTimer.current);
    if (id) setHoverNow(id);
    else hoverTimer.current = window.setTimeout(() => setHoverNow(null), 220);
  };
  const viewRef = useRef(view);
  viewRef.current = view;

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      setSize({ w: r.width, h: r.height });
      props.onSize?.(r.width, r.height);
    });
    ro.observe(el);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const local = useCallback((clientX: number, clientY: number) => {
    const r = svgRef.current!.getBoundingClientRect();
    return { sx: clientX - r.left, sy: clientY - r.top };
  }, []);
  const toWorld = useCallback(
    (clientX: number, clientY: number) => {
      const { sx, sy } = local(clientX, clientY);
      const v = viewRef.current;
      return { x: (sx - v.x) / v.k, y: (sy - v.y) / v.k };
    },
    [local],
  );

  const zoomAt = useCallback(
    (sx: number, sy: number, factor: number) => {
      const v = viewRef.current;
      const k = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, v.k * factor));
      onView({ k, x: sx - (sx - v.x) * (k / v.k), y: sy - (sy - v.y) * (k / v.k) });
    },
    [onView],
  );

  // Wheel: pinch or mouse wheel zooms around the cursor; two-finger trackpad scroll pans.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const { sx, sy } = local(e.clientX, e.clientY);
      const v = viewRef.current;
      const mouseWheel = e.deltaMode !== 0 || (e.deltaX === 0 && Math.abs(e.deltaY) >= 40 && Number.isInteger(e.deltaY));
      if (e.ctrlKey || e.metaKey || mouseWheel) zoomAt(sx, sy, Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0015)));
      else onView({ ...v, x: v.x - e.deltaX, y: v.y - e.deltaY });
    };
    svg.addEventListener("wheel", onWheel, { passive: false });
    return () => svg.removeEventListener("wheel", onWheel);
  }, [local, zoomAt, onView]);

  const byId = new Map(design.nodes.map((n) => [n.id, n]));

  const nodeAt = (wx: number, wy: number, except?: string) => {
    let best: { id: string; d: number } | null = null;
    for (const n of design.nodes) {
      if (n.id === except) continue;
      const t = nodeTop(n);
      const d = Math.hypot(t.x - wx, t.y - wy);
      if (d < 70 && (!best || d < best.d)) best = { id: n.id, d };
    }
    return best?.id ?? null;
  };

  /* ---------- pointer handling ---------- */
  const onBgDown = (e: React.PointerEvent) => {
    if (e.button === 2) return;
    svgRef.current!.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      const { sx, sy } = local((a.x + b.x) / 2, (a.y + b.y) / 2);
      gesture.current = { type: "pinch", d0: Math.hypot(a.x - b.x, a.y - b.y), k0: view.k, cx: sx, cy: sy, vx: view.x, vy: view.y };
      setDrag(null);
      setMarquee(null);
      return;
    }
    if (e.shiftKey) {
      const w = toWorld(e.clientX, e.clientY);
      gesture.current = { type: "marquee", wx: w.x, wy: w.y };
      setMarquee({ x1: w.x, y1: w.y, x2: w.x, y2: w.y });
    } else gesture.current = { type: "pan", sx: e.clientX, sy: e.clientY, vx: view.x, vy: view.y, moved: false };
  };

  const onNodeDown = (e: React.PointerEvent, id: string) => {
    e.stopPropagation();
    if (e.button === 2) return;
    svgRef.current!.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const w = toWorld(e.clientX, e.clientY);
    const already = selection.nodes.includes(id);
    let ids = selection.nodes;
    if (e.shiftKey) ids = already ? ids.filter((x) => x !== id) : [...ids, id];
    else if (!already) ids = [id];
    onSelect({ nodes: ids, edge: null });
    gesture.current = { type: "drag", ids: already || e.shiftKey ? ids : [id], wx: w.x, wy: w.y, moved: false, clicked: id, additive: e.shiftKey };
  };

  const onHandleDown = (e: React.PointerEvent, id: string) => {
    e.stopPropagation();
    svgRef.current!.setPointerCapture(e.pointerId);
    const w = toWorld(e.clientX, e.clientY);
    gesture.current = { type: "link", from: id };
    setLink({ from: id, x: w.x, y: w.y, over: null });
  };

  const onMove = (e: React.PointerEvent) => {
    if (pointers.current.has(e.pointerId)) pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = gesture.current;
    if (!g) return;
    if (g.type === "pinch") {
      const [a, b] = [...pointers.current.values()];
      if (!a || !b) return;
      const k = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, (g.k0 * Math.hypot(a.x - b.x, a.y - b.y)) / g.d0));
      const { sx, sy } = local((a.x + b.x) / 2, (a.y + b.y) / 2);
      onView({ k, x: sx - (g.cx - g.vx) * (k / g.k0), y: sy - (g.cy - g.vy) * (k / g.k0) });
      return;
    }
    if (g.type === "pan") {
      const dx = e.clientX - g.sx;
      const dy = e.clientY - g.sy;
      if (Math.abs(dx) + Math.abs(dy) > 3) g.moved = true;
      onView({ ...view, x: g.vx + dx, y: g.vy + dy });
      return;
    }
    const w = toWorld(e.clientX, e.clientY);
    if (g.type === "marquee") {
      setMarquee({ x1: g.wx, y1: g.wy, x2: w.x, y2: w.y });
      return;
    }
    if (g.type === "drag") {
      const a = worldToGrid(g.wx, g.wy + 10);
      const b = worldToGrid(w.x, w.y + 10);
      const dgx = b.gx - a.gx;
      const dgy = b.gy - a.gy;
      if (dgx || dgy) g.moved = true;
      setDrag(g.moved ? { ids: g.ids, dgx, dgy } : null);
      return;
    }
    if (g.type === "link") setLink({ from: g.from, x: w.x, y: w.y, over: nodeAt(w.x, w.y, g.from) });
  };

  const onUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    const g = gesture.current;
    if (!g) return;
    if (g.type === "pinch") {
      if (pointers.current.size < 2) gesture.current = null;
      return;
    }
    gesture.current = null;
    if (g.type === "pan") {
      if (!g.moved) onSelect({ nodes: [], edge: null });
    } else if (g.type === "marquee" && marquee) {
      const [x1, x2] = [Math.min(marquee.x1, marquee.x2), Math.max(marquee.x1, marquee.x2)];
      const [y1, y2] = [Math.min(marquee.y1, marquee.y2), Math.max(marquee.y1, marquee.y2)];
      const inside = design.nodes.filter((n) => {
        const t = nodeTop(n);
        return t.x >= x1 && t.x <= x2 && t.y >= y1 && t.y <= y2;
      });
      onSelect({ nodes: [...new Set([...selection.nodes, ...inside.map((n) => n.id)])], edge: null });
      setMarquee(null);
    } else if (g.type === "drag") {
      if (drag && (drag.dgx || drag.dgy)) props.onMove(drag.ids, drag.dgx, drag.dgy);
      else if (!g.moved && !g.additive) onSelect({ nodes: [g.clicked], edge: null });
      setDrag(null);
    } else if (g.type === "link" && link) {
      if (link.over) props.onConnect(link.from, link.over);
      else {
        const gp = worldToGrid(link.x, link.y + 20);
        props.onQuickAdd(link.from, gp.gx, gp.gy, e.clientX, e.clientY);
      }
      setLink(null);
    }
  };

  /* ---------- drawing ---------- */
  const pos = (n: LabNode) => {
    const d = drag && drag.ids.includes(n.id) ? drag : null;
    return gridToWorld(n.gx + (d?.dgx ?? 0), n.gy + (d?.dgy ?? 0));
  };
  const top = (n: LabNode) => {
    const p = pos(n);
    return { x: p.x, y: p.y - (ART_HEIGHT[n.kind] * SIZE_SCALE[n.size] * ART) / 2 };
  };
  const sorted = [...design.nodes].sort((a, b) => a.gx + a.gy - (b.gx + b.gy));
  const sel = new Set(selection.nodes);

  return (
    <div
      ref={wrapRef}
      className="board"
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes("text/x-lab-kind")) e.preventDefault();
      }}
      onDrop={(e) => {
        const kind = e.dataTransfer.getData("text/x-lab-kind") as NodeKind;
        if (!kind) return;
        e.preventDefault();
        const w = toWorld(e.clientX, e.clientY);
        const gp = worldToGrid(w.x, w.y + 20);
        props.onDropKind(kind, gp.gx, gp.gy);
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <svg
        ref={svgRef}
        width={size.w}
        height={size.h}
        viewBox={`0 0 ${size.w} ${size.h}`}
        className={`board-svg${gesture.current?.type === "pan" ? " is-panning" : ""}${link ? " is-linking" : ""}`}
        onPointerDown={onBgDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        role="application"
        aria-label="Design canvas. Drag the background to move around, scroll to zoom."
      >
        <SceneDefs />
        <defs>
          <pattern id="board-grid" patternUnits="userSpaceOnUse" width={CELL * 2} height={CELL} patternTransform={`translate(${f(view.x + CELL)} ${f(view.y + CELL / 2)}) scale(${view.k})`}>
            <path d={`M0 ${CELL / 2} L${CELL} 0 L${CELL * 2} ${CELL / 2} L${CELL} ${CELL} Z`} fill="none" stroke="#a8916f" strokeOpacity={0.26} strokeWidth={1 / Math.max(0.5, view.k)} />
          </pattern>
          <radialGradient id="board-vignette" cx="50%" cy="50%" r="75%">
            <stop offset="0.6" stopColor="#f4ebe0" stopOpacity="0" />
            <stop offset="1" stopColor="#ece2d5" stopOpacity="0.85" />
          </radialGradient>
        </defs>
        <rect width={size.w} height={size.h} fill="#f6efe5" />
        <rect width={size.w} height={size.h} fill="url(#board-grid)" />
        <rect width={size.w} height={size.h} fill="url(#board-vignette)" pointerEvents="none" />

        <g transform={`translate(${f(view.x)} ${f(view.y)}) scale(${view.k})`}>
          {/* connections */}
          {design.edges.map((e) => {
            const a = byId.get(e.from);
            const b = byId.get(e.to);
            if (!a || !b) return null;
            const pa = top(a);
            const pb = top(b);
            const len = Math.hypot(pb.x - pa.x, pb.y - pa.y) || 1;
            const ux = (pb.x - pa.x) / len;
            const uy = (pb.y - pa.y) / len;
            const x1 = pa.x + ux * 34, y1 = pa.y + uy * 34, x2 = pb.x - ux * 40, y2 = pb.y - uy * 40;
            if (len < 80) return null;
            const load = sim.edges[e.id] ?? 0;
            const tgt = sim.nodes[b.id];
            const dead = tgt?.down;
            const hot = !!tgt && (tgt.utilisation > 1 || tgt.dropped > 0.5);
            const isSel = selection.edge === e.id;
            const touched = isSel || sel.has(e.from) || sel.has(e.to);
            const dots = load > 0.5 && !dead ? Math.max(1, Math.min(5, Math.round(Math.log10(load + 1) * 1.3))) : 0;
            const d = `M${f(x1)},${f(y1)} L${f(x2)},${f(y2)}`;
            const dur = Math.max(0.9, Math.min(2.2, len / 160));
            return (
              <g key={e.id} className="board-edge" data-from={e.from} data-to={e.to}>
                <path
                  d={d}
                  stroke="transparent"
                  strokeWidth={18}
                  style={{ cursor: "pointer" }}
                  onPointerDown={(ev) => {
                    ev.stopPropagation();
                    onSelect({ nodes: [], edge: e.id });
                  }}
                  onContextMenu={(ev) => {
                    ev.preventDefault();
                    ev.stopPropagation();
                    onSelect({ nodes: [], edge: e.id });
                    props.onContext({ edge: e.id }, ev.clientX, ev.clientY);
                  }}
                />
                <path
                  d={d}
                  stroke={isSel ? "#5a43a6" : dead ? "#c0392b" : load > 0.5 ? INK : "#a59c90"}
                  strokeWidth={(isSel ? 1.2 : 0) + (load > 0.5 ? 2.2 + Math.min(5, Math.log10(load + 1) * 1.2) : 2.2)}
                  strokeDasharray={dead ? "8 7" : undefined}
                  strokeLinecap="round"
                  markerEnd={load > 0.5 && !dead ? "url(#arrow)" : "url(#arrow-muted)"}
                  pointerEvents="none"
                />
                {Array.from({ length: dots }).map((_, i) => (
                  <circle key={i} r={6} fill={hot ? "#e8a9bd" : "#f6b98a"} stroke={INK} strokeWidth={1.5} pointerEvents="none">
                    <animateMotion path={d} dur={`${dur}s`} begin={`${-(i * dur) / dots}s`} repeatCount="indefinite" />
                  </circle>
                ))}
                {touched && load > 0.5 && (
                  <g pointerEvents="none">
                    <Pill x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 16} text={`${Math.round(load).toLocaleString()} req/s`} size={11} weight={700} tone={hot ? "orange" : "plain"} />
                  </g>
                )}
              </g>
            );
          })}

          {/* link being drawn */}
          {link && (() => {
            const a = byId.get(link.from);
            if (!a) return null;
            const pa = top(a);
            const over = link.over ? byId.get(link.over) : null;
            const pb = over ? top(over) : { x: link.x, y: link.y };
            return <path d={`M${f(pa.x)},${f(pa.y)} L${f(pb.x)},${f(pb.y)}`} stroke="#5a43a6" strokeWidth={3} strokeDasharray="8 6" strokeLinecap="round" markerEnd="url(#arrow)" pointerEvents="none" />;
          })()}

          {/* blocks */}
          {sorted.map((n) => {
            const p = pos(n);
            const st = sim.nodes[n.id];
            const k = SIZE_SCALE[n.size];
            const h = ART_HEIGHT[n.kind] * k * ART;
            const count = counts?.[n.id] ?? n.count;
            const u = n.kind === "users" ? 0 : st?.utilisation ?? 0;
            const down = !!st?.down;
            const over = u > 1;
            const busy = u > 0.85;
            const isSel = sel.has(n.id);
            const isTarget = link?.over === n.id;
            const pct = Math.min(999, Math.round(u * 100));
            return (
              <g
                key={n.id}
                className="board-node"
                data-id={n.id}
                data-kind={n.kind}
                onPointerDown={(e) => onNodeDown(e, n.id)}
                onPointerEnter={() => setHover(n.id)}
                onPointerLeave={() => setHover(null)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!sel.has(n.id)) onSelect({ nodes: [n.id], edge: null });
                  props.onContext({ node: n.id }, e.clientX, e.clientY);
                }}
              >
                <ellipse cx={p.x} cy={p.y + 6} rx={66 * k} ry={33 * k} fill="transparent" />
                {(isSel || isTarget || over || down) && (
                  <ellipse
                    cx={p.x}
                    cy={p.y + 6}
                    rx={64 * k}
                    ry={32 * k}
                    fill={over || down ? "#e8a9bd" : "#7c63d0"}
                    fillOpacity={isTarget ? 0.2 : 0.1}
                    stroke={over || down ? "#c0392b" : "#7c63d0"}
                    strokeWidth={isTarget ? 3 : 2}
                    strokeDasharray="7 6"
                  >
                    {(over || down) && <animate attributeName="opacity" values="0.45;1;0.45" dur="1s" repeatCount="indefinite" />}
                  </ellipse>
                )}
                <g transform={`translate(${p.x} ${p.y}) scale(${ART}) translate(${-p.x} ${-p.y})`} opacity={down ? 0.45 : 1}>
                  <NodeArt kind={n.kind} size={n.size} count={count} x={p.x} y={p.y} />
                </g>
                {down && (
                  <g transform={`translate(${p.x} ${p.y - h / 2})`} pointerEvents="none">
                    <circle r={15} fill="#f6dbe4" stroke="#c0392b" strokeWidth={2.4} />
                    <path d="M-6,-6 L6,6 M6,-6 L-6,6" stroke="#c0392b" strokeWidth={3} strokeLinecap="round" />
                  </g>
                )}
                {KINDS[n.kind].scalable && count > 1 && (
                  <g pointerEvents="none">
                    <CountBadge x={p.x + 34 * k} y={p.y - h - 4} text={`×${count}`} />
                  </g>
                )}
                {n.failed > 0 && !down && (
                  <g pointerEvents="none">
                    <CountBadge x={p.x - 34 * k} y={p.y - h - 4} text={`${n.failed} down`} tone="orange" />
                  </g>
                )}
                <g pointerEvents="none">
                  <Pill
                    x={p.x}
                    y={p.y + 44 * k}
                    text={n.kind === "users" ? `${Math.round(sim.offered).toLocaleString()} req/s` : down ? `${KINDS[n.kind].short} down` : `${KINDS[n.kind].short} ${pct}% busy`}
                    size={12}
                    weight={700}
                    tone={n.kind === "users" ? "yellow" : down || over ? "orange" : busy ? "yellow" : u > 0 ? "green" : "plain"}
                  />
                </g>
              </g>
            );
          })}

          {/* connection handles: always drawn on top so neighbouring blocks never hide them */}
          {!drag && !link &&
            design.nodes
              .filter((n) => ALLOWED[n.kind].length > 0 && (sel.has(n.id) || hover === n.id))
              .map((n) => {
                const p = pos(n);
                const k = SIZE_SCALE[n.size];
                const h = ART_HEIGHT[n.kind] * k * ART;
                return (
                  <g
                    key={`h-${n.id}`}
                    className="board-handle"
                    data-for={n.id}
                    transform={`translate(${p.x + 52 * k} ${p.y - h / 2})`}
                    onPointerDown={(e) => onHandleDown(e, n.id)}
                    onPointerEnter={() => setHover(n.id)}
                    onPointerLeave={() => setHover(null)}
                  >
                    <circle r={14} fill="#e7ddf5" stroke={INK} strokeWidth={1.8} />
                    <path d="M-5,0 H5 M0,-5 V5" stroke={INK} strokeWidth={2.2} strokeLinecap="round" />
                    <title>Drag to connect</title>
                  </g>
                );
              })}

          {marquee && (
            <rect
              x={Math.min(marquee.x1, marquee.x2)}
              y={Math.min(marquee.y1, marquee.y2)}
              width={Math.abs(marquee.x2 - marquee.x1)}
              height={Math.abs(marquee.y2 - marquee.y1)}
              fill="#7c63d0"
              fillOpacity={0.08}
              stroke="#7c63d0"
              strokeWidth={1.5 / view.k}
              strokeDasharray={`${6 / view.k} ${5 / view.k}`}
              pointerEvents="none"
            />
          )}
        </g>
      </svg>
    </div>
  );
}
