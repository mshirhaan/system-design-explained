import { BLOCKS } from "@/components/scene/palette";
import type { TrackColor } from "@/lib/curriculum";

const OUTLINE = "M30 8 Q32 7 34 8 L50 16 Q52 17 52 19 L52 38 Q52 40 50 41 L32 50 Q30 51 28 50 L10 41 Q8 40 8 38 L8 19 Q8 17 10 16 L26 8 Q28 7 30 8Z";

/** A small static isometric cube in a track's colour. */
export function TrackCube({ color, className }: { color: TrackColor; className?: string }) {
  const c = BLOCKS[color];
  return (
    <svg className={className} viewBox="0 0 60 60" aria-hidden="true">
      <ellipse cx="30" cy="52" rx="20" ry="5" fill="#6b5236" opacity=".18" />
      <path d={OUTLINE} fill={c.side[1]} />
      <path d="M30 29.5 L52 19 L52 38 Q52 40 50 41 L32 50 Q30 51 30 49Z" fill="#3a2a14" opacity=".07" />
      <path d="M28 8 Q30 7 32 8 L50 17 Q52 18 50 19 L32 28 Q30 29 28 28 L10 19 Q8 18 10 17Z" fill={c.top[1]} />
      <path d="M11 19.6 L28 28.6 Q30 29.6 32 28.6 L49 19.6" fill="none" stroke="#fff" strokeOpacity=".8" strokeWidth="1.3" strokeLinecap="round" />
      <path d={OUTLINE} fill="none" stroke="#3b3631" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}
