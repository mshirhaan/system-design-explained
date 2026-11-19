import { boxCorners, f, P, planeX, rounded, topPlane, toward } from "./geometry";
import { Icon, type IconName } from "./icons";
import { EDGE, INK, SHADOW, TONES, type BlockColor } from "./palette";
import type { Entity, ScreenState } from "./types";

const MONO = 0.6; // JetBrains Mono advance width, in em

/* ---------- Box (cube or slab) ---------- */
export function Box({
  cx, cy, w, d = w, h, r = 10, color = "slab", icon, text, textSize = 20,
}: {
  cx: number; cy: number; w: number; d?: number; h: number; r?: number;
  color?: BlockColor; icon?: IconName; text?: string[]; textSize?: number;
}) {
  const k = boxCorners(cx, cy, w, d, h);
  const rs = Math.min(r, h / 2.2);
  const sil = rounded([k.T, k.R, k.Rb, k.Bb, k.Lb, k.L], [r, rs, rs, r, rs, rs]);
  const hl = rounded([toward(k.L, k.B, r), k.B, toward(k.R, k.B, r)], [0, r, 0], false);
  return (
    <g>
      <path d={sil} transform="translate(0 6)" fill={SHADOW} opacity={0.22} filter="url(#blur-lg)" />
      <path d={sil} fill={`url(#g-${color}-side)`} />
      <path d={rounded([k.B, k.R, k.Rb, k.Bb], [0, rs, rs, r])} fill="#3a2a14" opacity={0.06} />
      <path d={rounded([k.T, k.R, k.B, k.L], r)} fill={`url(#g-${color}-top)`} />
      {h > 30 && (
        <path
          d={`M${f(k.B.x)},${f(k.B.y + r * 0.6)} L${f(k.Bb.x)},${f(k.Bb.y - r)}`}
          stroke="#fff" strokeOpacity={0.55} strokeWidth={1.4} strokeLinecap="round"
        />
      )}
      <path d={hl} transform="translate(0 1.6)" fill="none" stroke="#fff" strokeOpacity={0.8} strokeWidth={1.6} strokeLinecap="round" />
      <path d={hl} transform="translate(0 3.6)" fill="none" stroke="#5a4123" strokeOpacity={0.08} strokeWidth={2.4} strokeLinecap="round" />
      <path d={sil} fill="none" stroke={EDGE} strokeWidth={1.6} strokeLinejoin="round" />
      {icon && (
        <g transform={topPlane(k.top.x, k.top.y)}>
          <g transform={`scale(${Math.min(w, d) / 36})`}>
            <rect x={-9.5} y={-9.5} width={19} height={19} rx={5} fill="#fbf8f4" stroke={INK} strokeWidth={1.4} />
            <Icon name={icon} scale={0.9} />
          </g>
        </g>
      )}
      {text?.map((t, i) => (
        <text
          key={t}
          className="st"
          x={cx}
          y={k.Bb.y - h / 2 - ((text.length - 1) * textSize * 1.15) / 2 + i * textSize * 1.15 - textSize * 0.1}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={textSize}
          fontWeight={800}
        >
          {t}
        </text>
      ))}
    </g>
  );
}

/* ---------- Cylinder (database / store) ---------- */
export function Cylinder({
  cx, cy, rx, h, color = "yellow", text,
}: { cx: number; cy: number; rx: number; h: number; color?: BlockColor; text?: string[] }) {
  const ry = rx / 2;
  const ty = cy - h;
  return (
    <g>
      <ellipse cx={cx} cy={cy + 6} rx={rx + 4} ry={ry + 2} fill={SHADOW} opacity={0.22} filter="url(#blur-lg)" />
      <path d={`M${cx - rx},${ty} L${cx - rx},${cy} A${rx} ${ry} 0 0 0 ${cx + rx},${cy} L${cx + rx},${ty} Z`} fill={`url(#g-${color}-side)`} />
      <path d={`M${cx},${ty + ry} L${cx},${cy + ry} A${rx} ${ry} 0 0 0 ${cx + rx},${cy} L${cx + rx},${ty} Z`} fill="#3a2a14" opacity={0.06} />
      {[0.36, 0.68].map((k) => (
        <path key={k} d={`M${cx - rx},${ty + h * k} A${rx} ${ry} 0 0 0 ${cx + rx},${ty + h * k}`} fill="none" stroke={EDGE} strokeOpacity={0.35} strokeWidth={1.2} />
      ))}
      <path d={`M${cx - rx},${ty} L${cx - rx},${cy} A${rx} ${ry} 0 0 0 ${cx + rx},${cy} L${cx + rx},${ty}`} fill="none" stroke={EDGE} strokeWidth={1.6} strokeLinejoin="round" />
      <ellipse cx={cx} cy={ty} rx={rx} ry={ry} fill={`url(#g-${color}-top)`} stroke={EDGE} strokeWidth={1.6} />
      <ellipse cx={cx} cy={ty + 1.5} rx={rx * 0.7} ry={ry * 0.7} fill="none" stroke="#fff" strokeOpacity={0.7} strokeWidth={1.4} />
      {text?.map((t, i) => (
        <text key={t} className="st" x={cx} y={cy - h * 0.42 + i * 17} textAnchor="middle" dominantBaseline="middle" fontSize={14} fontWeight={800}>
          {t}
        </text>
      ))}
    </g>
  );
}

