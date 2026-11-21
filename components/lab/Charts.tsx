import type { FailureEvent, Sample } from "@/lib/lab/run";

export function Sparkline({ values, color, w = 104, h = 20, max }: { values: number[]; color: string; w?: number; h?: number; max?: number }) {
  if (values.length < 2) return <svg className="spark" width={w} height={h} aria-hidden="true" />;
  const top = max ?? Math.max(...values, 1e-9);
  const pts = values.map((v, i) => [(i / (values.length - 1)) * w, h - 2 - (Math.min(v, top) / top) * (h - 4)]);
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const last = pts[pts.length - 1];
  return (
    <svg className="spark" width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <path d={`${line} L${w},${h} L0,${h} Z`} fill={color} opacity={0.18} />
      <path d={line} fill="none" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r={2.6} fill={color} stroke="#1d1b18" strokeWidth={1} />
    </svg>
  );
}

/** Traffic over the day (area), failures (red bars) and response time (line), with failure events marked. */
export function DayChart({ history, events, hour }: { history: Sample[]; events: FailureEvent[]; hour: number }) {
  const W = 600;
  const H = 120;
  const pad = { l: 34, r: 34, t: 10, b: 20 };
  const iw = W - pad.l - pad.r;
  const ih = H - pad.t - pad.b;
  const x = (h: number) => pad.l + (h / 24) * iw;
  const maxRps = Math.max(1, ...history.map((s) => s.rps));
  const maxLat = Math.max(200, ...history.map((s) => Math.min(s.latencyMs, 2000)));
  const yR = (v: number) => pad.t + ih - (v / maxRps) * ih;
  const yL = (v: number) => pad.t + ih - (Math.min(v, maxLat) / maxLat) * ih;
  const area = history.length > 1 ? `M${x(history[0].hour)},${pad.t + ih} ${history.map((s) => `L${x(s.hour).toFixed(1)},${yR(s.rps).toFixed(1)}`).join(" ")} L${x(history[history.length - 1].hour)},${pad.t + ih} Z` : "";
  const lat = history.length > 1 ? history.map((s, i) => `${i ? "L" : "M"}${x(s.hour).toFixed(1)},${yL(s.latencyMs).toFixed(1)}`).join(" ") : "";
  return (
    <svg className="day-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Traffic, failures and response time across the day">
      {[0, 6, 12, 18, 24].map((h) => (
        <g key={h}>
          <line x1={x(h)} x2={x(h)} y1={pad.t} y2={pad.t + ih} stroke="#ddd3c5" strokeDasharray="3 4" />
          <text x={x(h)} y={H - 5} textAnchor="middle" className="chart-tick">
            {String(h).padStart(2, "0")}:00
          </text>
        </g>
      ))}
      <text x={pad.l - 4} y={pad.t + 8} textAnchor="end" className="chart-tick">{maxRps >= 1000 ? `${Math.round(maxRps / 1000)}k` : Math.round(maxRps)}</text>
      <text x={W - pad.r + 4} y={pad.t + 8} className="chart-tick">{Math.round(maxLat)} ms</text>
      {area && <path d={area} fill="#a7c3e7" opacity={0.55} stroke="#5d82b5" strokeWidth={1.2} />}
      {history.map((s, i) =>
        s.errorRate > 0.002 ? (
          <rect key={i} x={x(s.hour) - 1.6} y={pad.t + ih - Math.min(1, s.errorRate * 4) * ih} width={3.2} height={Math.min(1, s.errorRate * 4) * ih} fill="#d9577a" opacity={0.85} />
        ) : null,
      )}
      {lat && <path d={lat} fill="none" stroke="#1d1b18" strokeWidth={1.6} strokeLinejoin="round" />}
      {events.map((e) => (
        <g key={e.label}>
          <line x1={x(e.at)} x2={x(e.at)} y1={pad.t} y2={pad.t + ih} stroke="#c0392b" strokeWidth={1.5} />
          <circle cx={x(e.at)} cy={pad.t + 4} r={4} fill="#f6dbe4" stroke="#c0392b" strokeWidth={1.5}>
            <title>{e.label}</title>
          </circle>
        </g>
      ))}
      <line x1={x(hour)} x2={x(hour)} y1={pad.t - 4} y2={pad.t + ih} stroke="#5a43a6" strokeWidth={2} />
    </svg>
  );
}
