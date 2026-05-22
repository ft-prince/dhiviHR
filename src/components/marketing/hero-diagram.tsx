"use client";

import { useEffect, useState } from "react";
import { Sparkles, TrendingUp, CheckCircle2 } from "lucide-react";

const SCORES = [
  { label: "Communication", pct: 78 },
  { label: "Problem Solving", pct: 82 },
  { label: "Teamwork", pct: 65 },
  { label: "Initiative", pct: 71 },
  { label: "Interview Ready", pct: 74 },
];

type Phase = 0 | 1 | 2 | 3;

export function HeroDiagram() {
  const [phase, setPhase] = useState<Phase>(0);
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 400);
    const t2 = setTimeout(() => setPhase(2), 800);
    const t3 = setTimeout(() => setPhase(3), 2000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  useEffect(() => {
    if (phase < 3) return;
    let raf: number;
    const start = performance.now();
    const duration = 1200;
    const step = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayScore(Math.round(eased * 74));
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  return (
    <div className="relative select-none">
      {/* Soft green glow */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(34,197,94,0.18) 0%, transparent 65%)",
          filter: "blur(40px)",
          transform: "translateY(20px) scale(1.1)",
        }}
      />


      {/* Floating mini-card: "+8 pts" badge */}
      <div
        className="absolute -right-6 top-1/3 z-20 hidden sm:flex items-center gap-2 rounded-xl bg-brand-500 px-3 py-2 shadow-[0_10px_30px_-6px_rgba(34,197,94,0.55)] animate-float-2"
        style={{ opacity: phase >= 3 ? 1 : 0, transition: "opacity 0.5s ease 0.4s" }}
      >
        <TrendingUp className="h-3.5 w-3.5 text-white" />
        <span className="text-[11px] font-bold text-white tabular-nums">+8 pts</span>
      </div>

      {/* Floating mini-card: bottom right verified */}
      <div
        className="absolute -right-10 -bottom-4 z-20 hidden sm:flex items-center gap-2 rounded-xl bg-white px-3 py-2 shadow-[0_8px_30px_-6px_rgba(15,23,42,0.18)] border border-brand-100 animate-float-3"
        style={{ opacity: phase >= 3 ? 1 : 0, transition: "opacity 0.5s ease 0.6s" }}
      >
        <CheckCircle2 className="h-3.5 w-3.5 text-brand-500" />
        <span className="text-[10px] font-semibold text-ink">Industry-Ready</span>
      </div>

      {/* Main card */}
      <div className="relative rounded-2xl bg-white border border-brand-100 shadow-[0_30px_80px_-20px_rgba(15,23,42,0.18),0_0_0_1px_rgba(34,197,94,0.04)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-50 bg-gradient-to-r from-brand-50/60 via-white to-white">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-brand-500 grid place-items-center shadow-glow">
              <Sparkles className="h-3.5 w-3.5 text-white" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-ink leading-none">Readiness Report</div>
              <div className="text-[9px] font-mono text-ink-soft mt-0.5 uppercase tracking-[0.15em]">
                dhivihr.engine
              </div>
            </div>
          </div>
          <span
            className="text-[10px] font-mono uppercase tracking-[0.18em] text-brand-600 transition-opacity duration-500"
            style={{ opacity: phase >= 2 ? 1 : 0 }}
          >
            ● Complete
          </span>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Big score */}
          <div className="flex items-end justify-between mb-6">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink-soft mb-1">
                Overall Score
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-display font-extrabold text-6xl text-ink tabular-nums leading-none">
                  {displayScore}
                </span>
                <span className="text-sm text-ink-soft font-mono">/ 100</span>
              </div>
              <div className="mt-2 text-xs text-brand-600 font-semibold">
                Industry-Ready Candidate
              </div>
            </div>
            {/* Circular progress */}
            <div className="relative h-20 w-20">
              <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  fill="none"
                  stroke="#ECFDF3"
                  strokeWidth="6"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  fill="none"
                  stroke="url(#hero-grad)"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 34}
                  strokeDashoffset={
                    phase >= 2 ? 2 * Math.PI * 34 * (1 - 0.74) : 2 * Math.PI * 34
                  }
                  style={{ transition: "stroke-dashoffset 1.4s cubic-bezier(0.16,1,0.3,1)" }}
                />
                <defs>
                  <linearGradient id="hero-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#4ade80" />
                    <stop offset="100%" stopColor="#16a34a" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 grid place-items-center">
                <span className="text-xs font-bold text-brand-600 tabular-nums">74%</span>
              </div>
            </div>
          </div>

          {/* Score bars */}
          <div className="space-y-3">
            {SCORES.map((s, i) => (
              <div key={s.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-medium text-ink-muted">{s.label}</span>
                  <span
                    className="text-[11px] font-bold text-brand-600 tabular-nums transition-opacity duration-300"
                    style={{
                      opacity: phase >= 2 ? 1 : 0,
                      transitionDelay: `${i * 80}ms`,
                    }}
                  >
                    {s.pct}
                  </span>
                </div>
                <div className="relative h-1.5 rounded-full bg-brand-50 overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: phase >= 2 ? `${s.pct}%` : "0%",
                      background: "linear-gradient(90deg, #4ade80, #16a34a)",
                      transitionDelay: `${i * 80}ms`,
                      boxShadow: "0 0 8px rgba(34,197,94,0.4)",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Recommendation card */}
          <div
            className="mt-6 rounded-xl border border-brand-200 bg-gradient-to-br from-brand-50 to-white p-4 transition-all duration-500"
            style={{
              opacity: phase >= 3 ? 1 : 0,
              transform: phase >= 3 ? "translateY(0)" : "translateY(8px)",
            }}
          >
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-brand-500 grid place-items-center shrink-0 shadow-glow">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-700 mb-1">
                  Recommended Track
                </div>
                <div className="text-xs font-semibold text-ink">
                  Advanced Interview Performance Track
                </div>
                <div className="mt-1 text-[10px] text-ink-soft">
                  Calibrated to lift you from 74 → 85+
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
