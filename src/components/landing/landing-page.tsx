"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { logoutAction } from "@/lib/auth/actions";
import {
  ArrowRight, Menu, X, CheckCircle2,
  MessageSquare, TrendingUp, GraduationCap, Building2,
  ArrowRightIcon, Briefcase, Shield, Rocket, Sparkles, User, Mic,
} from "lucide-react";
import { Shader, Swirl, ChromaFlow, FlutedGlass, FilmGrain } from "shaders/react";
import { LetsConnectModal } from "@/components/enquiry/lets-connect-modal";

/* ─── Types ─────────────────────────────────────────────────────── */
interface User { name?: string | null; role?: string }
interface LandingPageProps { user?: User | null }

/* ─── Utilities ──────────────────────────────────────────────────── */
const GREEN = "#22C55E";
const GREEN_DARK = "#16a34a";

/* ─── Data ───────────────────────────────────────────────────────── */
const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Colleges", href: "#colleges" },
  { label: "Students", href: "#students" },
  { label: "Expert Talks", href: "#expert-talks" },
  { label: "Enquire Now", href: "mailto:dhivihr@gmail.com" },
];

const STATS = [
  { value: "20", suffix: " min", label: "Average completion" },
  { value: "6", suffix: "", label: "Competency dimensions" },
  { value: "4", suffix: "", label: "Readiness bands" },
  { value: "100", suffix: "%", label: "Personalized output" },
];

/* Color-coded cars: green is fastest / wins, red trails. */
const RACE_CARS = [
  { color: "#EF4444", label: "Unaware",         dur: "6.5s", end: "60%", lines: 2, desc: "Still developing awareness of professional expectations and workplace norms." },
  { color: "#F59E0B", label: "Getting There",   dur: "5.2s", end: "70%", lines: 3, desc: "Core competencies are forming — targeted effort in key areas will accelerate growth." },
  { color: "#3B82F6", label: "Improving",       dur: "4.1s", end: "79%", lines: 3, desc: "Strong foundations in place. A few focused improvements unlock real competitive edge." },
  { color: "#22C55E", label: "Corporate Ready", dur: "3.0s", end: "90%", lines: 5, desc: "Race winner. You have what employers look for — day-one confident and placement-ready." },
];

const HOW_STEPS = [
  { n: "01", title: "Take the Corporate Readiness Challenge", desc: "Discover how prepared you are for today's workplace." },
  { n: "02", title: "Get Your Personalized Readiness Report", desc: "Instant results with a precise breakdown by competency — not a vague composite number, but actionable scores." },
  { n: "03", title: "Discover Your Strengths & Gaps", desc: "Identify what employers value and where you can improve." },
  { n: "04", title: "Become Corporate Ready", desc: "Develop the competencies employers look for and stand out in placements and the workplace." },
];

const COMPETENCIES = [
  { icon: Briefcase,     label: "Business Acumen",          desc: "Understand how organisations create value, make decisions, and measure success — the commercial awareness employers expect." },
  { icon: Shield,        label: "Resilience & Adaptability", desc: "Stay composed under pressure and adjust quickly when priorities, tools, or expectations change." },
  { icon: MessageSquare, label: "Influence & Communication", desc: "Express ideas clearly, listen actively, and persuade with confidence across any audience." },
  { icon: TrendingUp,    label: "Growth Mindset",           desc: "Treat feedback as fuel and keep improving — the habit that separates high performers from the rest." },
  { icon: Rocket,        label: "Execution & Ownership",    desc: "Take initiative, follow through, and own outcomes from start to finish without being chased." },
  { icon: Sparkles,      label: "AI Awareness",             desc: "Use AI tools effectively and responsibly to work faster, smarter, and stay relevant in a changing workplace." },
];

const EXPERT_TOPICS = [
  { title: "Behavioural Competency Awareness", desc: "Understand what employers look for beyond technical skills and academic scores, and how workplace behaviours influence hiring and career success." },
  { title: "Recruiter Mindset & Interview Excellence", desc: "Learn interview psychology, recruiter expectations, ATS resume strategies, career storytelling, and structured interview techniques." },
  { title: "AI, Assessments & Career Readiness", desc: "Explore AI-powered career tools, mock interview platforms, aptitude assessments, and placement preparation strategies." },
  { title: "Networking, Communication & Corporate Insights", desc: "Build executive presence, strengthen communication skills, leverage LinkedIn effectively, and gain exposure to real-world hiring practices." },
];

