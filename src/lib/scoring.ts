import { bandFromScore, type ReadinessLevel } from "./utils";

export const COMPETENCIES = [
  "communication_confidence",
  "problem_solving",
  "teamwork_leadership",
  "initiative_growth",
  "interview_readiness",
] as const;

export type Competency = (typeof COMPETENCIES)[number];

export const COMPETENCY_LABELS: Record<Competency, string> = {
  communication_confidence: "Communication & Confidence",
  problem_solving: "Problem Solving Ability",
  teamwork_leadership: "Teamwork & Leadership",
  initiative_growth: "Initiative & Growth Mindset",
  interview_readiness: "Interview Readiness",
};

export const COMPETENCY_WEIGHT = 20;

export interface ScoredResponse {
  competency: Competency;
  /** Raw option weight 0..4 */
  weight: number;
  /** Max possible weight on that question (usually 4) */
  max: number;
}

export interface AssessmentScore {
  total: number;
  competencyBreakdown: Record<Competency, number>;
  level: ReadinessLevel;
  levelLabel: string;
  track: string;
}

/**
 * Pure scoring function.
 * Each competency contributes COMPETENCY_WEIGHT (20). For each competency,
 * we sum option weights / sum of max-weights and multiply by 20.
 * If a competency has no responses, it contributes 0.
 */
export function scoreAssessment(responses: ScoredResponse[]): AssessmentScore {
  const breakdown = Object.fromEntries(
    COMPETENCIES.map((c) => [c, 0]),
  ) as Record<Competency, number>;

  for (const competency of COMPETENCIES) {
    const items = responses.filter((r) => r.competency === competency);
    if (items.length === 0) continue;
    const sum = items.reduce((s, r) => s + r.weight, 0);
    const max = items.reduce((s, r) => s + r.max, 0);
    if (max === 0) continue;
    breakdown[competency] = +((sum / max) * COMPETENCY_WEIGHT).toFixed(2);
  }

  const total = +Object.values(breakdown).reduce((a, b) => a + b, 0).toFixed(2);
  const band = bandFromScore(total);

  return {
    total,
    competencyBreakdown: breakdown,
    level: band.level,
    levelLabel: band.label,
    track: band.track,
  };
}
