import { describe, it, expect } from "vitest";
import { scoreAssessment, COMPETENCIES } from "@/lib/scoring";
import { bandFromScore, READINESS_BANDS } from "@/lib/utils";

function fullResponses(weightPerQ: number, max = 4, qPerComp = 5) {
  return COMPETENCIES.flatMap((c) =>
    Array.from({ length: qPerComp }).map(() => ({ competency: c, weight: weightPerQ, max })),
  );
}

describe("scoring", () => {
  it("returns 0 when no responses", () => {
    const r = scoreAssessment([]);
    expect(r.total).toBe(0);
    expect(r.level).toBe("emerging");
    Object.values(r.competencyBreakdown).forEach((v) => expect(v).toBe(0));
  });

  it("returns 100 when every option is full weight", () => {
    const r = scoreAssessment(fullResponses(4));
    expect(r.total).toBe(100);
    expect(r.level).toBe("high_impact");
    expect(r.track).toBe("Placement Excellence Track");
  });

  it("returns 50 when every option is half weight", () => {
    const r = scoreAssessment(fullResponses(2));
    expect(r.total).toBe(50);
    expect(r.level).toBe("developing");
  });

  it("caps competency contribution at 20", () => {
    const r = scoreAssessment(fullResponses(4));
    for (const c of COMPETENCIES) {
      expect(r.competencyBreakdown[c]).toBeLessThanOrEqual(20);
      expect(r.competencyBreakdown[c]).toBeCloseTo(20, 5);
    }
  });

  it("places mid-range correctly", () => {
    // 3/4 weight => 75
    const r = scoreAssessment(fullResponses(3));
    expect(r.total).toBe(75);
    expect(r.level).toBe("industry_ready");
    expect(r.track).toBe("Advanced Interview Performance Track");
  });
});

describe("bandFromScore", () => {
  it.each([
    [0, "emerging"],
    [35, "emerging"],
    [36, "developing"],
    [60, "developing"],
    [61, "industry_ready"],
    [80, "industry_ready"],
    [81, "high_impact"],
    [100, "high_impact"],
  ])("score %i -> %s", (score, level) => {
    expect(bandFromScore(score).level).toBe(level);
  });

  it("clamps out-of-range scores", () => {
    expect(bandFromScore(-50).level).toBe("emerging");
    expect(bandFromScore(9999).level).toBe("high_impact");
  });

  it("has 4 bands covering 0..100", () => {
    expect(READINESS_BANDS).toHaveLength(4);
    expect(READINESS_BANDS[0].min).toBe(0);
    expect(READINESS_BANDS.at(-1)!.max).toBe(100);
  });
});
