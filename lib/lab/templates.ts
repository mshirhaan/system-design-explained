import { node } from "./challenges";
import type { Design } from "./model";

const e = (from: string, to: string) => ({ id: `t-${from}-${to}`, from, to });

export interface Template {
  id: string;
  title: string;
  text: string;
  design: Design;
}

/** Starting points for Free play. Each is a common, sensible architecture. */
export const TEMPLATES: Template[] = [
  {
    id: "blank",
    title: "Blank canvas",
    text: "Just users. Build everything yourself.",
    design: { nodes: [node("users", "users", 0, 2)], edges: [] },
  },
  {
    id: "classic",
    title: "Classic web app",
    text: "Load balancer, app servers, cache and database. The shape of most websites.",
    design: {
      nodes: [node("users", "users", 0, 2), node("lb", "lb", 2, 2), node("app", "app", 4, 2, { count: 4 }), node("cache", "cache", 6, 0), node("db", "db", 8, 2)],
      edges: [e("users", "lb"), e("lb", "app"), e("app", "cache"), e("cache", "db"), e("app", "db")],
      notes: [{ id: "n1", x: -60, y: -150, text: "Stateless app servers behind a load balancer. The cache answers most reads." }],
    },
  },
  {
    id: "read-heavy",
    title: "Read-heavy and global",
    text: "CDN for files, cache plus read replicas for data. Think news sites and online shops.",
    design: {
      nodes: [
        node("users", "users", 0, 2),
        node("cdn", "cdn", 2, 2),
        node("lb", "lb", 4, 2),
        node("app", "app", 6, 2, { count: 4, size: "m" }),
        node("cache", "cache", 8, 0, { count: 2 }),
        node("db", "db", 10, 2),
        node("rep", "replica", 10, 4, { count: 2 }),
      ],
      edges: [e("users", "cdn"), e("cdn", "lb"), e("lb", "app"), e("app", "cache"), e("cache", "db"), e("cache", "rep"), e("app", "db")],
    },
  },
  {
    id: "orders",
    title: "Orders with a queue",
    text: "Writes go through a queue so bursts never overwhelm the database.",
    design: {
      nodes: [
        node("users", "users", 0, 2),
        node("lb", "lb", 2, 2),
        node("app", "app", 4, 2, { count: 6, autoscale: { on: true, min: 4, max: 30 } }),
        node("cache", "cache", 6, 0),
        node("queue", "queue", 6, 4, { count: 2, size: "m" }),
        node("db", "db", 8, 2, { size: "m" }),
      ],
      edges: [e("users", "lb"), e("lb", "app"), e("app", "cache"), e("cache", "db"), e("app", "queue"), e("queue", "db")],
    },
  },
];
