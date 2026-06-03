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

export const READINESS_LEVEL=[
  { min: 0, max: 1.99, level: "learner", label: "Learner"},
  { min: 2, max: 2.74, level: "practitioner", label: "Practitioner"},
  { min: 2.75, max: 3.49, level: "accelerator", label: "Accelerator"},
  { min: 3.5, max: 4, level: "future_ready", label: "Future Ready"},
] as const;