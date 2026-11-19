import { BLOCKS, INK } from "./palette";

/** Shared gradients, filters, markers and the isometric grid. Ids are identical across scenes, so duplicates are harmless. */
export function SceneDefs() {
  return (
    <defs>
      {Object.entries(BLOCKS).map(([name, c]) => (
        <g key={name}>
          <linearGradient id={`g-${name}-top`} x1="0" y1="0" x2="0.35" y2="1">
            <stop offset="0" stopColor={c.top[0]} />
            <stop offset="1" stopColor={c.top[1]} />
          </linearGradient>
          <linearGradient id={`g-${name}-side`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={c.side[0]} />
            <stop offset="1" stopColor={c.side[1]} />
          </linearGradient>
        </g>
      ))}
      <filter id="blur-sm" x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="2.2" />
      </filter>
      <filter id="blur-lg" x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="6.5" />
      </filter>
      {[
        ["arrow", INK],
        ["arrow-muted", "#a59c90"],
        ["arrow-green", "#3f8f4e"],
      ].map(([id, color]) => (
        <marker
          key={id}
          id={id}
          viewBox="0 0 10 10"
          refX="8.6"
          refY="5"
          markerWidth="5.2"
          markerHeight="5.2"
          orient="auto-start-reverse"
          markerUnits="strokeWidth"
        >
          <path d="M1,1.2 L9,5 L1,8.8 Z" fill={color} stroke={color} strokeLinejoin="round" />
        </marker>
      ))}
      <pattern id="iso-grid" patternUnits="userSpaceOnUse" x="0" y="-7" width="28" height="14">
        <path d="M0 7 L14 0 L28 7 L14 14 Z" fill="none" stroke="#a8916f" strokeOpacity=".3" strokeWidth=".8" />
      </pattern>
      <radialGradient id="grid-fade">
        <stop offset="0" stopColor="#fff" stopOpacity="1" />
        <stop offset=".45" stopColor="#fff" stopOpacity=".9" />
        <stop offset=".8" stopColor="#fff" stopOpacity=".3" />
        <stop offset="1" stopColor="#fff" stopOpacity="0" />
      </radialGradient>
      <mask id="grid-mask" maskContentUnits="objectBoundingBox">
        <rect x="0" y="0" width="1" height="1" fill="url(#grid-fade)" />
      </mask>
    </defs>
  );
}
