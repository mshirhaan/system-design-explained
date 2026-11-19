import { INK } from "./palette";

/** Small line icons drawn around (0, 0) in a 16×16 box, for pills and blocks. */
const s = { fill: "none", stroke: INK, strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

export const ICONS = {
  info: () => (
    <>
      <circle r={7.5} fill={INK} />
      <rect x={-1.2} y={-1.5} width={2.4} height={6} rx={1} fill="#fbf6ef" />
      <circle cy={-4.2} r={1.4} fill="#fbf6ef" />
    </>
  ),
  user: () => (
    <>
      <circle cy={-3.5} r={3.6} {...s} strokeWidth={2.2} />
      <path d="M-6.5,7.5 Q-6.5,1 0,1 Q6.5,1 6.5,7.5 Z" fill={INK} />
    </>
  ),
  chat: () => (
    <>
      <path d="M-7,-6 H7 Q8.5,-6 8.5,-4.5 V3 Q8.5,4.5 7,4.5 H-2 L-6,8 V4.5 H-7 Q-8.5,4.5 -8.5,3 V-4.5 Q-8.5,-6 -7,-6 Z" fill="#5a43a6" />
      {[-4, 0, 4].map((x) => (
        <circle key={x} cx={x} cy={-0.8} r={1.2} fill="#fff" />
      ))}
    </>
  ),
  clock: () => (
    <>
      <circle r={7} {...s} />
      <path d="M0,-3.8 V0 L2.8,2" {...s} />
    </>
  ),
  bolt: () => <path d="M1.5,-8 L-5,1 H0 L-1.5,8 L5,-1 H0 Z" fill={INK} strokeLinejoin="round" />,
  lock: () => (
    <>
      <path d="M-4,-1 V-4 Q-4,-8 0,-8 Q4,-8 4,-4 V-1" {...s} />
      <rect x={-6.5} y={-1.5} width={13} height={9.5} rx={2} fill={INK} />
      <circle cy={3} r={1.4} fill="#fbf6ef" />
    </>
  ),
  globe: () => (
    <>
      <circle r={7.5} {...s} />
      <ellipse rx={3.3} ry={7.5} {...s} strokeWidth={1.6} />
      <path d="M-7.5,0 H7.5" {...s} strokeWidth={1.6} />
    </>
  ),
  search: () => (
    <>
      <circle cx={-1.5} cy={-1.5} r={5} {...s} />
      <path d="M2.3,2.3 L6.8,6.8" {...s} strokeWidth={2.4} />
    </>
  ),
  key: () => (
    <>
      <circle cx={-3.5} r={4} {...s} />
      <path d="M0.5,0 H7.5 M5,0 V3 M7.5,0 V2.5" {...s} />
    </>
  ),
  check: () => <path d="M-6,0 L-2,4 L6,-5" {...s} strokeWidth={2.6} />,
  db: () => (
    <>
      <ellipse cy={-4.5} rx={6.5} ry={2.6} {...s} strokeWidth={1.8} />
      <path d="M-6.5,-4.5 V4.5 Q0,9.5 6.5,4.5 V-4.5 M-6.5,0 Q0,5 6.5,0" {...s} strokeWidth={1.8} />
    </>
  ),
  page: () => (
    <>
      <path d="M-5.5,-7.5 H2 L5.5,-4 V7.5 H-5.5 Z" {...s} strokeWidth={1.8} />
      <path d="M-2.5,-1 H2.5 M-2.5,2.5 H2.5" {...s} strokeWidth={1.6} />
    </>
  ),
};

export type IconName = keyof typeof ICONS;

export function Icon({ name, x = 0, y = 0, scale = 1 }: { name: IconName; x?: number; y?: number; scale?: number }) {
  const Draw = ICONS[name];
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <Draw />
    </g>
  );
}