/* ---------- Laptop ---------- */
function BrowserContent({ state, w, H }: { state: ScreenState; w: number; H: number }) {
  const x0 = 6, y0 = -H + 12, cw = w - 12;
  if (state === "blank") return null;
  if (state === "loading") {
    return (
      <g>
        <circle cx={w / 2} cy={-H / 2 + 4} r={7} fill="none" stroke="#d6cbbd" strokeWidth={2.6} />
        <path d={`M${w / 2},${-H / 2 - 3} A7 7 0 0 1 ${w / 2 + 7},${-H / 2 + 4}`} fill="none" stroke={INK} strokeWidth={2.6} strokeLinecap="round">
          <animateTransform attributeName="transform" type="rotate" from={`0 ${w / 2} ${-H / 2 + 4}`} to={`360 ${w / 2} ${-H / 2 + 4}`} dur="0.9s" repeatCount="indefinite" />
        </path>
      </g>
    );
  }
  const partial = state === "page-partial";
  return (
    <g>
      <rect x={x0} y={y0} width={cw * 0.55} height={4.5} rx={2} fill="#3b3631" />
      <rect x={x0} y={y0 + 8} width={cw} height={14} rx={3} fill={partial ? "#ece5da" : "#cbdff4"} />
      {[0, 1, 2].map((i) => (
        <rect key={i} x={x0 + i * (cw / 3) + 1} y={y0 + 26} width={cw / 3 - 3} height={12} rx={2.5} fill={partial ? "#ece5da" : ["#fcd3ab", "#d0e8c0", "#e5daf3"][i]} />
      ))}
      <rect x={x0} y={y0 + 42} width={cw * 0.8} height={3} rx={1.5} fill="#d6cbbd" />
    </g>
  );
}

export function Laptop({ cx, cy, screen = "blank", scale = 1.25 }: { cx: number; cy: number; screen?: ScreenState; scale?: number }) {
  const w = 68, d = 46, h = 5, H = 62;
  const k = boxCorners(0, 0, w, d, h);
  const sil = rounded([k.T, k.R, k.Rb, k.Bb, k.Lb, k.L], [6, 2, 2, 6, 2, 2]);
  return (
    <g transform={`translate(${f(cx)} ${f(cy)}) scale(${scale})`}>
      <path d={sil} transform="translate(0 5)" fill={SHADOW} opacity={0.25} filter="url(#blur-sm)" />
      <path d={sil} fill="#cfc8c0" stroke={INK} strokeWidth={1.4} strokeLinejoin="round" />
      <path d={rounded([k.T, k.R, k.B, k.L], 6)} fill="#efeae4" stroke={INK} strokeWidth={1.4} strokeLinejoin="round" />
      <g transform={topPlane(k.T.x, k.T.y)} fill="#fbf8f4" stroke="#b9b1a7" strokeWidth={0.55}>
        {Array.from({ length: 3 }).flatMap((_, row) =>
          Array.from({ length: 10 }).map((__, col) => (
            <rect key={`${row}-${col}`} x={6 + col * 5.7} y={5 + row * 4.6} width={4.6} height={3.6} rx={0.7} />
          )),
        )}
        <rect x={w / 2 - 10} y={21} width={20} height={11} rx={2} fill="#e6ded4" />
      </g>
      <g transform={planeX(k.T.x + 2.5, k.T.y - 1.25)}>
        <rect x={0} y={-H} width={w} height={H} rx={5} fill="#47423d" stroke={INK} strokeWidth={1.3} />
      </g>
      <g transform={planeX(k.T.x, k.T.y)}>
        <rect x={0} y={-H} width={w} height={H} rx={5} fill="#6b655e" stroke={INK} strokeWidth={1.4} />
        <rect x={3} y={-H + 3} width={w - 6} height={H - 6} rx={3} fill="#fbf8f4" stroke={INK} strokeWidth={0.9} />
        <rect x={3} y={-H + 3} width={w - 6} height={6} rx={2} fill="#ece5da" />
        {[0, 1, 2].map((i) => (
          <circle key={i} cx={7 + i * 3.6} cy={-H + 6} r={1.1} fill={["#e8a9bd", "#f5cb7f", "#b0d59c"][i]} />
        ))}
        <BrowserContent state={screen} w={w} H={H} />
      </g>
    </g>
  );
}

