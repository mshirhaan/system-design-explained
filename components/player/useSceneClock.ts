"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

/**
 * Drives one step of an SVG scene. Restarts the SVG timeline when `stepKey`
 * changes, pauses and resumes it, and calls `onEnd` once the step's duration
 * has played. Returns the progress through the step, from 0 to 1.
 */
export function useSceneClock({
  stepKey,
  duration,
  paused,
  onEnd,
}: {
  stepKey: string | number;
  duration: number;
  paused: boolean;
  onEnd: () => void;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [progress, setProgress] = useState(0);
  const onEndRef = useRef(onEnd);
  onEndRef.current = onEnd;

  // Restart the timeline for every new step (or replay).
  useLayoutEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    svg.setCurrentTime(0);
    if (paused) svg.pauseAnimations();
    else svg.unpauseAnimations();
    setProgress(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepKey]);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    if (paused) svg.pauseAnimations();
    else svg.unpauseAnimations();
  }, [paused]);

  useEffect(() => {
    let raf = 0;
    let fired = false;
    const tick = () => {
      const svg = svgRef.current;
      if (svg) {
        const t = svg.getCurrentTime();
        setProgress(Math.min(1, t / duration));
        if (t >= duration && !fired) {
          fired = true;
          onEndRef.current();
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [stepKey, duration]);

  const restart = () => {
    const svg = svgRef.current;
    if (!svg) return;
    svg.setCurrentTime(0);
  };

  return { svgRef, progress, restart };
}
