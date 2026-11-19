"use client";

import { useCallback, useEffect, useState } from "react";
import { Scene, stepDuration } from "@/components/scene/Scene";
import type { LessonContent } from "@/components/scene/types";
import { TimingBar } from "./TimingBar";
import { useSceneClock } from "./useSceneClock";

export function LessonPlayer({ lesson, title }: { lesson: LessonContent; title: string }) {
  const steps = lesson.steps;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [autoplay, setAutoplay] = useState(true);
  const [replays, setReplays] = useState(0);
  const step = steps[index];
  const last = index === steps.length - 1;
  const duration = stepDuration(step);

  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) setAutoplay(false);
  }, []);

  const go = useCallback((i: number) => {
    setIndex(Math.max(0, Math.min(steps.length - 1, i)));
    setReplays((r) => r + 1);
  }, [steps.length]);

  const onEnd = useCallback(() => {
    if (autoplay && !last) go(index + 1);
    else setReplays((r) => r + 1); // loop the current step
  }, [autoplay, last, index, go]);

  const { svgRef, progress } = useSceneClock({ stepKey: `${index}-${replays}`, duration, paused, onEnd });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("input, textarea, select, [contenteditable]")) return;
      if (e.key === "ArrowRight") go(index + 1);
      else if (e.key === "ArrowLeft") go(index - 1);
      else if (e.key === " " && !t.closest("button")) {
        e.preventDefault();
        setPaused((p) => !p);
      } else if (e.key === "r" || e.key === "R") {
        setPaused(false);
        setReplays((r) => r + 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, go]);

  return (
    <section className="player">
      <div className="player-stage card">
        <div className="player-top">
          <div className="player-progress" aria-hidden="true">
            <span style={{ width: `${progress * 100}%` }} />
          </div>
          <div className="player-ctrls">
            <button className="btn" onClick={() => { setPaused(false); setReplays((r) => r + 1); }}>
              <ReplayIcon /> Replay
            </button>
            <button className="btn" onClick={() => setPaused((p) => !p)} aria-pressed={paused}>
              {paused ? <PlayIcon /> : <PauseIcon />} {paused ? "Play" : "Pause"}
            </button>
            <label className="toggle">
              <input type="checkbox" id="autoplay" checked={autoplay} onChange={(e) => setAutoplay(e.target.checked)} />
              <span>Auto-advance</span>
            </label>
          </div>
        </div>
        <div className="scene-wrap">
          <Scene key={`${index}-${replays}`} scene={lesson.scene} step={step} label={`${title}, step ${index + 1}: ${step.title}`} svgRef={svgRef} className="scene" />
        </div>
        {lesson.phases && <TimingBar phases={lesson.phases} timing={step.timing} />}
        <ol className="stepper" aria-label="Steps">
          {steps.map((s, i) => (
            <li key={i}>
              <button
                className={i === index ? "is-now" : i < index ? "is-done" : ""}
                onClick={() => go(i)}
                aria-current={i === index ? "step" : undefined}
                title={s.title}
              >
                <span className="stepper-num">{i + 1}</span>
                <span className="stepper-title">{s.title}</span>
              </button>
            </li>
          ))}
        </ol>
      </div>

      <aside className="player-narr card" aria-live="polite">
        <div className="narr-top">
          <span className="eyebrow">
            Step {index + 1} / {steps.length}
          </span>
          {last && <span className="tag tag-green">Recap</span>}
        </div>
        <div className="narr-text" key={index}>
          <h2>{step.title}</h2>
          <p>{step.body}</p>
        </div>
        {step.note && (
          <div className="key-idea">
            <span className="key-ico" aria-hidden="true">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3Z" />
              </svg>
            </span>
            <div>
              <small>GOOD TO KNOW</small>
              <p>{step.note}</p>
            </div>
          </div>
        )}
        <div className="narr-nav">
          <button className="btn" onClick={() => go(index - 1)} disabled={index === 0}>
            ← Back
          </button>
          <button className="btn btn-primary" onClick={() => go(index + 1)} disabled={last}>
            {last ? "Finished" : `Next: ${steps[index + 1].title}`} {!last && "→"}
          </button>
        </div>
        <p className="kbd-hint">
          <kbd>←</kbd> <kbd>→</kbd> step · <kbd>Space</kbd> pause · <kbd>R</kbd> replay
        </p>
      </aside>
    </section>
  );
}

function ReplayIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  );
}
function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <rect x="6" y="5" width="4" height="14" rx="1" />
      <rect x="14" y="5" width="4" height="14" rx="1" />
    </svg>
  );
}
function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M7 4.5v15l12-7.5z" />
    </svg>
  );
}
