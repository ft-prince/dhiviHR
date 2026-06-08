/**
 * Trial assessment scoring.
 *
 * 6 questions, each answered 1–5 (Never → Always).
 * Total score = sum of all answers. Minimum 6, maximum 30.
 * The total maps to one of four readiness bands.
 */

export type TrialLevel =
  | "learner"
  | "practitioner"
  | "accelerator"
  | "corporate_license_ready";

export interface TrialBand {
  level: TrialLevel;
  label: string;
  subHeading: string;
  min: number;
  max: number;
}

export const TRIAL_ANSWER_MIN = 1;
export const TRIAL_ANSWER_MAX = 5;
export const TRIAL_MIN_SCORE = 6;
export const TRIAL_MAX_SCORE = 30;

export const TRIAL_BANDS: readonly TrialBand[] = [
  {
    level: "learner",
    label: "Learner",
    min: 6,
    max: 14,
    subHeading:
      "You're at the start of something real. The skills are not there yet — but you showed up, which most people your age never do. The full CRAFTe test builds your personal roadmap so you stop guessing and start moving.",
  },
  {
    level: "practitioner",
    label: "Practitioner",
    min: 15,
    max: 20,
    subHeading:
      "You've got ability — it's just not showing up consistently yet. One thing is quietly holding you back. The full CRAFTe test finds it, names it, and tells you how to fix it.",
  },
  {
    level: "accelerator",
    label: "Accelerator",
    min: 21,
    max: 25,
    subHeading:
      "You're the person people notice — almost. You're one or two blind spots away from being genuinely exceptional. The full CRAFTe test names them so you stop being almost and start being undeniable.",
  },
  {
    level: "corporate_license_ready",
    label: "Corporate License Ready",
    min: 26,
    max: 30,
    subHeading:
      "Top score — but this was the easy version. Six questions, self-rated, no pressure. If you are genuinely Future Ready, prove it. The full test validates your status and shows where your real edge is.",
  },
] as const;

/** Clamp an arbitrary total into the valid range and return its band. */
export function bandForTrialScore(total: number): TrialBand {
  const clamped = Math.max(TRIAL_MIN_SCORE, Math.min(TRIAL_MAX_SCORE, Math.round(total)));
  return (
    TRIAL_BANDS.find((b) => clamped >= b.min && clamped <= b.max) ?? TRIAL_BANDS[0]
  );
}
