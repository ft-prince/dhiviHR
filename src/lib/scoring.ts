export type CompetencyGap = "critical_gap" | "development_gap" | "strength";
export type ReadinessTier = "future_ready" | "accelerator" | "practitioner" | "learner";

export interface CompetencyDetail{
  average: number;
  gap: CompetencyGap;
}

export interface AssessmentScore{
  total: number;
  competencyBreakdown: Record<string, CompetencyDetail>;
  level: ReadinessTier;
  levelLabel: string;
  /** One-line message shown under the readiness tier on the report. */
  subHeading: string;
  track: string;
}

export const COMPETENCY_LABELS: Record<string, string> = {
  "critical_gap": "Critical Gap",
  "development_gap": "Development Gap",
  "strength": "Strength",
}

/* ─── Readiness tier classification (overall average, 1–5 scale) ───
   Thresholds per the CRAFTe spec:
     ≥ 3.75            → Future Ready
     3.26 – 3.75       → Accelerator
     2.51 – 3.25       → Practitioner
     below 2.5         → Learner                                      */
export interface TierInfo {
  level: ReadinessTier;
  label: string;
  subHeading: string;
  /** Minimum overall average (inclusive) that lands in this tier. */
  min: number;
}

export const READINESS_TIERS: readonly TierInfo[] = [
  { level: "future_ready", label: "Future Ready", min: 3.75, subHeading: "You've arrived. Your report is the evidence that backs every room you walk into." },
  { level: "accelerator", label: "Accelerator", min: 3.26, subHeading: "You're close to exceptional. Your report shows you exactly what's left." },
  { level: "practitioner", label: "Practitioner", min: 2.51, subHeading: "The ability is real. Your report tells you what's blocking it." },
  { level: "learner", label: "Learner", min: 0, subHeading: "You know where you want to go. Your report shows you exactly how to get there." },
] as const;

export function tierForAverage(overallAverage: number): TierInfo {
  return READINESS_TIERS.find((t) => overallAverage >= t.min) ?? READINESS_TIERS[READINESS_TIERS.length - 1];
}

/** Tier sub-heading message for a stored readiness level (e.g. "future_ready"). */
export function tierSubHeadingForLevel(level: string): string {
  return READINESS_TIERS.find((t) => t.level === level)?.subHeading ?? "";
}

/* ─── Per-competency gap classification (pillar average, 1–5 scale) ─
     ≥ 3.70            → Strength
     2.50 – 3.69       → Development gap
     below 2.50        → Critical gap                                 */
export function gapForAverage(average: number): CompetencyGap {
  if (average >= 3.70) return "strength";
  if (average >= 2.50) return "development_gap";
  return "critical_gap";
}


export interface ScoredResponse {
  /** Now a plain string — any slug from the competencies table */
  competency: string;
  weight: number;
  max: number;
}

/**
 * Generic scoring — groups responses by whatever competency slugs appear.
 * Each competency contributes proportionally to 100 total points.
 * Pass `competencyWeights` (slug → point allocation) for custom weighting;
 * otherwise each competency gets an equal share of 100.
 */
export function scoreAssessment(responses: ScoredResponse[]): AssessmentScore {
  const seen = Array.from(new Set(responses.map((r) => r.competency)));
  const comps = seen.length > 0 ? seen : "";

  const breakdown: Record<string, CompetencyDetail> = {};

  // 1. Calculate Average & Gap for each Competency
  for (const comp of comps) {
    const items = responses.filter((r) => r.competency === comp);
    
    if (items.length === 0) {
      breakdown[comp] = { average: 0, gap: "critical_gap" };
      continue;
    }

    const sum = items.reduce((s, r) => s + r.weight, 0);
    // Average = Total score for that assessment divided by total questions in that competency
    const average = +(sum / items.length).toFixed(2);

    breakdown[comp] = { average, gap: gapForAverage(average) };
  }

  // 2. Calculate Overall Average 
  // Sum of average scores of all competencies divided by number of competencies
  const totalCompetencyAverages = Object.values(breakdown).reduce((sum, c) => sum + c.average, 0);
  const overallAverage = comps.length > 0 ? +(totalCompetencyAverages / comps.length).toFixed(2) : 0;

  // 3. Classify Overall Readiness Tier
  const tier = tierForAverage(overallAverage);

  return {
    total: overallAverage, // This represents your overall average score (e.g., 3.12)
    competencyBreakdown: breakdown,
    level: tier.level,
    levelLabel: tier.label,
    subHeading: tier.subHeading,
    track: "default", // Adapt or map this to whatever your layout expects for 'track'
  };
}