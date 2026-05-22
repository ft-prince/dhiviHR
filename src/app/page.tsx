import Link from "next/link";
import type { FC } from "react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { ScrollReveal } from "@/components/marketing/scroll-reveal";
import { AnimatedCounter } from "@/components/marketing/animated-counter";
import { HeroDiagram } from "@/components/marketing/hero-diagram";
import { READINESS_BANDS } from "@/lib/utils";
import { COMPETENCY_LABELS, COMPETENCIES } from "@/lib/scoring";
import { auth } from "@/lib/auth";
import {
  ArrowRight,
  MessageSquare,
  BarChart3,
  Users,
  Zap,
  Target,
  GraduationCap,
  Building2,
  CheckCircle2,
} from "lucide-react";

/* ─── Data ──────────────────────────────────────────────────── */

const COMPETENCY_ICONS: Record<string, FC<{ className?: string }>> = {
  communication_confidence: MessageSquare,
  problem_solving: BarChart3,
  teamwork_leadership: Users,
  initiative_growth: Zap,
  interview_readiness: Target,
};

const COMPETENCY_DESCRIPTIONS: Record<string, string> = {
  communication_confidence:
    "Express yourself clearly under pressure. Structure your thoughts before you speak. Convey confidence even when the answer isn't obvious.",
  problem_solving:
    "Analyze constraints, form hypotheses, and arrive at logical solutions on demand — the way interviewers actually evaluate thinking.",
  teamwork_leadership:
    "Navigate group dynamics, take ownership of outcomes, and demonstrate collaborative instincts without prompting.",
  initiative_growth:
    "Show that you act without being told and improve without being pushed. The habit that separates hires from almost-hires.",
  interview_readiness:
    "Perform at your peak when it counts — composure under pressure, clarity under scrutiny, and preparation that shows.",
};

const PROBLEMS = [
  {
    title: "No honest self-picture",
    body: "Generic tools return vague scores. You need dimension-level precision to know what's actually holding you back — not a composite number.",
  },
  {
    title: "Prep that doesn't fit",
    body: "One-size-fits-all advice ignores your specific gaps. A 65% in Communication requires a different fix than a 65% in Problem Solving.",
  },
  {
    title: "Institutions operating blind",
    body: "Colleges can't move placement rates without measuring readiness at scale. Targeted intervention only works when you know who needs what.",
  },
];

const HOW_STEPS = [
  {
    n: "01",
    title: "Complete the Assessment",
    desc: "20 targeted questions across five competency dimensions. Calibrated to real interview evaluation criteria, not generic self-reporting.",
  },
  {
    n: "02",
    title: "Get Dimension-Level Scores",
    desc: "Instant results with a breakdown by competency. Not a vague overall score — precise numbers across every dimension you can act on.",
  },
  {
    n: "03",
    title: "Land in Your Readiness Band",
    desc: "Placed into one of four performance levels based on your actual scores, not self-reported confidence or assumed preparation.",
  },
  {
    n: "04",
    title: "Follow Your Track",
    desc: "A targeted development plan built around your specific gaps. Not a generic workshop — a path calibrated to where you actually are.",
  },
];

const STATS = [
  { value: 20, suffix: " min", label: "Average completion" },
  { value: 5, suffix: "", label: "Competency dimensions" },
  { value: 4, suffix: "", label: "Readiness bands" },
  { value: 100, suffix: "%", label: "Personalized output" },
];

/* ─── Page ───────────────────────────────────────────────────── */

