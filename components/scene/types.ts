import type { BlockColor } from "./palette";
import type { IconName } from "./icons";

/** Screen coordinates inside the scene's viewBox. */
export type XY = [number, number];

interface EntityBase {
  id: string;
  /** Base footprint centre, in screen coordinates. */
  at: XY;
  /** Name pill drawn under the object. */
  name?: string;
  nameIcon?: IconName;
  /** Where the name pill sits, relative to `at`. Defaults to below the object. */
  nameOffset?: XY;
}

export type Entity =
  | (EntityBase & { kind: "slab"; w: number; d?: number; h?: number; color?: BlockColor })
  | (EntityBase & {
      kind: "box";
      w: number;
      d?: number;
      h: number;
      color: BlockColor;
      icon?: IconName;
      text?: string[];
      textSize?: number;
    })
  | (EntityBase & { kind: "cylinder"; rx: number; h: number; color: BlockColor; text?: string[] })
  | (EntityBase & { kind: "laptop" })
  | (EntityBase & { kind: "phone" })
  | (EntityBase & { kind: "router" });

export type PacketKind = "request" | "response" | "empty" | "message" | "secure" | "heartbeat";

export interface PacketDef {
  /** Point names from the scene's `points` map. The packet hops through each one. */
  path: string[];
  kind: PacketKind;
  /** Start time in seconds from the start of the step. */
  at: number;
  /** Travel time in seconds. */
  dur?: number;
  /** Small tag that rides with the packet. */
  tag?: string;
  /** The packet is dropped partway along its path (0–1, default 0.55) and vanishes with a red cross. */
  lost?: boolean | number;
}

/** A row of packets sitting still at a point, such as a queue or a buffer. */
export interface TokenRowDef {
  at: string | XY;
  /** Offset between items. Defaults to a step along the floor to the right. */
  gap?: XY;
  items: { kind: PacketKind; tag?: string; from?: number; until?: number }[];
}

export interface LabelDef {
  /** A point name or explicit coordinates. */
  at: string | XY;
  text: string;
  icon?: IconName;
  tone?: "plain" | "violet" | "green" | "orange" | "yellow" | "blue" | "muted";
  size?: number;
  /** Appear time in seconds. */
  from?: number;
  /** Disappear time in seconds. Omit to stay for the rest of the step. */
  until?: number;
}

export interface LinkDef {
  from: string;
  to: string;
  style?: "solid" | "muted" | "dashed" | "pipe";
  /** Appear time in seconds. */
  from_t?: number;
  /** Draw arrowheads at both ends. */
  both?: boolean;
}

export type ScreenState = "blank" | "loading" | "page" | "page-partial";

export interface StepDef {
  title: string;
  body: string;
  /** Optional extra idea shown in the side panel. */
  note?: string;
  links?: LinkDef[];
  packets?: PacketDef[];
  tokens?: TokenRowDef[];
  labels?: LabelDef[];
  /** Entities that get a pulsing ring this step. */
  focus?: string[];
  /** What the laptop or phone screen shows. */
  screen?: ScreenState;
  /** Timing bar: phases finished and the one in progress. */
  timing?: { done: string[]; active?: string };
  /** Extra seconds to hold the final frame before looping or moving on. */
  hold?: number;
}

export interface Phase {
  id: string;
  label: string;
  ms: number;
  color: string;
}

export interface SceneDef {
  viewBox: [number, number, number, number];
  entities: Entity[];
  points: Record<string, XY>;
}

export interface QuizQuestion {
  q: string;
  options: string[];
  answer: number;
  explain: string;
}

export interface ArticleSection {
  heading: string;
  paragraphs: string[];
}

export interface LessonContent {
  slug: string;
  intro: string;
  learn: string[];
  keyIdea: string;
  scene: SceneDef;
  phases?: Phase[];
  steps: StepDef[];
  /** A looping step used as a preview, for example on the home page. */
  preview?: StepDef;
  quiz: QuizQuestion[];
  article: ArticleSection[];
}
