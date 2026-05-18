import { bandFromScore, type ReadinessLevel } from "./utils";

// ── Static fallbacks (used until the DB has competency rows) ─────────────────

export const COMPETENCIES = [
  "communication_confidence",
  "problem_solving",
  "teamwork_leadership",
  "initiative_growth",
  "interview_readiness",
] as const;

export type Competency = (typeof COMPETENCIES)[number];

export const COMPETENCY_LABELS: Record<string, string> = {
  communication_confidence: "Communication & Confidence",
  problem_solving: "Problem Solving Ability",
  teamwork_leadership: "Teamwork & Leadership",
  initiative_growth: "Initiative & Growth Mindset",
  interview_readiness: "Interview Readiness",
};

export interface ScoredResponse {
  /** Now a plain string — any slug from the competencies table */
  competency: string;
  weight: number;
  max: number;
}

export interface AssessmentScore {
  total: number;
  competencyBreakdown: Record<string, number>;
  level: ReadinessLevel;
  levelLabel: string;
  track: string;
}

/**
 * Generic scoring — groups responses by whatever competency slugs appear.
 * Each competency contributes proportionally to 100 total points.
 * Pass `competencyWeights` (slug → point allocation) for custom weighting;
 * otherwise each competency gets an equal share of 100.
 */
export function scoreAssessment(
  responses: ScoredResponse[],
  competencyWeights?: Record<string, number>,
): AssessmentScore {
  const seen = Array.from(new Set(responses.map((r) => r.competency)));
  const slugs = seen.length > 0 ? seen : [...COMPETENCIES];

  // Build weight map: provided overrides, or equal share of 100
  const totalWeight = competencyWeights
    ? Object.values(competencyWeights).reduce((a, b) => a + b, 0)
    : 100;
  const perComp = (slug: string) =>
    competencyWeights ? (competencyWeights[slug] ?? 0) : +(100 / slugs.length).toFixed(4);

  const breakdown: Record<string, number> = {};
  for (const slug of slugs) {
    const items = responses.filter((r) => r.competency === slug);
    if (items.length === 0) { breakdown[slug] = 0; continue; }
    const sum = items.reduce((s, r) => s + r.weight, 0);
    const max = items.reduce((s, r) => s + r.max, 0);
    breakdown[slug] = max === 0 ? 0 : +((sum / max) * perComp(slug)).toFixed(2);
  }

  const raw = Object.values(breakdown).reduce((a, b) => a + b, 0);
  // Normalise to 100 if weights didn't sum to 100
  const total = totalWeight > 0 ? +((raw / totalWeight) * 100).toFixed(2) : raw;
  const band = bandFromScore(total);

  return {
    total: Math.round(total),
    competencyBreakdown: breakdown,
    level: band.level,
    levelLabel: band.label,
    track: band.track,
  };
}