export default async function HomePage() {
  const session = await auth();
  const user = session?.user
    ? { name: session.user.name, role: (session.user as { role?: string }).role }
    : null;

  return (
    <main className="min-h-screen bg-white overflow-x-hidden">
      <SiteHeader user={user} />

      {/* ══════════════════════════════════════════════════════════
          HERO — dark, grid background, terminal diagram
         ══════════════════════════════════════════════════════════ */}
      <section
        className="relative min-h-screen flex items-center pt-16"
        style={{ background: "#20cf52" }}
      >
        {/* Fine line grid */}
        <div className="hero-line-grid absolute inset-0 pointer-events-none" aria-hidden />
        {/* Radial gradient mask — fades grid edges */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 50%, transparent 40%, #20cf52 100%)",
          }}
          aria-hidden
        />
        {/* Green glow — upper right */}
        <div
          className="absolute top-0 right-1/4 h-96 w-96 rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(34,197,94,0.07) 0%, transparent 70%)",
          }}
          aria-hidden
        />

        <div className="container-narrow relative py-24 md:py-32">
          <div className="grid lg:grid-cols-[1fr_480px] gap-16 items-center">
            {/* Left: copy */}
            <div className="animate-fade-in">
              <div
                className="inline-flex items-center gap-2 rounded-pill px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] mb-8"
                style={{
                  border: "1px solid rgba(34,197,94,0.25)",
                  background: "rgba(34,197,94,0.07)",
                  color: "#ebf0ed",
                }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: "#ceddd4",color:"white", boxShadow: "0 0 6px rgba(220, 237, 226, 0.8)" }}
                />
                Employability Assessment Platform
              </div>

              <h1
                className="font-display font-extrabold text-5xl md:text-[64px] lg:text-[72px] leading-[1.02] tracking-tight"
                style={{ color: "rgba(255,255,255,0.95)" }}
              >
                Know exactly
                <br />
                where you{" "}
                <span style={{ color: "#1e1f1f" }}>stand.</span>
              </h1>

              <p className="mt-7 text-lg leading-relaxed max-w-md" style={{ color: "rgba(236, 233, 233, 0.98)" }}>
                DhiviHR scores your employability across five competency dimensions and
                maps a precise path to closing every gap — before your next interview.
              </p>

              <div className="mt-9 flex flex-wrap gap-3">
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 rounded-pill px-7 py-3.5 text-sm font-bold uppercase tracking-wider transition-all duration-200"
                  style={{
                    background: "#22C55E",
                    color: "#fff",
                    boxShadow: "0 8px 28px -8px rgba(34,197,94,0.6)",
                  }}
                >
                  Take the Assessment <ArrowRight className="h-4 w-4" />
                </Link>
           
              </div>

              
            </div>

            {/* Right: animated terminal */}
            <div
              className="animate-fade-in"
              style={{ animationDelay: "180ms" }}
            >
              <HeroDiagram />
            </div>
          </div>
        </div>

        {/* Bottom gradient fade to white */}
        <div
          className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
          style={{ background: "linear-gradient(to bottom, transparent, #ffffff)" }}
          aria-hidden
        />
      </section>

      {/* ══════════════════════════════════════════════════════════
          PROBLEM — white, asymmetric editorial layout
         ══════════════════════════════════════════════════════════ */}
      <section id="problem" className="py-32 bg-white">
        <div className="container-narrow">
          <div className="grid lg:grid-cols-[55%_1fr] gap-20 items-start">
            {/* Left: bold editorial statement */}
            <ScrollReveal>
              <div
                className="text-[10px] font-bold uppercase tracking-[0.22em] mb-8"
                style={{ color: "#94a3b8" }}
              >
                The Problem
              </div>
              <h2 className="font-display font-extrabold text-5xl md:text-[56px] leading-[1.04] tracking-tight text-ink">
                The gap between
                <br />
                college and a job
                <br />
                offer isn&apos;t random.
              </h2>
              <div className="mt-8 flex items-center gap-4">
                <div className="h-px w-12 bg-brand-500" />
                <div className="h-1.5 w-1.5 rounded-full bg-brand-500" />
              </div>
              <p className="mt-7 text-lg text-ink-muted leading-relaxed max-w-sm">
                It&apos;s the result of three specific, measurable failures — each fixable once you
                know which one applies to you.
              </p>
            </ScrollReveal>

            {/* Right: numbered problem list — no cards */}
            <div className="divide-y divide-border">
              {PROBLEMS.map((p, i) => (
                <ScrollReveal key={p.title} delay={i * 90}>
                  <div className="py-8 first:pt-0">
                    <div
                      className="text-[10px] font-mono uppercase tracking-[0.2em] mb-3"
                      style={{ color: "#94a3b8" }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </div>
                    <h3 className="font-display font-bold text-ink mb-2.5">{p.title}</h3>
                    <p className="text-sm text-ink-muted leading-relaxed">{p.body}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          COMPETENCIES — light, bento grid with variable card sizes
         ══════════════════════════════════════════════════════════ */}
      <section id="competencies" className="py-32" style={{ background: "#f8fafc" }}>
        <div className="container-narrow">
          <ScrollReveal className="mb-16">
            <div
              className="text-[10px] font-bold uppercase tracking-[0.22em] mb-4"
              style={{ color: "#16a34a" }}
            >
              What We Measure
            </div>
            <h2 className="font-display font-extrabold text-4xl md:text-5xl tracking-tight text-ink max-w-lg">
              Five dimensions.
              <br />
              One complete picture.
            </h2>
            <p className="mt-5 text-ink-muted text-lg max-w-md">
              Each maps directly to what recruiters evaluate — not theory, but the real criteria
              behind offer decisions.
            </p>
          </ScrollReveal>

          {/* Bento grid: 3 cols, communication spans 2 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Communication — large */}
            <ScrollReveal className="sm:col-span-2">
              <BentoCard
                competency="communication_confidence"
                large
                accent
              />
            </ScrollReveal>

            {/* Problem Solving */}
            <ScrollReveal delay={60}>
              <BentoCard competency="problem_solving" />
            </ScrollReveal>

            {/* Row 2: 3 equal */}
            {(["teamwork_leadership", "initiative_growth", "interview_readiness"] as const).map(
              (c, i) => (
                <ScrollReveal key={c} delay={120 + i * 60}>
                  <BentoCard competency={c} />
                </ScrollReveal>
              )
            )}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          HOW IT WORKS — dark, vertical timeline
         ══════════════════════════════════════════════════════════ */}
      <section id="how" className="py-32" style={{ background: "#20cf52" }}>
        <div className="container-narrow">
          <div className="grid lg:grid-cols-[1fr_520px] gap-20 items-start">
            {/* Left: sticky heading */}
            <div className="lg:sticky lg:top-28">
              <ScrollReveal>
                <div
                  className="text-[10px] font-bold uppercase tracking-[0.22em] mb-4"
                  style={{ color: "#ffff" }}
                >
                  The Process
                </div>
                <h2
                  className="font-display font-extrabold text-4xl md:text-5xl tracking-tight leading-[1.06]"
                  style={{ color: "rgba(255,255,255,0.92)" }}
                >
                  Four steps.
                  <br />
                  No shortcuts.
                </h2>
                <p className="mt-5 text-lg leading-relaxed" style={{ color: "white" }}>
                  A structured path from not knowing where you stand to knowing exactly what to fix.
                </p>
                <Link href="/signup" className="pill-cta mt-8 inline-flex bg-black">
                  Start Now <ArrowRight className="h-4 w-4" />
                </Link>
              </ScrollReveal>
            </div>

            {/* Right: timeline */}
            <div>
              {HOW_STEPS.map((s, i) => (
                <ScrollReveal key={s.n} delay={i * 100}>
                  <div className="flex gap-6 pb-12 last:pb-0">
                    {/* Dot + line */}
                    <div className="flex flex-col items-center">
                      <div
                        className="h-10 w-10 rounded-full flex items-center justify-center shrink-0 font-mono text-[11px] font-bold z-10"
                        style={{
                          border: "2px solid #22C55E",
                          background: "#060d18",
                          color: "#4ade80",
                        }}
                      >
                        {s.n}
                      </div>
                      {i < HOW_STEPS.length - 1 && (
                        <div
                          className="w-px flex-1 mt-3"
                          style={{ background: "rgba(255,255,255,0.07)", minHeight: "48px" }}
                        />
                      )}
                    </div>
                    {/* Content */}
                    <div className="pt-1.5 pb-4">
                      <h3
                        className="font-display font-bold text-xl mb-2"
                        style={{ color: "rgba(255,255,255,0.9)" }}
                      >
                        {s.title}
                      </h3>
                      <p className="text-sm leading-relaxed" style={{ color: "rgba(229, 225, 225, 0.97)" }}>
                        {s.desc}
                      </p>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          READINESS BANDS — white, spectrum visualization
         ══════════════════════════════════════════════════════════ */}
      <section id="bands" className="py-32 bg-white">
        <div className="container-narrow">
          <ScrollReveal className="mb-16">
            <div
              className="text-[10px] font-bold uppercase tracking-[0.22em] mb-4"
              style={{ color: "#16a34a" }}
            >
              Readiness Levels
            </div>
            <h2 className="font-display font-extrabold text-4xl md:text-5xl tracking-tight text-ink">
              Four levels.
              <br />
              One clear verdict.
            </h2>
          </ScrollReveal>

          {/* Spectrum bar */}
          <ScrollReveal>
            <div className="mb-4 flex items-end justify-between text-[10px] font-mono" style={{ color: "#94a3b8" }}>
              <span>0</span>
              <span>35</span>
              <span>60</span>
              <span>80</span>
              <span>100</span>
            </div>
            <div
              className="h-2.5 rounded-full mb-10"
              style={{
                background:
                  "linear-gradient(90deg, #bbf7d0 0%, #4ade80 35%, #22C55E 60%, #15803d 80%, #14532d 100%)",
              }}
            />
          </ScrollReveal>

          {/* Band details as 4-col grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-border rounded-2xl overflow-hidden">
            {READINESS_BANDS.map((b, i) => (
              <ScrollReveal key={b.level} delay={i * 60}>
                <div className="bg-white p-7 h-full hover:bg-brand-50/40 transition-colors duration-200">
                  <div className="flex items-center gap-2 mb-5">
                    <div
                      className="h-6 w-6 rounded-full flex items-center justify-center text-white font-bold text-xs"
                      style={{
                        background: "#22C55E",
                        opacity: 0.4 + i * 0.2,
                      }}
                    >
                      {i + 1}
                    </div>
                    <span
                      className="text-[10px] font-mono font-medium"
                      style={{ color: "#94a3b8" }}
                    >
                      {b.min}–{b.max} pts
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-ink mb-1.5">{b.label}</h3>
                  <p className="text-xs text-ink-muted leading-relaxed">{b.track}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          STATS — dark, editorial typographic numbers
         ══════════════════════════════════════════════════════════ */}
      <section style={{ background: "#060d18" }}>
        <div className="container-narrow">
          <div className="grid grid-cols-2 md:grid-cols-4">
            {STATS.map((s, i) => (
              <div
                key={s.label}
                className="py-16 px-6 text-center"
                style={{
                  borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.06)" : "none",
                }}
              >
                <div
                  className="font-display font-extrabold leading-none tabular-nums"
                  style={{ fontSize: "clamp(52px, 6vw, 80px)", color: "rgba(255,255,255,0.9)" }}
                >
                  <AnimatedCounter target={s.value} suffix={s.suffix} />
                </div>
                <div
                  className="mt-4 text-[10px] uppercase tracking-[0.2em]"
                  style={{ color: "rgba(255,255,255,0.25)" }}
                >
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          TWO PATHS — white, differentiated split
         ══════════════════════════════════════════════════════════ */}
      <section id="colleges" className="py-32 bg-white">
        <div className="container-narrow">
          <ScrollReveal className="mb-16">
            <div
              className="text-[10px] font-bold uppercase tracking-[0.22em] mb-4"
              style={{ color: "#16a34a" }}
            >
              Access Paths
            </div>
            <h2 className="font-display font-extrabold text-4xl md:text-5xl tracking-tight text-ink">
              One platform.
              <br />
              Two entry points.
            </h2>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 gap-5">
            {/* Student path */}
            <ScrollReveal>
              <div className="rounded-2xl border border-brand-100 bg-white p-10 h-full flex flex-col hover:border-brand-300 hover:shadow-card transition-all duration-200">
                <div className="flex items-center gap-3 mb-8">
                  <div className="h-10 w-10 rounded-xl bg-brand-500 grid place-items-center shadow-glow shrink-0">
                    <GraduationCap className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-brand-600 mb-0.5">Individual</div>
                    <h3 className="font-display font-bold text-xl text-ink">Student Assessment</h3>
                  </div>
                </div>
                <p className="text-sm text-ink-muted leading-relaxed mb-8">
                  Take the assessment independently. Get your readiness score, understand your
                  dimension-level gaps, and access a personalized development track.
                </p>
                <ul className="space-y-4 mb-10 flex-1">
                  {[
                    "Complete the assessment — free",
                    "Unlock your full scored report",
                    "Join a targeted workshop or 1-on-1 session",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-ink-muted">
                      <CheckCircle2 className="h-4 w-4 text-brand-500 mt-0.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link href="/signup">
                  <Button className="w-full">Take the Assessment</Button>
                </Link>
              </div>
            </ScrollReveal>

            {/* College path */}
            <ScrollReveal delay={80}>
              <div
                className="rounded-2xl p-10 h-full flex flex-col transition-all duration-200"
                style={{ background: "#060d18", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                <div className="flex items-center gap-3 mb-8">
                  <div className="h-10 w-10 rounded-xl bg-brand-500 grid place-items-center shadow-glow shrink-0">
                    <Building2 className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div
                      className="text-[9px] font-bold uppercase tracking-[0.2em] mb-0.5"
                      style={{ color: "#4ade80" }}
                    >
                      Institutional
                    </div>
                    <h3 className="font-display font-bold text-xl" style={{ color: "rgba(255,255,255,0.92)" }}>
                      College Deployment
                    </h3>
                  </div>
                </div>
                <p className="text-sm leading-relaxed mb-8" style={{ color: "rgba(255,255,255,0.4)" }}>
                  Deploy assessments at batch scale. Segment students into readiness bands and run
                  level-specific workshop tracks with full placement analytics.
                </p>
                <ul className="space-y-4 mb-10 flex-1">
                  {[
                    "Code-gated access for batch management",
                    "Automatic segmentation into 4 readiness bands",
                    "College-specific workshop track deployment",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
                      <CheckCircle2 className="h-4 w-4 text-brand-500 mt-0.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link href="/signup/student">
                  <Button
                    variant="outline"
                    className="w-full"
                    style={{
                      borderColor: "rgba(255,255,255,0.12)",
                      color: "rgba(255,255,255,0.7)",
                      background: "transparent",
                    }}
                  >
                    I Have a College Code
                  </Button>
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          FINAL CTA — brand green, minimal
         ══════════════════════════════════════════════════════════ */}
      <section className="bg-brand-500 py-28 relative overflow-hidden">
        {/* Subtle grid on green */}
        <div className="cta-grid absolute inset-0 pointer-events-none opacity-20" aria-hidden />

        <div className="container-narrow text-center relative">
          <ScrollReveal>
            <h2 className="font-display font-extrabold text-white text-4xl md:text-6xl tracking-tight leading-[1.04]">
              Start with a score.
            </h2>
            <p className="mt-5 text-white/70 text-lg max-w-sm mx-auto">
              20 minutes. Honest feedback. A clear direction for what to fix next.
            </p>
            <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-pill px-8 py-4 text-sm font-bold uppercase tracking-wider transition-all duration-200"
                style={{
                  background: "#fff",
                  color: "#15803d",
                  boxShadow: "0 4px 28px -8px rgba(0,0,0,0.2)",
                }}
              >
                Take the Assessment <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="mailto:dhivihr@gmail.com"
                className="inline-flex items-center gap-2 rounded-pill px-8 py-4 text-sm font-bold uppercase tracking-wider text-white/80 hover:text-white transition-colors"
                style={{ border: "1px solid rgba(255,255,255,0.25)" }}
              >
                Talk to the Team
              </a>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}

/* ─── Bento Card ─────────────────────────────────────────────── */

interface BentoCardProps {
  competency: keyof typeof COMPETENCY_LABELS;
  large?: boolean;
  accent?: boolean;
}

function BentoCard({ competency, large, accent }: BentoCardProps) {
  const Icon = COMPETENCY_ICONS[competency] ?? Target;
  const label = COMPETENCY_LABELS[competency];
  const description = COMPETENCY_DESCRIPTIONS[competency];

  return (
    <div
      className={`group rounded-2xl bg-white border border-brand-100 p-7 h-full flex flex-col
        hover:border-brand-200 hover:shadow-soft transition-all duration-200 ${large ? "md:p-8" : ""}`}
    >
      <div
        className="h-10 w-10 rounded-xl bg-brand-500 grid place-items-center mb-5 shadow-glow
          group-hover:scale-105 transition-transform duration-200 shrink-0"
      >
        <Icon className="h-5 w-5 text-white" />
      </div>

      <h3 className={`font-display font-bold text-ink mb-2.5 ${large ? "text-xl" : "text-base"}`}>
        {label}
      </h3>
      <p className={`text-ink-muted leading-relaxed flex-1 ${large ? "text-sm" : "text-xs"}`}>
        {description}
      </p>

      {/* Waveform decoration on the large card */}
      {accent && (
        <div className="flex items-end gap-0.5 h-10 mt-6 pt-6 border-t border-brand-50">
          {[5, 8, 6, 9, 7, 10, 8, 6, 9, 7, 5, 8, 10, 6, 7, 9, 5, 8, 7, 9].map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-full bg-brand-200 group-hover:bg-brand-300 transition-colors duration-300"
              style={{ height: `${h * 9}%` }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
