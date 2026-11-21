import { Box, Cylinder, Phone, Pill } from "@/components/scene/primitives";
import { INK } from "@/components/scene/palette";
import type { NodeKind, Size } from "@/lib/lab/catalog";

/** Height of each block's art (before size scaling), used to place arrows and badges. */
export const ART_HEIGHT: Record<NodeKind, number> = { users: 72, cdn: 46, lb: 30, app: 54, cache: 38, queue: 40, db: 54, replica: 48 };
export const SIZE_SCALE: Record<Size, number> = { s: 1, m: 1.16, l: 1.32 };

function Single({ kind, x, y }: { kind: NodeKind; x: number; y: number }) {
  switch (kind) {
    case "users":
      return (
        <g>
          <Box cx={x} cy={y} w={64} h={10} r={10} />
          <Phone cx={x - 22} cy={y - 6} />
          <g transform={`translate(${x + 22} ${y - 2}) scale(0.82) translate(${-(x + 22)} ${-(y - 2)})`}>
            <Phone cx={x + 22} cy={y - 2} />
          </g>
        </g>
      );
    case "cdn":
      return <Box cx={x} cy={y} w={42} h={36} r={10} color="purple" icon="globe" />;
    case "lb":
      return <Box cx={x} cy={y} w={46} h={20} r={9} color="green" icon="bolt" />;
    case "app":
      return <Box cx={x} cy={y} w={38} h={46} r={10} color="blue" text={["App"]} textSize={12} />;
    case "cache":
      return <Box cx={x} cy={y} w={36} h={26} r={9} color="orange" icon="bolt" />;
    case "queue":
      return (
        <g>
          <Box cx={x} cy={y} w={44} h={24} r={8} color="yellow" />
          {[-14, -2, 10].map((dx, i) => (
            <rect key={i} x={x + dx - 4} y={y - 24 - 14 + i * 3} width={9} height={9} rx={2} fill="#f6cd82" stroke={INK} strokeWidth={1.2} />
          ))}
        </g>
      );
    case "db":
      return <Cylinder cx={x} cy={y} rx={30} h={44} color="yellow" />;
    case "replica":
      return <Cylinder cx={x} cy={y} rx={25} h={36} color="green" />;
  }
}

/** A block, drawn as a little stack when it runs several instances. */
export function NodeArt({ kind, size = "s", count = 1, x, y }: { kind: NodeKind; size?: Size; count?: number; x: number; y: number }) {
  const k = SIZE_SCALE[size];
  const copies = Math.min(3, Math.max(1, count));
  // Extra instances peek out behind the front one.
  const offsets = [
    [-16, -8],
    [-8, -4],
    [0, 0],
  ].slice(3 - copies);
  return (
    <g transform={`translate(${x} ${y}) scale(${k}) translate(${-x} ${-y})`}>
      {offsets.map(([dx, dy], i) => (
        <g key={i} transform={`translate(${dx} ${dy})`} opacity={i === offsets.length - 1 ? 1 : 0.92}>
          <Single kind={kind} x={x} y={y} />
        </g>
      ))}
    </g>
  );
}

export function CountBadge({ x, y, text, tone = "yellow" }: { x: number; y: number; text: string; tone?: "yellow" | "orange" | "violet" | "green" }) {
  return <Pill x={x} y={y} text={text} size={11} weight={800} tone={tone} />;
}
