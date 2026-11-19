import type { Ref } from "react";
import { f, hopPath, P, toward, type Pt } from "./geometry";
import { INK, PACKETS } from "./palette";
import { EntityView, Pill } from "./primitives";
import { SceneDefs } from "./SceneDefs";
import type { Entity, LabelDef, LinkDef, PacketDef, SceneDef, StepDef, XY } from "./types";

/*
 * Scenes animate with SVG's built-in timeline (SMIL). Every timed element begins
 * relative to the SVG clock, so the player can pause, resume and rewind the whole
 * step with pauseAnimations(), unpauseAnimations() and setCurrentTime().
 */

const DEFAULT_DUR = 0.9;

export function stepDuration(step: StepDef): number {
  let end = 0;
  for (const p of step.packets ?? []) end = Math.max(end, p.at + (p.dur ?? DEFAULT_DUR) + 0.4);
  for (const l of step.labels ?? []) end = Math.max(end, l.until ?? (l.from ?? 0) + 0.6);
  for (const l of step.links ?? []) end = Math.max(end, (l.from_t ?? 0) + 0.4);
  return Math.max(3, end + (step.hold ?? 1.8));
}

const s = (t: number) => `${f(t)}s`;

function resolve(points: Record<string, XY>, at: string | XY): Pt {
  if (Array.isArray(at)) return P(at[0], at[1]);
  const p = points[at];
  if (!p) throw new Error(`Unknown scene point "${at}"`);
  return P(p[0], p[1]);
}

/** Fades and pops its children in at `from`, and out at `until`. */
function Appear({ from = 0, until, pop = true, children }: { from?: number; until?: number; pop?: boolean; children: React.ReactNode }) {
  return (
    <g opacity={0}>
      <animate attributeName="opacity" values="0;1" dur="0.2s" begin={s(from)} fill="freeze" />
      {until !== undefined && <animate attributeName="opacity" values="1;0" dur="0.25s" begin={s(until)} fill="freeze" />}
      {pop ? (
        <g>
          <animateTransform
            attributeName="transform"
            type="scale"
            values="0.6;1.08;1"
            keyTimes="0;0.6;1"
            dur="0.45s"
            begin={s(from)}
            fill="freeze"
          />
          {children}
        </g>
      ) : (
        children
      )}
    </g>
  );
}

function Label({ def, points }: { def: LabelDef; points: Record<string, XY> }) {
  const p = resolve(points, def.at);
  return (
    <g transform={`translate(${f(p.x)} ${f(p.y)})`}>
      <Appear from={def.from} until={def.until}>
        <Pill x={0} y={0} text={def.text} icon={def.icon} tone={def.tone} size={def.size ?? 15} />
      </Appear>
    </g>
  );
}

function Link({ def, points }: { def: LinkDef; points: Record<string, XY> }) {
  const a = resolve(points, def.from);
  const b = resolve(points, def.to);
  const style = def.style ?? "solid";
  if (style === "pipe") {
    const d = `M${f(a.x)},${f(a.y)} L${f(b.x)},${f(b.y)}`;
    return (
      <Appear from={def.from_t} pop={false}>
        <path d={d} stroke={INK} strokeWidth={11} strokeLinecap="round" />
        <path d={d} stroke="#b2d491" strokeWidth={7} strokeLinecap="round" />
        <path d={d} stroke="#fff" strokeOpacity={0.55} strokeWidth={1.6} strokeLinecap="round" transform="translate(0 -1.6)" />
      </Appear>
    );
  }
  const p1 = toward(a, b, def.both ? 12 : 6);
  const p2 = toward(b, a, 12);
  const muted = style === "muted" || style === "dashed";
  const marker = `url(#${muted ? "arrow-muted" : "arrow"})`;
  return (
    <Appear from={def.from_t} pop={false}>
      <path
        d={`M${f(p1.x)},${f(p1.y)} L${f(p2.x)},${f(p2.y)}`}
        fill="none"
        stroke={muted ? "#a59c90" : INK}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeDasharray={style === "dashed" ? "7 7" : undefined}
        markerEnd={marker}
        markerStart={def.both ? marker : undefined}
      />
    </Appear>
  );
}

