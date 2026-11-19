import type { LessonContent } from "@/components/scene/types";

/**
 * Lessons that have a finished animated scene. Each entry loads lazily so a
 * lesson's content ships only with its own page. Add new lessons here by slug.
 */
const registry: Record<string, () => Promise<{ default: LessonContent }>> = {
  "what-happens-when-you-press-enter": () => import("./what-happens-when-you-press-enter"),
};

export function hasContent(slug: string): boolean {
  return slug in registry;
}

export async function loadLesson(slug: string): Promise<LessonContent | null> {
  const load = registry[slug];
  return load ? (await load()).default : null;
}

export const builtSlugs = Object.keys(registry);
