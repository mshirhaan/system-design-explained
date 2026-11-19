"use client";

import { useState } from "react";
import { Scene, stepDuration } from "@/components/scene/Scene";
import type { SceneDef, StepDef } from "@/components/scene/types";
import { useSceneClock } from "./useSceneClock";

/** A scene step that plays on a loop, with no controls. Used for previews. */
export function LoopingScene({ scene, step, label, className }: { scene: SceneDef; step: StepDef; label: string; className?: string }) {
  const [loop, setLoop] = useState(0);
  const { svgRef } = useSceneClock({
    stepKey: loop,
    duration: stepDuration(step, loop > 0),
    paused: false,
    onEnd: () => setLoop((n) => n + 1),
  });
  return <Scene key={loop} steady={loop > 0} scene={scene} step={step} label={label} svgRef={svgRef} className={className} />;
}
