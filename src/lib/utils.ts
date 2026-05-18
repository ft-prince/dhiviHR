import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Server/client-safe date formatter — fixed locale + UTC so hydration never mismatches. */
export function fmtDate(d: Date | string): string {
  return new Date(d).toLocaleDateString("en-GB", {
    timeZone: "UTC",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function fmtTime(d: Date | string): string {
  return new Date(d).toLocaleTimeString("en-GB", {
    timeZone: "UTC",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const READINESS_BANDS = [
  { min: 0, max: 35, level: "emerging", label: "Emerging Talent", track: "Foundation Employability Track" },
  { min: 36, max: 60, level: "developing", label: "Developing Professional", track: "Communication & Interview Track" },
  { min: 61, max: 80, level: "industry_ready", label: "Industry-Ready Candidate", track: "Advanced Interview Performance Track" },
  { min: 81, max: 100, level: "high_impact", label: "High-Impact Hire Potential", track: "Placement Excellence Track" },
] as const;

export type ReadinessLevel = (typeof READINESS_BANDS)[number]["level"];

export function bandFromScore(score: number) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  return READINESS_BANDS.find((b) => clamped >= b.min && clamped <= b.max) ?? READINESS_BANDS[0];
}
