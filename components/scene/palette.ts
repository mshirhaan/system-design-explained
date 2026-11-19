export const INK = "#1d1b18";
export const EDGE = "#3b3631";
export const SHADOW = "#6b5236";

export const BLOCKS = {
  slab: { top: ["#f8f1e8", "#efe6da"], side: ["#ece2d5", "#e1d5c5"] },
  blue: { top: ["#e0ecf9", "#cbdff4"], side: ["#bcd3ef", "#a7c3e7"] },
  purple: { top: ["#f3ebfa", "#e5daf3"], side: ["#d9cbef", "#c9b8e5"] },
  green: { top: ["#e3f2d8", "#d0e8c0"], side: ["#c2e0b1", "#b0d59c"] },
  orange: { top: ["#fee7cf", "#fcd3ab"], side: ["#f9c697", "#f2b27c"] },
  yellow: { top: ["#fff4d8", "#fee6b6"], side: ["#fcda9a", "#f5cb7f"] },
  pink: { top: ["#fbe9ef", "#f6d6e1"], side: ["#efc3d2", "#e8a9bd"] },
} as const;

export type BlockColor = keyof typeof BLOCKS;

export const TONES = {
  plain: "#fbf6ef",
  violet: "#e7ddf5",
  green: "#d8ecc6",
  orange: "#fcdcbd",
  yellow: "#fee7b8",
  blue: "#d6e5f6",
  muted: "#ece5da",
} as const;

export const PACKETS = {
  request: { fill: "#f6b98a", glow: "#f3a46a" },
  response: { fill: "#a6d38b", glow: "#7fc278" },
  empty: { fill: "#fbf6ef", glow: "#d8cbb8" },
  message: { fill: "#f6cd82", glow: "#f3b447" },
  secure: { fill: "#c9b8e5", glow: "#a58ad6" },
  heartbeat: { fill: "#f4fbf0", glow: "#9fd68f" },
} as const;
