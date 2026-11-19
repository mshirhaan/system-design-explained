import type { LessonContent } from "@/components/scene/types";

/**
 * Lessons that have a finished animated scene. Each entry loads lazily so a
 * lesson's content ships only with its own page. Add new lessons here by slug.
 */
const registry: Record<string, () => Promise<{ default: LessonContent }>> = {
  "what-happens-when-you-press-enter": () => import("./what-happens-when-you-press-enter"),
  "clients-servers-and-the-request-response-loop": () => import("./clients-servers-and-the-request-response-loop"),
  "ip-addresses-ports-and-packets": () => import("./ip-addresses-ports-and-packets"),
  "dns-from-the-inside": () => import("./dns-from-the-inside"),
  "tcp-reliable-delivery": () => import("./tcp-reliable-delivery"),
  "udp-and-when-to-skip-reliability": () => import("./udp-and-when-to-skip-reliability"),
  "tls-and-https": () => import("./tls-and-https"),
  "http-1-1-vs-http-2-vs-http-3": () => import("./http-1-1-vs-http-2-vs-http-3"),
  "latency-numbers-every-engineer-should-know": () => import("./latency-numbers-every-engineer-should-know"),
  "throughput-bandwidth-and-queues": () => import("./throughput-bandwidth-and-queues"),
  "proxies-and-reverse-proxies": () => import("./proxies-and-reverse-proxies"),
};

export function hasContent(slug: string): boolean {
  return slug in registry;
}

export async function loadLesson(slug: string): Promise<LessonContent | null> {
  const load = registry[slug];
  return load ? (await load()).default : null;
}

export const builtSlugs = Object.keys(registry);
