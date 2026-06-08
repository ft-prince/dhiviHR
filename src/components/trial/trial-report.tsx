"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Info, Gift } from "lucide-react";
import {
  TRIAL_BANDS,
  TRIAL_MIN_SCORE,
  TRIAL_MAX_SCORE,
  bandForTrialScore,
  type TrialLevel,
} from "@/lib/trial/scoring";

const BAND_COLOR: Record<TrialLevel, string> = {
  learner: "#EF4444",
  practitioner: "#F59E0B",
  accelerator: "#3B82F6",
  corporate_license_ready: "#22C55E",
};

const CONFETTI_COLORS = ["#EF4444", "#F59E0B", "#3B82F6", "#22C55E", "#A855F7", "#FACC15"];

interface TrialReportProps {
  total: number;
}

export function TrialReport({ total }: TrialReportProps) {
  const band = bandForTrialScore(total);
  const color = BAND_COLOR[band.level];
  const pct = ((total - TRIAL_MIN_SCORE) / (TRIAL_MAX_SCORE - TRIAL_MIN_SCORE)) * 100;

  const [opened, setOpened] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (opened) return;
    const t = setTimeout(() => setOpened(true), 1100);
    return () => clearTimeout(t);
  }, [opened]);

  useEffect(() => {
    if (!opened) return;
    fireConfetti(canvasRef.current, [color, ...CONFETTI_COLORS]);
  }, [opened, color]);

  return (
    <>
      {/* Confetti canvas overlay */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 z-[120] pointer-events-none"
        style={{ width: "100%", height: "100%" }}
      />

      <style>{`
        @keyframes tr-bob  { 0%,100% { transform: translateY(0) rotate(-2deg) } 50% { transform: translateY(-10px) rotate(2deg) } }
        @keyframes tr-tag  { 0% { opacity:0; transform: translateY(16px) scale(.92) } 60% { transform: translateY(-3px) scale(1.03) } 100% { opacity:1; transform:none } }
        @keyframes tr-rise { from { opacity:0; transform: translateY(12px) } to { opacity:1; transform:none } }
      `}</style>

      {!opened ? (
        /* ── Gift state ──────────────────────────────────────────── */
        <div className="flex flex-col items-center text-center py-16 sm:py-24">
          <button
            onClick={() => setOpened(true)}
            aria-label="Open your result"
            className="group"
          >
            <span
              className="flex items-center justify-center w-28 h-28 sm:w-32 sm:h-32 rounded-3xl transition-all duration-200 group-hover:scale-105"
              style={{
                background: `linear-gradient(160deg, #22C55E, #16A34A)`,
                boxShadow: "0 20px 60px -12px rgba(34,197,94,0.5)",
                animation: "tr-bob 2.2s ease-in-out infinite",
              }}
            >
              <Gift size={56} className="text-white" strokeWidth={1.5} />
            </span>
          </button>
          <h2 className="mt-8 text-lg sm:text-xl font-bold text-ink">
            Your result is ready
          </h2>
          <p className="mt-1.5 text-[14px] text-ink-soft">
            Tap the gift to reveal your readiness level
          </p>
        </div>
      ) : (
        /* ── Revealed result ─────────────────────────────────────── */
        <div className="py-8 sm:py-10">
          {/* Overline */}
          <p
            className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-4"
            style={{ animation: "tr-rise 500ms ease both" }}
          >
            Your CRAFTe trial result
          </p>

          {/* Result card */}
          <div
            className="rounded-2xl border border-gray-100 bg-white shadow-soft overflow-hidden"
            style={{ animation: "tr-rise 500ms ease 60ms both" }}
          >
            {/* Colored top accent */}
            <div className="h-1.5 w-full" style={{ background: color }} />

            <div className="p-6 sm:p-8">
              {/* Level badge */}
              <div
                className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 mb-5"
                style={{
                  background: `${color}18`,
                  color,
                  animation: "tr-tag 600ms cubic-bezier(0.32,0.72,0,1) 100ms both",
                }}
              >
                <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                <span className="text-[13px] font-semibold">{band.label}</span>
              </div>

              {/* Score */}
              <div
                className="flex items-baseline gap-2 mb-6"
                style={{ animation: "tr-rise 500ms ease 160ms both" }}
              >
                <span
                  className="font-display font-extrabold tracking-tight leading-none"
                  style={{ fontSize: "clamp(3rem,10vw,4.5rem)", color }}
                >
                  {total}
                </span>
                <span className="text-gray-400 text-lg font-medium">
                  / {TRIAL_MAX_SCORE}
                </span>
              </div>

              {/* Band scale */}
              <div
                className="mb-2 h-2.5 rounded-full bg-gray-100 overflow-hidden"
                style={{ animation: "tr-rise 500ms ease 220ms both" }}
              >
                <div
                  className="h-full rounded-full transition-[width] duration-700 ease-out"
                  style={{ width: `${pct}%`, background: color, transitionDelay: "350ms" }}
                />
              </div>
              <div
                className="flex justify-between text-[11px] text-gray-400 mb-7"
                style={{ animation: "tr-rise 500ms ease 260ms both" }}
              >
                {TRIAL_BANDS.map((b) => (
                  <span
                    key={b.level}
                    className={band.level === b.level ? "font-bold" : ""}
                    style={band.level === b.level ? { color } : undefined}
                  >
                    {b.label.split(" ")[0]}
                  </span>
                ))}
              </div>

              {/* Sub-heading message */}
              <p
                className="text-[15px] sm:text-[16px] leading-relaxed text-ink mb-8"
                style={{ animation: "tr-rise 500ms ease 340ms both" }}
              >
                {band.subHeading}
              </p>

              {/* CTA */}
              <div style={{ animation: "tr-rise 500ms ease 420ms both" }}>
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-bold uppercase tracking-wider text-white transition-opacity hover:opacity-90"
                  style={{ background: "#22C55E", boxShadow: "0 10px 30px -10px rgba(34,197,94,.5)" }}
                >
                  Take the Full Test <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>

          {/* How calculated */}
          <div
            className="mt-5 rounded-2xl border border-gray-100 bg-gray-50/70 p-5 sm:p-6"
            style={{ animation: "tr-rise 500ms ease 500ms both" }}
          >
            <div className="flex items-start gap-2.5">
              <Info size={15} className="text-gray-400 mt-0.5 shrink-0" />
              <div>
                <h2 className="text-[13px] font-semibold text-gray-900 mb-1">
                  How the score is calculated
                </h2>
                <p className="text-[13px] text-gray-500 leading-relaxed">
                  Each of the 6 questions is scored from 1 (Never) to 5 (Always). Your total is
                  the sum of all six answers — a minimum of {TRIAL_MIN_SCORE} and a maximum
                  of {TRIAL_MAX_SCORE}.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ─── Lightweight self-contained confetti (no dependency) ───────── */
function fireConfetti(canvas: HTMLCanvasElement | null, colors: string[]) {
  if (!canvas || typeof window === "undefined") return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;
  const W = window.innerWidth;
  const H = window.innerHeight;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  ctx.scale(dpr, dpr);

  const COUNT = 140;
  const originX = W / 2;
  const originY = H * 0.32;
  const pieces = Array.from({ length: COUNT }, () => {
    const angle = Math.random() * Math.PI * 2;
    const speed = 6 + Math.random() * 9;
    return {
      x: originX, y: originY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 6,
      size: 5 + Math.random() * 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
      life: 0,
    };
  });

  const GRAVITY = 0.28;
  const MAX_LIFE = 160;
  let raf = 0;

  const tick = () => {
    ctx.clearRect(0, 0, W, H);
    let alive = false;
    for (const p of pieces) {
      p.life += 1;
      if (p.life > MAX_LIFE) continue;
      alive = true;
      p.vy += GRAVITY;
      p.vx *= 0.99;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - p.life / MAX_LIFE);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      ctx.restore();
    }
    if (alive) {
      raf = requestAnimationFrame(tick);
    } else {
      ctx.clearRect(0, 0, W, H);
    }
  };
  cancelAnimationFrame(raf);
  raf = requestAnimationFrame(tick);
}
