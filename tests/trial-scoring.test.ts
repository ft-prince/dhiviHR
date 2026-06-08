import { describe, test, expect } from "vitest";
import {
  bandForTrialScore,
  TRIAL_MIN_SCORE,
  TRIAL_MAX_SCORE,
} from "@/lib/trial/scoring";

describe("bandForTrialScore", () => {
  test("maps minimum score (6) to Learner", () => {
    expect(bandForTrialScore(TRIAL_MIN_SCORE).level).toBe("learner");
  });

  test("maps maximum score (30) to Corporate License Ready", () => {
    expect(bandForTrialScore(TRIAL_MAX_SCORE).level).toBe("corporate_license_ready");
  });

  test("maps each band boundary correctly", () => {
    expect(bandForTrialScore(14).level).toBe("learner");
    expect(bandForTrialScore(15).level).toBe("practitioner");
    expect(bandForTrialScore(20).level).toBe("practitioner");
    expect(bandForTrialScore(21).level).toBe("accelerator");
    expect(bandForTrialScore(25).level).toBe("accelerator");
    expect(bandForTrialScore(26).level).toBe("corporate_license_ready");
  });

  test("clamps out-of-range totals into the valid range", () => {
    expect(bandForTrialScore(0).level).toBe("learner");
    expect(bandForTrialScore(999).level).toBe("corporate_license_ready");
  });

  test("rounds fractional totals before banding", () => {
    expect(bandForTrialScore(14.4).level).toBe("learner");
    expect(bandForTrialScore(14.6).level).toBe("practitioner");
  });
});
