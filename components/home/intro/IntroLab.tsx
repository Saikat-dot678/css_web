"use client";

import { useState } from "react";

import { CampusNightMap } from "./CampusNightMap";
import { GravityCore } from "./GravityCore";
import { IntroExperience } from "./IntroExperience";
import { ParticleSpiral } from "./ParticleSpiral";
import styles from "./intro.module.css";

type IntroLabProps = {
  clean?: boolean;
  initialProgress?: number;
  initialScene?: "experience" | "gravity" | "map" | "route" | "spiral";
};

const checkpoints = [
  ["CORE", 0.04],
  ["COLLAPSE", 0.18],
  ["ARMS", 0.56],
  ["PLANE", 0.94],
] as const;

const routeCheckpoints = [
  ["GATE", 0],
  ["25%", 0.28],
  ["60%", 0.6],
  ["CSE", 1],
] as const;

export function IntroLab({ clean = false, initialProgress, initialScene = "gravity" }: IntroLabProps) {
  const [scene, setScene] = useState<"experience" | "gravity" | "map" | "route" | "spiral">(initialScene);
  const [manualProgress, setManualProgress] = useState<number | undefined>(initialProgress);
  const [spiralKey, setSpiralKey] = useState(0);

  const replaySpiral = () => {
    setScene("spiral");
    setManualProgress(undefined);
    setSpiralKey((value) => value + 1);
  };

  return (
    <main className={styles.lab} data-intro-lab>
      {scene === "experience" ? (
        <IntroExperience academicYear="2026–27" memberCount={36} nextEvent="BUILD NIGHT" />
      ) : scene === "gravity" ? (
        <GravityCore />
      ) : scene === "spiral" ? (
        <ParticleSpiral key={spiralKey} progress={manualProgress} />
      ) : (
        <CampusNightMap
          revealProgress={scene === "map" ? (manualProgress ?? 1) : 1}
          routeProgress={scene === "route" ? (manualProgress ?? 0.6) : 0}
          focusProgress={scene === "route" ? Math.max(0, ((manualProgress ?? 0.6) - 0.78) / 0.22) : 0}
        />
      )}

      {!clean && (
        <aside className={styles.labControls} aria-label="Intro component preview controls">
          <div className={styles.labSceneTabs}>
            <button type="button" className={scene === "gravity" ? styles.controlActive : ""} onClick={() => setScene("gravity")}>
              01 / GRAVITY
            </button>
            <button type="button" className={scene === "spiral" ? styles.controlActive : ""} onClick={() => setScene("spiral")}>
              02 / SPIRAL
            </button>
            <button type="button" className={scene === "map" ? styles.controlActive : ""} onClick={() => setScene("map")}>
              03 / MAP
            </button>
            <button type="button" className={scene === "route" ? styles.controlActive : ""} onClick={() => setScene("route")}>
              04 / ROUTE
            </button>
            <button type="button" className={scene === "experience" ? styles.controlActive : ""} onClick={() => setScene("experience")}>
              05 / FULL
            </button>
          </div>

          {(scene === "spiral" || scene === "map" || scene === "route") && (
            <div className={styles.labTimeline}>
              {scene === "spiral" && <button type="button" onClick={replaySpiral}>REPLAY</button>}
              {(scene === "route" ? routeCheckpoints : checkpoints).map(([label, value]) => (
                <button
                  type="button"
                  className={manualProgress === value ? styles.controlActive : ""}
                  onClick={() => setManualProgress(value)}
                  key={label}
                >
                  {label}
                </button>
              ))}
              <label>
                <span>{manualProgress === undefined ? "AUTO" : `${Math.round(manualProgress * 100)}%`}</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={manualProgress ?? 0}
                  onChange={(event) => setManualProgress(Number(event.target.value))}
                  aria-label={`${scene} sequence progress`}
                />
              </label>
            </div>
          )}
        </aside>
      )}
    </main>
  );
}
