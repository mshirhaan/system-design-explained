/**
 * Checks every built lesson against the quality bar in CLAUDE.md.
 * Run: npm run check:lessons            (all lessons)
 *      npm run check:lessons -- <slug>  (one lesson)
 */
import { builtSlugs, loadLesson } from "../content/lessons";
import { stepDuration } from "../components/scene/Scene";
import type { LessonContent, StepDef } from "../components/scene/types";

const sentences = (t: string) => t.split(/(?<=[.!?])\s+(?=[A-Z0-9"“(])/).filter((x) => x.trim().length > 0).length;
const words = (t: string) => t.split(/\s+/).filter(Boolean).length;

function maxLabelsAtOnce(step: StepDef): number {
  const end = stepDuration(step);
  const spans = (step.labels ?? []).map((l) => [l.from ?? 0, l.until ?? end] as const);
  let max = 0;
  for (let t = 0; t <= end; t += 0.1) max = Math.max(max, spans.filter(([a, b]) => t >= a && t < b).length);
  return max;
}

/** Same maths as the Pill component: monospace width plus padding and icon. */
function labelBox(text: string, size: number, icon: boolean) {
  const lines = text.split("\n");
  const w = Math.max(...lines.map((x) => x.length)) * size * 0.6 + size * 1.6 + (icon ? size * 1.45 : 0);
  const h = lines.length * size * 1.32 + size * 0.84;
  return { w, h };
}

function check(l: LessonContent): string[] {
  const p: string[] = [];
  const [vx, vy, vw, vh] = l.scene.viewBox;
  if (l.steps.length < 7 || l.steps.length > 10) p.push(`has ${l.steps.length} steps (need 7–10)`);
  l.steps.forEach((s, i) => {
    const n = sentences(s.body);
    if (n < 3 || n > 6) p.push(`step ${i + 1} "${s.title}": ${n} sentences (need 3–5)`);
    const max = maxLabelsAtOnce(s);
    if (max > 3) p.push(`step ${i + 1}: ${max} labels visible at once (max 3)`);
    for (const lab of s.labels ?? []) {
      if (/\s=\s|\s·\s|→/.test(lab.text)) p.push(`step ${i + 1}: label "${lab.text}" uses shorthand (=, ·, →)`);
      if (lab.text.length > 48) p.push(`step ${i + 1}: label "${lab.text}" is long (${lab.text.length} chars)`);
      const at = Array.isArray(lab.at) ? lab.at : l.scene.points[lab.at];
      if (!at) { p.push(`step ${i + 1}: label point "${lab.at}" doesn't exist`); continue; }
      const { w, h } = labelBox(lab.text, lab.size ?? 15, !!lab.icon);
      if (at[0] - w / 2 < vx + 4 || at[0] + w / 2 > vx + vw - 4 || at[1] - h / 2 < vy + 2 || at[1] + h / 2 > vy + vh - 2)
        p.push(`step ${i + 1}: label "${lab.text}" is cut off at the edge of the scene`);
    }
  });
  const art = l.article.flatMap((s) => [s.heading, ...s.paragraphs]).join(" ");
  const w = words(art);
  if (l.article.length < 6 || l.article.length > 9) p.push(`article has ${l.article.length} sections (need 6–9)`);
  if (w < 900 || w > 1600) p.push(`article is ${w} words (need ~900–1,500)`);
  if (l.quiz.length < 4 || l.quiz.length > 5) p.push(`quiz has ${l.quiz.length} questions (need 4–5)`);
  const t = l.terms?.length ?? 0;
  if (t < 4 || t > 8) p.push(`has ${t} key terms (need 4–8)`);
  return p;
}

(async () => {
  const only = process.argv[2];
  let failed = 0;
  for (const slug of builtSlugs.filter((s) => !only || s === only)) {
    const l = await loadLesson(slug);
    if (!l) continue;
    const problems = check(l);
    const w = words(l.article.flatMap((s) => [s.heading, ...s.paragraphs]).join(" "));
    console.log(`${problems.length ? "✗" : "✓"} ${slug}  (${l.steps.length} steps, ${w} words)`);
    problems.forEach((x) => console.log(`    - ${x}`));
    if (problems.length) failed++;
  }
  console.log(failed ? `\n${failed} lesson(s) below the quality bar.` : "\nAll lessons meet the quality bar.");
  process.exitCode = failed ? 1 : 0;
})();
