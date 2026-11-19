import type { BlockColor } from "@/components/scene/palette";
import type { Entity, LinkDef, SceneDef, TokenRowDef, XY } from "@/components/scene/types";

/**
 * Shared scene layouts for lessons. Each returns a SceneDef with named points,
 * so lessons only describe what happens, not where things sit.
 */

/** Client (laptop or phone) → server → database, left to right. */
export function clientServerDb(opts: {
  client?: "laptop" | "phone";
  clientName?: string;
  server?: string[];
  serverName?: string;
  serverColor?: BlockColor;
  dbName?: string;
  noDb?: boolean;
  extra?: Entity[];
  points?: Record<string, XY>;
}): SceneDef {
  const client: Entity[] =
    opts.client === "phone"
      ? [
          { id: "clientSlab", kind: "slab", at: [-350, 212], w: 80, h: 12, name: opts.clientName ?? "app", nameIcon: "user" },
          { id: "client", kind: "phone", at: [-350, 200] },
        ]
      : [
          { id: "desk", kind: "slab", at: [-350, 222], w: 110, h: 14, name: opts.clientName ?? "client", nameIcon: "user" },
          { id: "client", kind: "laptop", at: [-350, 208] },
        ];
  return {
    viewBox: [-500, -235, 1000, 570],
    entities: [
      ...client,
      {
        id: "server",
        kind: "box",
        at: [60, 70],
        w: 86,
        h: 104,
        color: opts.serverColor ?? "blue",
        text: opts.server ?? ["API", "server"],
        textSize: 18,
        name: opts.serverName ?? "api.example",
        nameIcon: "globe",
      },
      ...(opts.noDb ? [] : [{ id: "db", kind: "cylinder" as const, at: [330, 150] as XY, rx: 48, h: 66, color: "yellow" as const, name: opts.dbName ?? "database", nameIcon: "db" as const }]),
      ...(opts.extra ?? []),
    ],
    points: {
      cli: opts.client === "phone" ? [-322, 155] : [-268, 160],
      srvL: [-6, 40],
      srvR: [126, 40],
      db: [290, 110],
      cliLabel: [-370, 40],
      srvLabel: [60, -140],
      dbLabel: [250, 8],
      dbRows: [436, -52],
      wire: [-150, -40],
      note: [-130, 280],
      ...(opts.points ?? {}),
    },
  };
}

export const csLinks = (style: LinkDef["style"] = "muted"): LinkDef[] => [
  { from: "cli", to: "srvL", style, both: style !== "pipe" },
  { from: "srvR", to: "db", style, both: style !== "pipe" },
];
export const cliLink = (style: LinkDef["style"] = "muted"): LinkDef[] => [{ from: "cli", to: "srvL", style, both: style !== "pipe" }];

/** A vertical stack of database rows, read top to bottom from `at`. */
export function rows(
  tags: string[],
  opts: { at?: string; from?: (i: number) => number | undefined; until?: (i: number) => number | undefined } = {},
): TokenRowDef {
  return {
    at: opts.at ?? "dbRows",
    gap: [0, 21],
    items: tags.map((tag, i) => ({ kind: "row" as const, tag, from: opts.from?.(i), until: opts.until?.(i) })),
  };
}
