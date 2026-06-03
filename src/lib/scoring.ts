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
  track: string;
}

export const COMPETENCY_LABELS: Record<string, string> = {
  "critical_gap": "Critical Gap",
  "development_gap": "Development Gap",
  "strength": "Strength",
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

    // Classification mapping for competencies
    let gap: CompetencyGap = "critical_gap";
    if (average >= 3.25) {
      gap = "strength";
    } else if (average >= 1.75) {
      gap = "development_gap";
    }

    breakdown[comp] = { average, gap };
  }

  // 2. Calculate Overall Average 
  // Sum of average scores of all competencies divided by number of competencies
  const totalCompetencyAverages = Object.values(breakdown).reduce((sum, c) => sum + c.average, 0);
  const overallAverage = comps.length > 0 ? +(totalCompetencyAverages / comps.length).toFixed(2) : 0;

  // 3. Classify Overall Readiness Tier
  let level: ReadinessTier = "learner";
  let levelLabel = "Learner";

  if (overallAverage >= 3.50) {
    level = "future_ready";
    levelLabel = "Future Ready";
  } else if (overallAverage >= 2.75) {
    level = "accelerator";
    levelLabel = "Accelerator";
  } else if (overallAverage >= 2.00) {
    level = "practitioner";
    levelLabel = "Practitioner";
  } else {
    level = "learner";
    levelLabel = "Learner";
  }

  return {
    total: overallAverage, // This represents your overall average score (e.g., 3.12)
    competencyBreakdown: breakdown,
    level,
    levelLabel,
    track: "default", // Adapt or map this to whatever your layout expects for 'track'
  };
}