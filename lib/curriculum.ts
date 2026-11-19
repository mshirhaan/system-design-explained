import data from "@/content/curriculum.json";

export type Level = "beginner" | "intermediate" | "advanced";
export type Access = "free" | "pro";
export type TrackColor = "blue" | "purple" | "green" | "orange" | "yellow" | "pink";

export interface CurriculumLesson {
  id: string; // "1.1"
  title: string;
  level: Level;
  access: Access;
  animation: string;
}

export interface Lesson extends CurriculumLesson {
  slug: string;
  trackId: number;
  index: number; // position inside its track, from 0
}

export interface Track {
  id: number;
  stage: number;
  name: string;
  color: TrackColor;
  summary: string;
  checkpoint: string;
  lessons: Lesson[];
}

export interface Stage {
  id: number;
  name: string;
  subtitle: string;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const raw = data as unknown as {
  stages: Stage[];
  tracks: (Omit<Track, "lessons"> & { lessons: CurriculumLesson[] })[];
};

export const stages: Stage[] = raw.stages;

const usedSlugs = new Set<string>();
export const tracks: Track[] = raw.tracks.map((t) => ({
  ...t,
  color: t.color as TrackColor,
  lessons: t.lessons.map((l, index) => {
    let slug = slugify(l.title);
    if (usedSlugs.has(slug)) slug = `${slug}-${slugify(t.name)}`;
    usedSlugs.add(slug);
    return { ...l, slug, trackId: t.id, index };
  }),
}));

export const lessons: Lesson[] = tracks.flatMap((t) => t.lessons);

/** Course entries that are interactive labs rather than lessons, and where they live. */
const LAB_PAGES: Record<string, string> = {
  "design-sandbox": "/labs/sandbox",
  "scale-challenges": "/labs/sandbox",
};

/** The page a course entry links to: its lab if it has one, otherwise its lesson page. */
export function lessonHref(lesson: Pick<Lesson, "slug">): string {
  return LAB_PAGES[lesson.slug] ?? `/lessons/${lesson.slug}`;
}

export function labPage(slug: string): string | undefined {
  return LAB_PAGES[slug];
}

export function getLessonBySlug(slug: string): Lesson | undefined {
  return lessons.find((l) => l.slug === slug);
}

export function getTrack(id: number): Track {
  const t = tracks.find((x) => x.id === id);
  if (!t) throw new Error(`Unknown track ${id}`);
  return t;
}

export function getStage(id: number): Stage {
  const s = stages.find((x) => x.id === id);
  if (!s) throw new Error(`Unknown stage ${id}`);
  return s;
}

export function neighbours(lesson: Lesson): { prev?: Lesson; next?: Lesson } {
  const i = lessons.indexOf(lesson);
  return { prev: lessons[i - 1], next: lessons[i + 1] };
}

export const levelLabel: Record<Level, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export const stats = {
  tracks: tracks.length,
  lessons: lessons.length,
  free: lessons.filter((l) => l.access === "free").length,
  hours: Math.round((lessons.length * 12 + tracks.length * 30) / 60),
};
