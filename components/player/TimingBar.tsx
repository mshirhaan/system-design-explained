import type { Phase, StepDef } from "@/components/scene/types";

export function TimingBar({ phases, timing }: { phases: Phase[]; timing?: StepDef["timing"] }) {
  const done = new Set(timing?.done ?? []);
  const total = phases.reduce((a, p) => a + p.ms, 0);
  const elapsed = phases.filter((p) => done.has(p.id)).reduce((a, p) => a + p.ms, 0);
  return (
    <div className="timing" aria-label={`Time so far: ${elapsed} milliseconds of about ${total}`}>
      <div className="timing-head">
        <span className="eyebrow">Where the time goes</span>
        <span className="timing-total">
          <b>{elapsed}</b> ms
        </span>
      </div>
      <div className="timing-bar">
        {phases.map((p) => {
          const state = done.has(p.id) ? "done" : timing?.active === p.id ? "active" : "todo";
          return (
            <div
              key={p.id}
              className={`timing-seg timing-${state}`}
              style={{ flexGrow: p.ms, ["--seg" as string]: p.color }}
              title={`${p.label}: ${p.ms} ms`}
            >
              <span className="timing-label">{p.label}</span>
              <span className="timing-ms">{state === "todo" ? "·" : `${p.ms} ms`}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
