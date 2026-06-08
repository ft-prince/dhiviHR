import { describe, it, expect } from "vitest";
import {
  scoreAssessment,
  gapForAverage,
  tierForAverage,
  type ScoredResponse,
} from "@/lib/scoring";

/** Build `count` responses for one competency, all at the given weight. */
function comp(competency: string, weight: number, count = 4): ScoredResponse[] {
  return Array.from({ length: count }, () => ({ competency, weight, max: 5 }));
}

describe("gapForAverage (per-competency classification)", () => {
  it.each<[number, string]>([
    [5.0, "strength"],
    [3.7, "strength"],
    [3.69, "development_gap"],
    [2.5, "development_gap"],
    [2.49, "critical_gap"],
    [1.0, "critical_gap"],
  ])("avg %d -> %s", (avg, gap) => {
    expect(gapForAverage(avg)).toBe(gap);
  });
});

describe("tierForAverage (overall readiness tier)", () => {
  it.each<[number, string]>([
    [4.0, "future_ready"],
    [3.75, "future_ready"],
    [3.74, "accelerator"],
    [3.26, "accelerator"],
    [3.25, "practitioner"],
    [2.51, "practitioner"],
    [2.5, "learner"],
    [1.0, "learner"],
  ])("avg %d -> %s", (avg, level) => {
    expect(tierForAverage(avg).level).toBe(level);
  });
});

describe("scoreAssessment", () => {
  it("returns an empty breakdown and Learner tier for no responses", () => {
    const r = scoreAssessment([]);
    expect(r.total).toBe(0);
    expect(r.level).toBe("learner");
    expect(r.competencyBreakdown).toEqual({});
  });

  it("averages each competency and classifies its gap", () => {
    const r = scoreAssessment([
      ...comp("business_acumen", 5),   // avg 5.0  -> strength
      ...comp("resilience", 3),        // avg 3.0  -> development_gap
      ...comp("ai_awareness", 1),      // avg 1.0  -> critical_gap
    ]);
    expect(r.competencyBreakdown["business_acumen"]).toEqual({ average: 5, gap: "strength" });
    expect(r.competencyBreakdown["resilience"]).toEqual({ average: 3, gap: "development_gap" });
    expect(r.competencyBreakdown["ai_awareness"]).toEqual({ average: 1, gap: "critical_gap" });
  });

  it("derives the overall tier from the mean of competency averages", () => {
    // averages: 5, 3, 1 -> overall (5+3+1)/3 = 3.0 -> practitioner
    const r = scoreAssessment([
      ...comp("a", 5),
      ...comp("b", 3),
      ...comp("c", 1),
    ]);
    expect(r.total).toBe(3);
    expect(r.level).toBe("practitioner");
    expect(r.levelLabel).toBe("Practitioner");
    expect(r.subHeading).toContain("The ability is real");
  });

  it("classifies a top performer as Future Ready", () => {
    const r = scoreAssessment([...comp("a", 4), ...comp("b", 4)]);
    expect(r.total).toBe(4);
    expect(r.level).toBe("future_ready");
  });
});