/* ---------- Phone ---------- */
export function Phone({ cx, cy }: { cx: number; cy: number }) {
  const W = 40, H = 74;
  const plane = (ox: number, oy: number) => `matrix(1 -0.5 0 1 ${f(ox)} ${f(oy)})`;
  return (
    <g transform={`translate(${cx} ${cy})`}>
      <path d={rounded([P(-27, 12), P(20, -12), P(27, -8), P(-20, 16)], 6)} fill={SHADOW} opacity={0.3} filter="url(#blur-sm)" />
      {Array.from({ length: 7 }).map((_, i) => (
        <g key={i} transform={plane(-20 - 6 + i, 10 - 3 + i / 2)}>
          <rect x={0} y={-H} width={W} height={H} rx={9} fill={i === 0 ? "#47423d" : "#4f4a44"} stroke={i === 0 ? INK : "none"} strokeWidth={1.5} />
        </g>
      ))}
      <g transform={plane(-20, 10)}>
        <rect x={0} y={-H} width={W} height={H} rx={9} fill="#6b655e" stroke={INK} strokeWidth={1.5} />
        <rect x={3.3} y={-H + 4} width={W - 6.6} height={H - 8} rx={6} fill="#f8f3ec" stroke={INK} strokeWidth={1} />
        <rect x={W / 2 - 6} y={-H + 7} width={12} height={2.4} rx={1.2} fill="#3b3631" />
        {[0, 1, 2].map((i) => (
          <rect key={i} x={i % 2 ? W - 7 - 18 : 7} y={-H + 16 + i * 14} width={18} height={8} rx={4} fill="#e7ded2" />
        ))}
      </g>
    </g>
  );
}

/* ---------- Router (a small puck on the network path) ---------- */
export function Router({ cx, cy }: { cx: number; cy: number }) {
  const rx = 22, h = 12;
  return (
    <g>
      <Cylinder cx={cx} cy={cy} rx={rx} h={h} color="green" />
      <g transform={topPlane(cx, cy - h)}>
        <path d="M-7,-3 H6 M3,-6 L6,-3 L3,0 M7,4 H-6 M-3,1 L-6,4 L-3,7" fill="none" stroke={INK} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </g>
  );
}

/* ---------- Pill label ---------- */
export function Pill({
  x, y, text, icon, tone = "plain", size = 15, weight = 600,
}: {
  x: number; y: number; text: string; icon?: IconName;
  tone?: keyof typeof TONES; size?: number; weight?: number;
}) {
  const lines = text.split("\n");
  const padX = size * 0.8, padY = size * 0.42, lineH = size * 1.32;
  const iconW = icon ? size * 1.45 : 0;
  const w = Math.max(...lines.map((l) => l.length)) * size * MONO + padX * 2 + iconW;
  const h = lines.length * lineH + padY * 2;
  const rr = Math.min(h / 2, 16);
  const centered = lines.length > 1 && !icon;
  return (
    <g transform={`translate(${f(x)} ${f(y)})`}>
      <rect x={-w / 2 + 1.5} y={-h / 2 + 2.5} width={w} height={h} rx={rr} fill={INK} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={rr} fill={TONES[tone]} stroke={INK} strokeWidth={1.7} />
      {icon && <Icon name={icon} x={-w / 2 + padX + size * 0.45} scale={size / 15} />}
      {lines.map((l, i) => (
        <text
          key={i}
          className="st"
          x={centered ? 0 : f(-w / 2 + padX + iconW)}
          y={f(-h / 2 + padY + lineH * (i + 0.5))}
          dy=".35em"
          textAnchor={centered ? "middle" : "start"}
          fontSize={size}
          fontWeight={weight}
        >
          {l}
        </text>
      ))}
    </g>
  );
}

/* ---------- Entity dispatcher ---------- */
export function nameOffset(e: Entity): [number, number] {
  if (e.nameOffset) return e.nameOffset;
  switch (e.kind) {
    case "box":
    case "slab":
      return [0, (e.w + (e.d ?? e.w)) / 4 + 34];
    case "cylinder":
      return [0, e.rx / 2 + 34];
    case "laptop":
      return [0, 62];
    case "phone":
      return [0, 40];
    case "router":
      return [0, 34];
  }
}

export function EntityView({ e, screen }: { e: Entity; screen?: ScreenState }) {
  const [x, y] = e.at;
  let body;
  switch (e.kind) {
    case "slab":
      body = <Box cx={x} cy={y} w={e.w} d={e.d} h={e.h ?? 16} r={12} color={e.color ?? "slab"} />;
      break;
    case "box":
      body = <Box cx={x} cy={y} w={e.w} d={e.d} h={e.h} r={14} color={e.color} icon={e.icon} text={e.text} textSize={e.textSize} />;
      break;
    case "cylinder":
      body = <Cylinder cx={x} cy={y} rx={e.rx} h={e.h} color={e.color} text={e.text} />;
      break;
    case "laptop":
      body = <Laptop cx={x} cy={y} screen={screen} />;
      break;
    case "phone":
      body = <Phone cx={x} cy={y} />;
      break;
    case "router":
      body = <Router cx={x} cy={y} />;
      break;
  }
  const [ox, oy] = nameOffset(e);
  return (
    <g data-entity={e.id}>
      {body}
      {e.name && <Pill x={x + ox} y={y + oy} text={e.name} icon={e.nameIcon} size={14} weight={700} />}
    </g>
  );
}
