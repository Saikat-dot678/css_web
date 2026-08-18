"use client";

import type { IntroPhase } from "./useIntroTimeline";
import styles from "./experience.module.css";

const phaseCopy: Record<IntroPhase, [string, string]> = {
  PRELOAD: ["SYSTEM / 00", "SIGNAL STANDBY"],
  POINT: ["ORIGIN / 01", "SIGNAL ACQUIRED"],
  ASSEMBLE: ["DEVICE / 02", "TERMINAL RESOLVING"],
  OPEN: ["DEVICE / 03", "DISPLAY HINGE ACTIVE"],
  BOOT: ["SYSTEM / 04", "CAMPUS LINK INITIALISING"],
  MAP_READY: ["MAP / 05", "CAMPUS LINK READY"],
  ROUTE: ["ROUTE / 06", "MAIN GATE → CSE"],
  TAKEOVER: ["CSE / 07", "STUDENT LAYER ONLINE"],
  COMPLETE: ["CSS / 08", "DEPARTMENT INTERFACE"],
};

export function IntroHUD({ onSkip, phase, skipVisible }: { onSkip: () => void; phase: IntroPhase; skipVisible: boolean }) {
  const [index, status] = phaseCopy[phase];
  const automatic = phase === "POINT" || phase === "ASSEMBLE" || phase === "OPEN" || phase === "BOOT";
  return (
    <div className={styles.hud} aria-live="polite">
      <div className={styles.hudStatus}><span>{index}</span><strong>{status}</strong></div>
      {skipVisible && automatic && <button type="button" className={styles.skipButton} onClick={onSkip}>Skip intro <span>→</span></button>}
      {(phase === "MAP_READY" || phase === "ROUTE") && (
        <div className={styles.scrollInstruction} aria-hidden="true">
          <span>
            <svg className={styles.scrollIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M19 12l-7 7-7-7" />
            </svg>
            SCROLL TO ENTER CAMPUS
          </span>
          <i />
        </div>
      )}
    </div>
  );
}