function PacketShape({ kind }: { kind: PacketDef["kind"] }) {
  const k = PACKETS[kind];
  return (
    <>
      <circle r={13} fill={k.glow} opacity={0.45} filter="url(#blur-sm)" />
      {kind === "message" ? (
        <>
          <rect x={-8} y={-8} width={16} height={16} rx={4} fill={k.fill} stroke={INK} strokeWidth={1.7} />
          <path d="M-4.5,-2.5 L0,1 L4.5,-2.5" fill="none" stroke={INK} strokeWidth={1.4} strokeLinecap="round" />
        </>
      ) : kind === "heartbeat" ? (
        <circle r={7.5} fill={k.fill} stroke="#3fa456" strokeWidth={3} />
      ) : kind === "secure" ? (
        <>
          <rect x={-8} y={-8} width={16} height={16} rx={4} fill={k.fill} stroke={INK} strokeWidth={1.7} />
          <path d="M-2.6,-1 V-3 Q-2.6,-5.4 0,-5.4 Q2.6,-5.4 2.6,-3 V-1" fill="none" stroke={INK} strokeWidth={1.4} />
          <rect x={-4} y={-1.2} width={8} height={6} rx={1.2} fill={INK} />
        </>
      ) : (
        <circle r={7.5} fill={k.fill} stroke={INK} strokeWidth={1.7} />
      )}
    </>
  );
}

function Packet({ def, points }: { def: PacketDef; points: Record<string, XY> }) {
  const pts = def.path.map((n) => resolve(points, n));
  const dur = def.dur ?? DEFAULT_DUR;
  const end = def.at + dur;
  const last = pts[pts.length - 1];
  const glow = PACKETS[def.kind].glow;
  return (
    <g>
      <g opacity={0}>
        <set attributeName="opacity" to="1" begin={s(def.at)} />
        <set attributeName="opacity" to="0" begin={s(end)} />
        <animateMotion
          path={hopPath(pts)}
          begin={s(def.at)}
          dur={s(dur)}
          fill="freeze"
          calcMode="spline"
          keyPoints="0;1"
          keyTimes="0;1"
          keySplines="0.45 0 0.55 1"
        />
        <PacketShape kind={def.kind} />
        {def.tag && (
          <g transform="translate(0 -22)">
            <Pill x={0} y={0} text={def.tag} size={11} weight={700} tone="plain" />
          </g>
        )}
      </g>
      <circle cx={last.x} cy={last.y} r={9} fill="none" stroke={glow} strokeWidth={2.5} opacity={0}>
        <animate attributeName="r" values="9;28" dur="0.6s" begin={s(end)} fill="freeze" />
        <animate attributeName="opacity" values="0.9;0" dur="0.6s" begin={s(end)} fill="freeze" />
      </circle>
    </g>
  );
}

function FocusRing({ e }: { e: Entity }) {
  const [x, y] = e.at;
  const rx =
    e.kind === "box" || e.kind === "slab" ? (e.w + (e.d ?? e.w)) / 2 + 26 :
    e.kind === "cylinder" ? e.rx + 30 :
    e.kind === "laptop" ? 86 : e.kind === "router" ? 40 : 60;
  return (
    <ellipse cx={x} cy={y + 4} rx={rx} ry={rx / 2} fill="#7c63d0" fillOpacity={0.07} stroke="#7c63d0" strokeWidth={2} strokeDasharray="6 7">
      <animate attributeName="opacity" values="0.35;1;0.35" dur="1.4s" repeatCount="indefinite" />
    </ellipse>
  );
}

export function Scene({
  scene, step, label, svgRef, className,
}: {
  scene: SceneDef; step: StepDef; label: string; svgRef?: Ref<SVGSVGElement>; className?: string;
}) {
  const [x, y, w, h] = scene.viewBox;
  const points = scene.points;
  const focus = new Set(step.focus ?? []);
  // Entities draw in the order the scene lists them: list back-most objects first.
  const ordered = scene.entities;
  return (
    <svg ref={svgRef} className={className} viewBox={`${x} ${y} ${w} ${h}`} role="img" aria-label={label}>
      <SceneDefs />
      <rect x={x} y={y} width={w} height={h} fill="url(#iso-grid)" mask="url(#grid-mask)" />
      <g>{scene.entities.filter((e) => focus.has(e.id)).map((e) => <FocusRing key={e.id} e={e} />)}</g>
      <g>{(step.links ?? []).map((l, i) => <Link key={i} def={l} points={points} />)}</g>
      <g>{ordered.map((e) => <EntityView key={e.id} e={e} screen={step.screen} />)}</g>
      <g>{(step.packets ?? []).map((p, i) => <Packet key={i} def={p} points={points} />)}</g>
      <g>{(step.labels ?? []).map((l, i) => <Label key={i} def={l} points={points} />)}</g>
    </svg>
  );
}