const FOOTER_LINKS = {
  Platform: [
    { label: "Take Assessment", href: "/signup" },
    { label: "For Colleges", href: "#colleges" },
    { label: "What We Measure", href: "#measure" },
    { label: "Expert Talks", href: "#expert-talks" },
  ],
  Company: [
    { label: "About DhiviHR", href: "#crafte" },
    { label: "Contact Us", href: "mailto:dhivihr@gmail.com" },
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
  ],
};

/* ─── TextRoll Button ────────────────────────────────────────────── */
interface BtnProps { label: string; dark?: boolean; green?: boolean; outline?: boolean; className?: string; onClick?: () => void; href?: string }

function TextRollButton({ label, dark, green, outline, className = "", onClick, href }: BtnProps) {
  const base = green
    ? "text-white"
    : dark
    ? "bg-gray-900 hover:bg-gray-800 text-white"
    : outline
    ? "bg-white border border-gray-200 text-gray-900 hover:border-gray-400"
    : "bg-gray-900 text-white";
  const arrowBg = green || dark ? "bg-white" : "bg-gray-900";
  const arrowColor = green ? "" : dark ? "text-gray-900" : "text-white";
  const greenStyle = green ? { background: GREEN } : undefined;
  const onGreenEnter = green
    ? (e: React.MouseEvent<HTMLElement>) => ((e.currentTarget as HTMLElement).style.background = GREEN_DARK)
    : undefined;
  const onGreenLeave = green
    ? (e: React.MouseEvent<HTMLElement>) => ((e.currentTarget as HTMLElement).style.background = GREEN)
    : undefined;

  const inner = (
    <>
      <div style={{ overflow: "hidden", height: "20px" }}>
        <div className="flex flex-col" style={{ transition: "transform 500ms cubic-bezier(0.25,0.1,0.25,1)" }}>
          <span className="leading-5 group-hover:-translate-y-full" style={{ transition: "transform 500ms cubic-bezier(0.25,0.1,0.25,1)" }}>{label}</span>
          <span className="leading-5 group-hover:-translate-y-full" style={{ transition: "transform 500ms cubic-bezier(0.25,0.1,0.25,1)" }}>{label}</span>
        </div>
      </div>
      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${arrowBg}`} style={{ transition: "transform 500ms cubic-bezier(0.25,0.1,0.25,1)" }}>
        <ArrowRight size={14} className={`${arrowColor} group-hover:-rotate-45`} style={{ ...(green ? { color: GREEN } : {}), transition: "transform 500ms cubic-bezier(0.25,0.1,0.25,1)" }} />
      </div>
    </>
  );

  const cls = `group inline-flex items-center gap-2 rounded-full pl-5 pr-2 py-2 text-[13px] font-medium transition-colors ${base} ${className}`;

  if (href) return <Link href={href} className={cls} style={greenStyle} onMouseEnter={onGreenEnter} onMouseLeave={onGreenLeave}>{inner}</Link>;
  return <button onClick={onClick} className={cls} style={greenStyle} onMouseEnter={onGreenEnter} onMouseLeave={onGreenLeave}>{inner}</button>;
}

/* ─── Section Badge ───────────────────────────────────────────────── */
function SectionBadge({ number, label, light }: { number: string; label: string; light?: boolean }) {
  return (
    <div className="flex items-center gap-3 mb-6 sm:mb-8">
      <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-white font-semibold" style={{ fontSize: "11px", background: GREEN }}>{number}</div>
      <span className={`text-[12px] sm:text-[13px] font-medium border rounded-full px-3 sm:px-4 py-1 sm:py-1.5 ${light ? "border-white/30 text-white" : "border-gray-200 text-gray-700"}`}>{label}</span>
    </div>
  );
}

/* ─── Silhouette placeholder (user fills photo + fields later) ─────── */
function SilhouettePanel({ badge, badgeColor, caption }: { badge: string; badgeColor: string; caption: string }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 flex flex-col">
      <div className="relative rounded-xl bg-gray-50 flex items-center justify-center" style={{ aspectRatio: "4/3" }}>
        <User size={72} className="text-gray-300" strokeWidth={1.25} />
        <span className="absolute top-3 left-3 text-[11px] font-semibold uppercase tracking-[0.12em] rounded-full px-3 py-1 text-white" style={{ background: badgeColor }}>{badge}</span>
      </div>
      <p className="text-[13px] text-gray-600 leading-relaxed mt-4">{caption}</p>
    </div>
  );
}

/* ─── Race car SVG (cartoon, side-view) ───────────────────────────── */
function RaceCar({ color }: { color: string }) {
  return (
    <svg width="70" height="34" viewBox="0 0 100 50" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.18))" }}>
      <path d="M4 38 Q6 27 20 25 L34 14 Q40 10 52 10 L70 10 Q82 10 88 19 L95 26 Q99 29 99 35 L99 38 Q99 42 95 42 L9 42 Q4 42 4 38 Z" fill={color} />
      <path d="M40 14 L54 14 L62 23 L40 23 Z" fill="#ffffff" opacity="0.9" />
      <circle cx="29" cy="42" r="8.5" fill="#1f2937" />
      <circle cx="29" cy="42" r="3.5" fill="#9ca3af" />
      <circle cx="77" cy="42" r="8.5" fill="#1f2937" />
      <circle cx="77" cy="42" r="3.5" fill="#9ca3af" />
      <circle cx="96" cy="33" r="2.6" fill="#fde68a" />
    </svg>
  );
}

/* ─── Checkered flag SVG ──────────────────────────────────────────── */
function CheckeredFlag() {
  return (
    <svg width="34" height="48" viewBox="0 0 34 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="0" width="2.5" height="48" rx="1.25" fill="#374151" />
      <g>
        <rect x="6" y="2" width="26" height="18" fill="#fff" />
        {[0, 1, 2, 3].map((r) =>
          [0, 1, 2, 3, 4, 5, 6].map((c) =>
            (r + c) % 2 === 0 ? (
              <rect key={`${r}-${c}`} x={6 + c * 3.7} y={2 + r * 4.5} width="3.7" height="4.5" fill="#111827" />
            ) : null
          )
        )}
      </g>
    </svg>
  );
}

/* ─── Animated car race section ───────────────────────────────────── */
function CarRaceSection() {
  return (
    <section className="bg-white py-16 sm:py-24 overflow-hidden">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">

        {/* Header */}
        <div className="text-center mb-10 sm:mb-14">
          <p className="text-[12px] sm:text-[13px] font-medium uppercase tracking-[0.18em] mb-3" style={{ color: GREEN }}>
            The race to corporate-ready
          </p>
          <h2 className="font-medium text-gray-900 leading-[1.1] tracking-[-0.02em]" style={{ fontSize: "clamp(1.4rem,4vw,2.6rem)" }}>
            Not all students cross the finish line at the same speed.
          </h2>
          <p className="text-[14px] sm:text-[15px] text-gray-500 mt-3 max-w-lg mx-auto leading-relaxed">
            Corporate-ready students win the race. CRAFTe shows you exactly where you are — and what it takes to finish first.
          </p>
        </div>

        {/* Animated race track */}
        <div
          className="relative rounded-3xl px-4 sm:px-10 py-6 sm:py-9 shadow-soft"
          style={{ background: "#F7F9FC", border: "1px solid #E5E8ED" }}
        >
          {/* Start label */}
          <div className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 z-10 hidden sm:flex flex-col items-center gap-1">
            <div className="w-px h-10 bg-gray-300" />
            <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-gray-400 text-center leading-tight">Start</span>
          </div>

          {/* Finish flag */}
          <div className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-10 flex flex-col items-center">
            <CheckeredFlag />
            <span className="hidden sm:block text-[9px] font-bold uppercase tracking-[0.1em] text-gray-400 mt-1 text-center leading-tight">
              Finish
            </span>
          </div>

          {/* Lanes */}
          <div className="space-y-2.5 sm:space-y-3 mx-0 sm:mx-10">
            {RACE_CARS.map((car) => (
              <div key={car.color} className="relative h-12 sm:h-14">
                {/* Road strip */}
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-9 sm:h-11 rounded-xl bg-white border border-gray-100 overflow-hidden shadow-[inset_0_1px_3px_rgba(0,0,0,0.04)]">
                  <div
                    className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-[2px]"
                    style={{ backgroundImage: "repeating-linear-gradient(90deg,#D1D5DB 0 12px,transparent 12px 26px)" }}
                  />
                </div>
                {/* Car + speed lines */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 flex items-center"
                  style={{ animation: `ccd-drive ${car.dur} cubic-bezier(.42,0,.4,1) infinite`, ["--ccd-end" as string]: car.end } as React.CSSProperties}
                >
                  <div className="flex flex-col gap-[3px] mr-1.5">
                    {Array.from({ length: car.lines }).map((_, k) => (
                      <span
                        key={k}
                        className="block h-[2px] rounded-full"
                        style={{
                          width: `${8 + k * 5}px`,
                          background: car.color,
                          opacity: 0.45,
                          animation: `ccd-speed 0.5s ease-in-out ${k * 0.08}s infinite`,
                        }}
                      />
                    ))}
                  </div>
                  <RaceCar color={car.color} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Level cards */}
        <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
          {RACE_CARS.map((car) => (
            <div
              key={car.color}
              className="group rounded-2xl border border-gray-100 bg-white p-5 hover:border-gray-200 hover:shadow-soft transition-all duration-200"
            >
              {/* Colored top accent */}
              <div className="w-8 h-1 rounded-full mb-4" style={{ background: car.color }} />
              <div className="flex items-center gap-2 mb-2.5">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: car.color }} />
                <span className="font-semibold text-[14px] text-gray-900">{car.label}</span>
              </div>
              <p className="text-[12px] sm:text-[13px] text-gray-500 leading-relaxed">{car.desc}</p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════════ */
export function LandingPage({ user }: LandingPageProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [connectOpen, setConnectOpen] = useState(false);
  const openConnect = () => { setMenuOpen(false); setConnectOpen(true); };

  const dashboardHref =
    user?.role === "super_admin" ? "/super" :
    user?.role === "client_admin" ? "/admin" :
    "/dashboard";

  return (
    <div className="min-h-screen overflow-x-hidden bg-white">

      <LetsConnectModal open={connectOpen} onClose={() => setConnectOpen(false)} />

      {/* Animation keyframes for the car race */}
      <style>{`
        @keyframes ccd-drive {
          0%   { left: 0%;            opacity: 0; }
          7%   { opacity: 1; }
          88%  { opacity: 1; }
          100% { left: var(--ccd-end); opacity: 0; }
        }
        @keyframes ccd-speed {
          0%, 100% { opacity: 0.15; transform: scaleX(0.5); }
          50%      { opacity: 0.75; transform: scaleX(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          [style*="ccd-drive"] { animation: none !important; left: var(--ccd-end) !important; opacity: 1 !important; }
          [style*="ccd-speed"] { animation: none !important; }
        }
      `}</style>

      {/* ══════════════════════════════════════════════════════════
          HERO  (centered)
         ══════════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex flex-col" style={{ background: "#EFEFEF" }}>
        {/* Shader overlay */}
        <div className="absolute inset-0 z-10 pointer-events-none">
          <Shader style={{ width: "100%", height: "100%" }}>
            <Swirl colorA="#ffffff" colorB="#e8f5e9" detail={1.7} />
            <ChromaFlow baseColor="#ffffff" downColor="#22C55E" leftColor="#22C55E" rightColor="#22C55E" upColor="#22C55E" momentum={13} radius={3.5} />
            <FlutedGlass aberration={0.61} angle={31} frequency={8} highlight={0.12} highlightSoftness={0} lightAngle={-90} refraction={4} shape="rounded" softness={1} speed={0.15} />
            <FilmGrain strength={0.05} />
          </Shader>
        </div>

        {/* ── Navbar ───────────────────────────────────────────── */}
        <div className="relative z-20 w-full">
          <div className="mx-auto max-w-[1440px] p-2 sm:p-3">
            <nav className="bg-white rounded-full px-3 py-2 flex items-center justify-between shadow-sm">

              {/* LEFT: wordmark + links */}
              <div className="flex items-center gap-8">
                <Link href="/" className="flex items-center gap-2 shrink-0">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: GREEN }}>
                    <span className="text-white font-bold" style={{ fontSize: "9px", letterSpacing: "0.05em" }}>DH</span>
                  </div>
                  <span className="font-bold text-gray-900 text-[15px] tracking-tight">DhiviHR</span>
                </Link>
                <div className="hidden md:flex items-center gap-6">
                  {NAV_LINKS.map(({ label, href }) =>
                    label === "Enquire Now" ? (
                      <button key={label} onClick={openConnect} className="text-[13px] text-gray-600 hover:text-gray-900 transition-colors duration-200 cursor-pointer">
                        {label}
                      </button>
                    ) : (
                      <Link key={label} href={href} className="text-[13px] text-gray-600 hover:text-gray-900 transition-colors duration-200">
                        {label}
                      </Link>
                    )
                  )}
                </div>
              </div>

              {/* RIGHT: auth */}
              <div className="hidden md:flex items-center gap-3">
                <div className="w-px h-4 bg-gray-200" />
                {user ? (
                  <>
                    <Link href={dashboardHref} className="text-[13px] font-medium text-gray-700 hover:text-gray-900 transition-colors px-3 py-1.5 rounded-full hover:bg-gray-100">
                      Dashboard
                    </Link>
                    <form action={logoutAction}>
                      <button type="submit" className="text-[13px] text-gray-500 hover:text-gray-700 transition-colors cursor-pointer">Logout</button>
                    </form>
                  </>
                ) : (
                  <>
                    <Link href="/login" className="text-[13px] font-medium text-gray-700 hover:text-gray-900 transition-colors px-3 py-1.5 rounded-full hover:bg-gray-100">
                      Login
                    </Link>
                    <Link href="/signup" className="text-[13px] font-medium text-white px-4 py-2 rounded-full transition-colors" style={{ background: GREEN }}>
                      Get Started
                    </Link>
                  </>
                )}
              </div>

              {/* Mobile toggle */}
              <button className="md:hidden bg-gray-900 text-white rounded-full px-3 py-2 flex items-center gap-1.5 text-[13px] font-medium" onClick={() => setMenuOpen(!menuOpen)}>
                {menuOpen ? <X size={15} /> : <Menu size={15} />}
                {menuOpen ? "Close" : "Menu"}
              </button>
            </nav>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div className="absolute inset-0 bg-black/60" onClick={() => setMenuOpen(false)} />
            <div className="absolute bottom-0 left-0 right-0 mx-3 mb-3 bg-white rounded-2xl p-6" style={{ transform: "translateY(0)", transition: "transform 500ms cubic-bezier(0.32,0.72,0,1)" }}>
              <div className="flex flex-col gap-4 mb-6">
                {NAV_LINKS.map(({ label, href }) =>
                  label === "Enquire Now" ? (
                    <button key={label} onClick={openConnect} className="text-[26px] font-medium text-gray-900 leading-tight text-left">{label}</button>
                  ) : (
                    <Link key={label} href={href} className="text-[26px] font-medium text-gray-900 leading-tight" onClick={() => setMenuOpen(false)}>{label}</Link>
                  )
                )}
              </div>
              <div className="border-t border-gray-100 pt-5 flex flex-col gap-3">
                {user ? (
                  <>
                    <Link href={dashboardHref} className="text-[14px] font-medium text-gray-900 text-center py-3 border border-gray-200 rounded-full" onClick={() => setMenuOpen(false)}>Dashboard</Link>
                    <form action={logoutAction}>
                      <button type="submit" className="w-full text-[14px] text-gray-500 text-center cursor-pointer">Logout</button>
                    </form>
                  </>
                ) : (
                  <>
                    <TextRollButton label="Get Started" green href="/signup" className="justify-center" />
                    <Link href="/login" className="text-[13px] text-green-500 text-center hover:text-gray-700" onClick={() => setMenuOpen(false)}>Already have an account? Login</Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Hero content — centered */}
        <div className="relative z-20 flex-1 flex flex-col items-center justify-center text-center">
          <div className="mx-auto w-full max-w-[1100px] px-5 sm:px-8 lg:px-12 py-16">
            <p className="text-gray-600 tracking-wide mb-5 sm:mb-7" style={{ fontSize: "13px" }}>
              Corporate Readiness Platform
            </p>
            <h1 className="font-medium text-gray-900 leading-[1.1] tracking-[-0.03em] mx-auto max-w-[16ch]" style={{ fontSize: "clamp(1.9rem,6vw,4.2rem)" }}>
              Know where you stand today and what it takes to become Corporate ready tomorrow.
            </h1>
            <div className="mt-8 sm:mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-5">
              <TextRollButton label="Take the Assessment" green href="/signup" className="pl-5 sm:pl-6" />
              <a href="/trial" className="group rounded-3xl inline-flex items-center gap-2.5 bg-white px-6 py-2.5"
                style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.08)", transition: "box-shadow 300ms ease" }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 4px 16px rgba(0,0,0,0.12)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)")}>
                <span className="text-[13px] sm:text-[14px] font-medium text-gray-900">Take trial</span>
                <ArrowRightIcon className="w-4 h-4 text-brand-500 transition-transform duration-300 ease-out group-hover:translate-x-1" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          CAR RACE  (its own attractive section)
         ══════════════════════════════════════════════════════════ */}
      <CarRaceSection />

      {/* ══════════════════════════════════════════════════════════
          STATS BAR
         ══════════════════════════════════════════════════════════ */}
      <section style={{ background: GREEN }}>
        <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">
          <div className="grid grid-cols-2 md:grid-cols-4">
            {STATS.map((s, i) => (
              <div key={s.label} className="py-10 px-6 text-center" style={{ borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.15)" : "none" }}>
                <div className="text-white font-bold leading-none" style={{ fontSize: "clamp(2rem,5vw,3.5rem)" }}>
                  {s.value}{s.suffix}
                </div>
                <div className="mt-2 text-[11px] uppercase tracking-[0.18em] text-white/70">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          STEP 1 — INTRODUCING CRAFTe  (before / after)
         ══════════════════════════════════════════════════════════ */}
      <section id="crafte" className="bg-white pt-16 sm:pt-20 lg:pt-28 pb-12 sm:pb-16 lg:pb-24 overflow-hidden">
        <div className="mx-auto w-full max-w-[1440px] px-5 sm:px-8 lg:px-12">
          <SectionBadge number="1" label="Introducing CRAFTe" />
          <h2 className="font-medium text-gray-900 leading-[1.12] tracking-[-0.02em] mb-12 sm:mb-16 max-w-4xl" style={{ fontSize: "clamp(1.5rem,4vw,3.2rem)" }}>
            Measure your corporate readiness across behavioural competencies, professional skills, and AI proficiency.
          </h2>

          <div className="grid md:grid-cols-2 gap-5 sm:gap-6 items-stretch">
            <SilhouettePanel
              badge="Before"
              badgeColor="#EF4444"
              caption="Unaware of the skills employers truly value — working hard, but struggling to stand out in placements and the workplace."
            />
            <SilhouettePanel
              badge="After"
              badgeColor={GREEN}
              caption="Took the assessment, identified the gaps, worked on the competencies — and walked in corporate-ready, confident, and ahead."
            />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          STEP 2 — THE PROCESS
         ══════════════════════════════════════════════════════════ */}
      <section id="process" className="py-20 sm:py-28" style={{ background: "#F0FDF4" }}>
        <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">
          <SectionBadge number="2" label="The Process" />
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div>
              <h2 className="font-medium text-gray-900 leading-[1.1] tracking-[-0.02em] mb-8" style={{ fontSize: "clamp(1.5rem,4vw,3rem)" }}>
                Four simple steps to discover your path to corporate readiness.
              </h2>
              <TextRollButton label="Take the Assessment" green href="/signup" />
            </div>
            <div className="space-y-0">
              {HOW_STEPS.map((s, i) => (
                <div key={s.n} className="flex gap-5 pb-8 last:pb-0">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 font-mono text-[11px] font-bold" style={{ borderColor: GREEN, color: GREEN, background: "#fff" }}>
                      {s.n}
                    </div>
                    {i < HOW_STEPS.length - 1 && <div className="w-px flex-1 mt-3 min-h-[32px]" style={{ background: `${GREEN}40` }} />}
                  </div>
                  <div className="pt-2">
                    <h3 className="font-semibold text-gray-900 text-[15px] mb-1">{s.title}</h3>
                    <p className="text-[13px] text-gray-600 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          STEP 3 — WHAT WE MEASURE  (6 dimensions)
         ══════════════════════════════════════════════════════════ */}
      <section id="measure" className="bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">
          <SectionBadge number="3" label="What we measure" />
          <h2 className="font-medium text-gray-900 leading-[1.1] tracking-[-0.02em] mb-12" style={{ fontSize: "clamp(1.5rem,4vw,3rem)" }}>
            Six dimensions.
            <br />One complete picture.
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {COMPETENCIES.map((c) => {
              const Icon = c.icon;
              return (
                <div key={c.label} className="group rounded-2xl border border-gray-100 bg-white p-6 hover:border-green-200 hover:shadow-md transition-all duration-200">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-transform duration-200 group-hover:scale-105" style={{ background: "#F0FDF4" }}>
                    <Icon size={20} style={{ color: GREEN }} />
                  </div>
                  <h3 className="font-semibold text-gray-900 text-[14px] mb-2">{c.label}</h3>
                  <p className="text-[13px] text-gray-500 leading-relaxed">{c.desc}</p>
                </div>
              );
            })}
          </div>

          {/* Green CTA bar */}
          <div className="mt-6 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5" style={{ background: GREEN }}>
            <div>
              <p className="text-white/80 text-[13px] mb-1">Ready to find your level?</p>
              <h3 className="text-white font-semibold leading-tight" style={{ fontSize: "clamp(1.1rem,2.5vw,1.5rem)" }}>Get your dimension-level breakdown in 20 minutes.</h3>
            </div>
            <Link href="/signup" className="inline-flex items-center gap-2 bg-white text-[14px] font-medium rounded-full px-6 py-3 shrink-0 transition-opacity hover:opacity-90" style={{ color: GREEN }}>
              Try Now <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          STEP 4 + 5 (merged) — BUILT FOR STUDENTS AND INSTITUTIONS
         ══════════════════════════════════════════════════════════ */}
      <section id="students" className="bg-[#F5F5F5] py-20 sm:py-28">
        <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">
          <SectionBadge number="4" label="For students & institutions" />
          <h2 className="font-medium text-gray-900 leading-[1.1] tracking-[-0.02em] mb-2" style={{ fontSize: "clamp(1.5rem,4vw,3rem)" }}>
            Built for students and institutions.
          </h2>
          <p className="text-[15px] sm:text-[16px] text-gray-500 mb-12">One platform. Two entry points.</p>

          <div className="grid md:grid-cols-2 gap-5">
            {/* FOR STUDENTS */}
            <div className="rounded-2xl border border-gray-100 bg-white p-8 sm:p-10 flex flex-col hover:border-green-200 hover:shadow-lg transition-all duration-200">
              {/* small image placeholder */}
              <div className="rounded-xl bg-gray-50 flex items-center justify-center mb-7" style={{ aspectRatio: "16/7" }}>
                <User size={48} className="text-gray-300" strokeWidth={1.25} />
              </div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: GREEN }}>
                  <GraduationCap size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] mb-0.5" style={{ color: GREEN }}>For Students</p>
                  <h3 className="font-bold text-[18px] text-gray-900">Corporate Readiness Assessment</h3>
                </div>
              </div>
              <p className="text-[14px] text-gray-500 leading-relaxed mb-7">Understand your strengths, identify growth opportunities, and prepare for placements with personalized insights and development recommendations.</p>
              <ul className="space-y-3 mb-10 flex-1">
                {["Assess your workplace and AI readiness", "Receive a personalized readiness report", "Identify strengths and improvement areas", "Build a roadmap for career success"].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-[13px] text-gray-600">
                    <CheckCircle2 size={15} className="mt-0.5 shrink-0" style={{ color: GREEN }} />{item}
                  </li>
                ))}
              </ul>
              <TextRollButton label="Take Assessment" green href="/signup" />
            </div>

            {/* FOR COLLEGES */}
            <div id="colleges" className="rounded-2xl p-8 sm:p-10 flex flex-col" style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.06)" }}>
              {/* small image placeholder */}
              <div className="rounded-xl flex items-center justify-center mb-7" style={{ aspectRatio: "16/7", background: "rgba(255,255,255,0.05)" }}>
                <Building2 size={48} className="text-white/25" strokeWidth={1.25} />
              </div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: GREEN }}>
                  <Building2 size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] mb-0.5" style={{ color: GREEN }}>For Colleges</p>
                  <h3 className="font-bold text-[18px] text-white">Campus Readiness Platform</h3>
                </div>
              </div>
              <p className="text-[14px] leading-relaxed mb-7" style={{ color: "rgba(255,255,255,0.45)" }}>Deploy assessments at scale, benchmark student readiness, and access actionable insights to strengthen employability and placement outcomes.</p>
              <ul className="space-y-3 mb-10 flex-1">
                {["Institution-wide assessment deployment", "Batch-wise readiness reporting", "Student segmentation and development insights", "Expert talks and employability programs"].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-[13px]" style={{ color: "rgba(255,255,255,0.45)" }}>
                    <CheckCircle2 size={15} className="mt-0.5 shrink-0" style={{ color: GREEN }} />{item}
                  </li>
                ))}
              </ul>
              <TextRollButton label="Book a Demo" outline onClick={openConnect} />
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          EXPERT TALKS
         ══════════════════════════════════════════════════════════ */}
      <section id="expert-talks" className="bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">
          <SectionBadge number="5" label="Expert Talks" />
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
            {/* Left: copy */}
            <div>
              <h2 className="font-medium text-gray-900 leading-[1.12] tracking-[-0.02em] mb-4" style={{ fontSize: "clamp(1.5rem,4vw,2.6rem)" }}>
                Expert-Led Career Readiness Sessions That Prepare Students for the Real World.
              </h2>
              <p className="text-[15px] text-gray-600 leading-relaxed mb-8">
                Bridge the gap between academics and industry through practical, expert-led sessions designed to help students understand what employers truly look for and prepare for success in the modern workplace.
              </p>

              <div className="space-y-6 mb-10">
                {EXPERT_TOPICS.map((t) => (
                  <div key={t.title} className="flex gap-3">
                    <CheckCircle2 size={18} className="mt-0.5 shrink-0" style={{ color: GREEN }} />
                    <div>
                      <h3 className="font-semibold text-gray-900 text-[14px] mb-1">{t.title}</h3>
                      <p className="text-[13px] text-gray-500 leading-relaxed">{t.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <TextRollButton label="Talk to the team" green onClick={openConnect} />
            </div>

            {/* Right: speaker image placeholders (photos + names added later) */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-gray-400 mb-4 flex items-center gap-2">
                <Mic size={13} style={{ color: GREEN }} /> Our experts
              </p>
              <div className="grid grid-cols-2 gap-4">
                {[0, 1, 2, 3].map((k) => (
                  <div key={k} className="rounded-2xl border border-gray-100 bg-white p-5 flex flex-col items-center text-center">
                    <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                      <User size={40} className="text-gray-300" strokeWidth={1.25} />
                    </div>
                    {/* placeholders for name + designation — fill later */}
                    <div className="h-3 w-24 rounded-full bg-gray-200 mb-2" />
                    <div className="h-2.5 w-16 rounded-full bg-gray-100" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          FINAL CTA
         ══════════════════════════════════════════════════════════ */}
      <section className="py-24 sm:py-32 relative overflow-hidden" style={{ background: GREEN }}>
        <div className="cta-grid absolute inset-0 pointer-events-none opacity-20" aria-hidden />
        <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12 text-center relative">
          <p className="text-white/60 text-[13px] uppercase tracking-[0.18em] mb-4">Get started today</p>
          <h2 className="font-medium text-white leading-[1.08] tracking-[-0.03em] mb-6" style={{ fontSize: "clamp(2rem,6vw,4rem)" }}>
            Start with a score.
          </h2>
          <p className="text-white/70 text-[15px] max-w-sm mx-auto mb-10">
            20 minutes. Honest feedback. A clear direction for what to fix before your next interview.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/signup" className="inline-flex items-center gap-2 bg-white font-medium text-[13px] rounded-full px-6 py-3 transition-opacity hover:opacity-90" style={{ color: GREEN }}>
              Take the Assessment <ArrowRight size={14} />
            </Link>
            <button onClick={openConnect} className="inline-flex items-center gap-2 border border-white/30 text-white/80 hover:text-white text-[13px] font-medium rounded-full px-6 py-3 transition-colors cursor-pointer">
              Talk to the Team
            </button>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          FOOTER
         ══════════════════════════════════════════════════════════ */}
      <footer className="bg-gray-950 text-white pt-16 pb-8">
        <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-14">

            {/* Brand column */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: GREEN }}>
                  <span className="text-white font-bold" style={{ fontSize: "9px" }}>DH</span>
                </div>
                <span className="font-bold text-[16px] tracking-tight">DhiviHR</span>
              </div>
              <p className="text-[13px] text-gray-400 leading-relaxed max-w-xs mb-6">
                Precision employability assessment that gives students and institutions an honest, actionable picture of where they stand.
              </p>
            </div>

            {/* Link columns */}
            {Object.entries(FOOTER_LINKS).map(([heading, links]) => (
              <div key={heading}>
                <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-gray-500 mb-4">{heading}</p>
                <ul className="space-y-3">
                  {links.map(({ label, href }) => (
                    <li key={label}>
                      <Link href={href} className="text-[13px] text-gray-400 hover:text-white transition-colors duration-200">
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom bar */}
          <div className="border-t border-white/5 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[12px] text-gray-600">© {new Date().getFullYear()} DhiviHR. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <Link href="/login" className="text-[12px] text-gray-600 hover:text-gray-400 transition-colors">Login</Link>
              <Link href="/signup" className="text-[12px] text-gray-600 hover:text-gray-400 transition-colors">Sign Up</Link>
              <Link href="mailto:dhivihr@gmail.com" className="text-[12px] text-gray-600 hover:text-gray-400 transition-colors">Contact</Link>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
