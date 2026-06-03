"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { logoutAction } from "@/lib/auth/actions";
import {
  ArrowRight, Clock, Menu, X, CheckCircle2,
  BarChart3, MessageSquare, Users, Zap, Target,
  GraduationCap, Building2, ChevronRight,
} from "lucide-react";
import { Shader, Swirl, ChromaFlow, FlutedGlass, FilmGrain } from "shaders/react";
import Image from "next/image";

/* ─── Types ─────────────────────────────────────────────────────── */
interface User { name?: string | null; role?: string }
interface LandingPageProps { user?: User | null }

/* ─── Utilities ──────────────────────────────────────────────────── */
const GREEN = "#22C55E";
const GREEN_DARK = "#16a34a";

function getLondonTime(): string {
  return new Date().toLocaleTimeString("en-GB", {
    hour: "2-digit", minute: "2-digit",
    timeZone: "Europe/London", hour12: false,
  });
}

/* ─── Data ───────────────────────────────────────────────────────── */
const NAV_LINKS = [
  { label: "Assessment", href: "/signup" },
  { label: "For Colleges", href: "#colleges" },
  { label: "Features", href: "#features" },
  { label: "Contact", href: "mailto:dhivihr@gmail.com" },
];

const STATS = [
  { value: "20", suffix: " min", label: "Average completion" },
  { value: "5", suffix: "", label: "Competency dimensions" },
  { value: "4", suffix: "", label: "Readiness bands" },
  { value: "100", suffix: "%", label: "Personalized output" },
];

const HOW_STEPS = [
  { n: "01", title: "Complete the Assessment", desc: "20 targeted questions across five competency dimensions, calibrated to real interview evaluation criteria." },
  { n: "02", title: "Get Dimension-Level Scores", desc: "Instant results with a precise breakdown by competency — not a vague composite number, but actionable scores." },
  { n: "03", title: "Land in Your Readiness Band", desc: "Placed into one of four performance levels based on actual scores, not self-reported confidence." },
  { n: "04", title: "Follow Your Track", desc: "A targeted development plan built around your specific gaps — a path calibrated to where you actually are." },
];

const COMPETENCIES = [
  { icon: MessageSquare, label: "Communication & Confidence", desc: "Express yourself clearly under pressure. Structure thoughts before speaking. Convey confidence even when the answer isn't obvious." },
  { icon: BarChart3, label: "Problem Solving", desc: "Analyze constraints, form hypotheses, and arrive at logical solutions — the way interviewers actually evaluate thinking." },
  { icon: Users, label: "Teamwork & Leadership", desc: "Navigate group dynamics, take ownership of outcomes, and demonstrate collaborative instincts without prompting." },
  { icon: Zap, label: "Initiative & Growth", desc: "Show that you act without being told and improve without being pushed. The habit that separates hires from almost-hires." },
  { icon: Target, label: "Interview Readiness", desc: "Perform at your peak when it counts — composure under pressure, clarity under scrutiny, preparation that shows." },
];

const FOOTER_LINKS = {
  Platform: [
    { label: "Take Assessment", href: "/signup" },
    { label: "For Colleges", href: "#colleges" },
    { label: "Features", href: "#features" },
    { label: "Readiness Bands", href: "#features" },
  ],
  Company: [
    { label: "About DhiviHR", href: "#about" },
    { label: "Contact Us", href: "mailto:dhivihr@gmail.com" },
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
  ],
};

/* ─── TextRoll Button ────────────────────────────────────────────── */
interface BtnProps { label: string; dark?: boolean; green?: boolean; outline?: boolean; className?: string; onClick?: () => void; href?: string }

function TextRollButton({ label, dark, green, outline, className = "", onClick, href }: BtnProps) {
  // NOTE: Tailwind only generates classes from static literals, so runtime-
  // interpolated `bg-[${GREEN}]` would never be emitted. The green variant
  // therefore sets its colour via inline style instead of a dynamic class.
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

/* ─── SVGs ────────────────────────────────────────────────────────── */
function StarburstIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className={className} style={style} fill="currentColor">
      <path d="m19.6 66.5 19.7-11 .3-1-.3-.5h-1l-3.3-.2-11.2-.3L14 53l-9.5-.5-2.4-.5L0 49l.2-1.5 2-1.3 2.9.2 6.3.5 9.5.6 6.9.4L38 49.1h1.6l.2-.7-.5-.4-.4-.4L29 41l-10.6-7-5.6-4.1-3-2-1.5-2-.6-4.2 2.7-3 3.7.3.9.2 3.7 2.9 8 6.1L37 36l1.5 1.2.6-.4.1-.3-.7-1.1L33 25l-6-10.4-2.7-4.3-.7-2.6c-.3-1-.4-2-.4-3l3-4.2L28 0l4.2.6L33.8 2l2.6 6 4.1 9.3L47 29.9l2 3.8 1 3.4.3 1h.7v-.5l.5-7.2 1-8.7 1-11.2.3-3.2 1.6-3.8 3-2L61 2.6l2 2.9-.3 1.8-1.1 7.7L59 27.1l-1.5 8.2h.9l1-1.1 4.1-5.4 6.9-8.6 3-3.5L77 13l2.3-1.8h4.3l3.1 4.7-1.4 4.9-4.4 5.6-3.7 4.7-5.3 7.1-3.2 5.7.3.4h.7l12-2.6 6.4-1.1 7.6-1.3 3.5 1.6.4 1.6-1.4 3.4-8.2 2-9.6 2-14.3 3.3-.2.1.2.3 6.4.6 2.8.2h6.8l12.6 1 3.3 2 1.9 2.7-.3 2-5.1 2.6-6.8-1.6-16-3.8-5.4-1.3h-.8v.4l4.6 4.5 8.3 7.5L89 80.1l.5 2.4-1.3 2-1.4-.2-9.2-7-3.6-3-8-6.8h-.5v.7l1.8 2.7 9.8 14.7.5 4.5-.7 1.4-2.6 1-2.7-.6-5.8-8-6-9-4.7-8.2-.5.4-2.9 30.2-1.3 1.5-3 1.2-2.5-2-1.4-3 1.4-6.2 1.6-8 1.3-6.4 1.2-7.9.7-2.6v-.2H49L43 72l-9 12.3-7.2 7.6-1.7.7-3-1.5.3-2.8L24 86l10-12.8 6-7.9 4-4.6-.1-.5h-.3L17.2 77.4l-4.7.6-2-2 .2-3 1-1 8-5.5Z" />
    </svg>
  );
}

function LinkIconSvg({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
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

/* ─── Expanding Card Button (for video cards) ─────────────────────── */
function ExpandBtn({ label, dark }: { label: string; dark?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={ref}
      className={`absolute bottom-4 left-4 rounded-full flex items-center overflow-hidden cursor-pointer ${dark ? "bg-gray-900" : "bg-white"}`}
      style={{ height: 36, width: 36, transition: "width 300ms ease-in-out" }}
      onMouseEnter={() => { if (ref.current) { ref.current.style.width = `${label.length * 8 + 56}px`; const t = ref.current.querySelector<HTMLSpanElement>(".et"); if (t) t.style.opacity = "1"; } }}
      onMouseLeave={() => { if (ref.current) { ref.current.style.width = "36px"; const t = ref.current.querySelector<HTMLSpanElement>(".et"); if (t) t.style.opacity = "0"; } }}
    >
      <span className="et text-[13px] font-medium whitespace-nowrap pl-3 shrink-0" style={{ opacity: 0, transition: "opacity 200ms ease 100ms", color: dark ? "#fff" : "#111827" }}>{label}</span>
      <div className="ml-auto mr-1.5 shrink-0">
        <ArrowRight size={14} color={dark ? "#fff" : "#111827"} />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════════ */
export function LandingPage({ user }: LandingPageProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [time, setTime] = useState("");

  useEffect(() => {
    setTime(getLondonTime());
    const id = setInterval(() => setTime(getLondonTime()), 1000);
    return () => clearInterval(id);
  }, []);

  const dashboardHref =
    user?.role === "super_admin" ? "/super" :
    user?.role === "client_admin" ? "/admin" :
    "/dashboard";

  return (
    <div className="min-h-screen overflow-x-hidden bg-white">

      {/* ══════════════════════════════════════════════════════════
          HERO
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
                  {NAV_LINKS.map(({ label, href }) => (
                    <Link key={label} href={href} className="text-[13px] text-gray-600 hover:text-gray-900 transition-colors duration-200">
                      {label}
                    </Link>
                  ))}
                </div>
              </div>

              {/* RIGHT: time + auth */}
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
                {NAV_LINKS.map(({ label, href }) => (
                  <Link key={label} href={href} className="text-[26px] font-medium text-gray-900 leading-tight" onClick={() => setMenuOpen(false)}>{label}</Link>
                ))}
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
                    <TextRollButton label="Take the Assessment" green href="/signup" className="justify-center" />
                    <Link href="/login" className="text-[13px] text-green-500 text-center hover:text-gray-700" onClick={() => setMenuOpen(false)}>Already have an account? Login</Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Hero content — pinned to bottom */}
        <div className="relative z-20 flex-1 flex flex-col">
          <div className="flex-1" />
          <div className="mx-auto w-full max-w-[1440px] px-5 sm:px-8 lg:px-12 pb-14 sm:pb-16 lg:pb-20">
            <p className="text-gray-600 tracking-wide mb-5 sm:mb-8" style={{ fontSize: "13px" }}>
              Employability Assessment Platform
            </p>
            <h1 className="font-medium text-gray-900 leading-[1.08] tracking-[-0.03em]" style={{ fontSize: "clamp(1.75rem,7vw,4.2rem)" }}>
              Know exactly where you stand
              <br className="hidden sm:block" /><span className="sm:hidden"> </span>
              across five competency
              <br className="hidden sm:block" /><span className="sm:hidden"> </span>
              dimensions.
            </h1>
            <div className="mt-8 sm:mt-12 flex flex-col sm:flex-row items-start gap-4 sm:gap-5">
              <TextRollButton label="Take the Assessment" green href="/signup" className="pl-5 sm:pl-6" />
              <div
                className="inline-flex items-center gap-2.5 bg-white px-3 sm:px-4 py-2 rounded-[4px] cursor-default"
                style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.08)", transition: "box-shadow 300ms ease" }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 16px rgba(0,0,0,0.12)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)")}
              >
                <StarburstIcon className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: GREEN }} />
                <span className="text-[13px] sm:text-[14px] font-medium text-gray-900">Trusted by Colleges</span>
                <span className="text-[10px] sm:text-[11px] text-white px-1.5 sm:px-2 py-0.5 rounded" style={{ background: GREEN }}>Verified</span>
              </div>
            </div>
          </div>
        </div>
      </section>

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
          ABOUT
         ══════════════════════════════════════════════════════════ */}
      <section id="about" className="bg-white pt-16 sm:pt-20 lg:pt-32 pb-12 sm:pb-16 lg:pb-24 overflow-hidden">
        <div className="mx-auto w-full max-w-[1440px]">
          <div className="px-5 sm:px-8 lg:px-12">
            <SectionBadge number="1" label="Introducing DhiviHR" />
            <h2 className="font-medium text-gray-900 leading-[1.12] tracking-[-0.02em] mb-12 sm:mb-16 lg:mb-24" style={{ fontSize: "clamp(1.5rem,4vw,3.2rem)" }}>
              Research-backed assessment, delivering
              <br />
              precision scores students can act on.
            </h2>
          </div>

          {/* Mobile/Tablet */}
          <div className="lg:hidden px-5 sm:px-8">
            <p className="text-[15px] sm:text-[17px] leading-[1.6] font-medium text-gray-900 mb-6">
              Through structured evaluation and targeted feedback we help students close their employability gaps before the interview that matters most.
            </p>
            <TextRollButton label="About our platform" green href="#features" className="mb-8" />
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-5">
              <div className="sm:w-[45%]">
                <img src="https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260516_090123_74be96d4-9c1b-40cf-932a-96f4f4babed3.png&w=1280&q=85" alt="Platform" className="w-full rounded-xl sm:rounded-2xl object-cover" style={{ aspectRatio: "438/346" }} />
              </div>
              <div className="sm:w-[55%]">
                <img src="https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260516_090133_c157d30b-a99a-4477-bec1-a446149ec3f2.png&w=1280&q=85" alt="Students" className="w-full rounded-xl sm:rounded-2xl object-cover" style={{ aspectRatio: "900/600" }} />
              </div>
            </div>
          </div>

          {/* Desktop */}
          <div className="hidden lg:grid px-5 sm:px-8 lg:px-12" style={{ gridTemplateColumns: "26% 1fr 48%", gap: "1.5rem", alignItems: "end" }}>
            <div style={{ alignSelf: "end" }}>
              <img src="https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260516_090123_74be96d4-9c1b-40cf-932a-96f4f4babed3.png&w=1280&q=85" alt="Platform" className="w-full rounded-2xl object-cover" style={{ aspectRatio: "438/346" }} />
            </div>
            <div className="flex flex-col justify-end items-end" style={{ alignSelf: "start" }}>
              <p className="text-[16px] leading-[1.65] font-medium text-gray-900 mb-6 whitespace-nowrap">
                Through structured evaluation and<br />targeted feedback we help students<br />close their employability gaps.
              </p>
              <TextRollButton label="About our platform" green href="#features" />
            </div>
            <div style={{ alignSelf: "end" }}>
              <img src="https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260516_090133_c157d30b-a99a-4477-bec1-a446149ec3f2.png&w=1280&q=85" alt="Students" className="w-full rounded-2xl object-cover" style={{ aspectRatio: "3/2" }} />
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          HOW IT WORKS
         ══════════════════════════════════════════════════════════ */}
      <section id="features" className="py-20 sm:py-28" style={{ background: "#F0FDF4" }}>
        <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">
          <SectionBadge number="2" label="The Process" />
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div>
              <h2 className="font-medium text-gray-900 leading-[1.1] tracking-[-0.02em] mb-6" style={{ fontSize: "clamp(1.5rem,4vw,3rem)" }}>
                Four steps to knowing
                <br />exactly where you stand.
              </h2>
              <p className="text-[15px] text-gray-600 leading-relaxed mb-8 max-w-sm">
                A structured path from not knowing where you stand to knowing exactly what to fix before your next interview.
              </p>
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
          COMPETENCIES
         ══════════════════════════════════════════════════════════ */}
      <section className="bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">
          <SectionBadge number="3" label="What we measure" />
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-12">
            <h2 className="font-medium text-gray-900 leading-[1.1] tracking-[-0.02em]" style={{ fontSize: "clamp(1.5rem,4vw,3rem)" }}>
              Five dimensions.
              <br />One complete picture.
            </h2>
            <p className="text-[14px] text-gray-500 max-w-xs leading-relaxed">
              Each maps directly to what recruiters evaluate — not theory, but the real criteria behind offer decisions.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {COMPETENCIES.map((c, i) => {
              const Icon = c.icon;
              const isLast = i === COMPETENCIES.length - 1;
              return (
                <div key={c.label} className={`group rounded-2xl border border-gray-100 bg-white p-6 hover:border-green-200 hover:shadow-md transition-all duration-200 ${isLast ? "sm:col-span-2 lg:col-span-1" : ""}`}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-transform duration-200 group-hover:scale-105" style={{ background: "#F0FDF4" }}>
                    <Icon size={20} style={{ color: GREEN }} />
                  </div>
                  <h3 className="font-semibold text-gray-900 text-[14px] mb-2">{c.label}</h3>
                  <p className="text-[13px] text-gray-500 leading-relaxed">{c.desc}</p>
                </div>
              );
            })}
            {/* Sixth cell: CTA card */}
            <div className="rounded-2xl p-6 flex flex-col justify-between" style={{ background: GREEN }}>
              <div>
                <p className="text-white/80 text-[13px] mb-2">Ready to find your score?</p>
                <h3 className="text-white font-semibold text-[16px] leading-tight">Get your dimension-level breakdown in 20 minutes.</h3>
              </div>
              <Link href="/signup" className="mt-6 inline-flex items-center gap-2 bg-white text-[13px] font-medium rounded-full px-4 py-2 self-start transition-opacity hover:opacity-90" style={{ color: GREEN }}>
                Start now <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          PLATFORM IN ACTION
         ══════════════════════════════════════════════════════════ */}
      <section className="bg-[#F5F5F5] pt-16 sm:pt-20 lg:pt-28 pb-16 sm:pb-20 lg:pb-28">
        <div className="mx-auto w-full max-w-[1440px] px-5 sm:px-8 lg:px-12">
          <SectionBadge number="4" label="Platform in action" />
          <h2 className="font-medium text-gray-900 leading-[1.08] tracking-[-0.03em] mb-10 sm:mb-14 lg:mb-16" style={{ fontSize: "clamp(1.75rem,7vw,4.2rem)" }}>
            Built for students
            <br className="hidden sm:block" />and institutions.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 lg:gap-7">
            <div>
              <div className="group relative rounded-2xl overflow-hidden bg-[#1a1d2e] cursor-pointer" style={{ aspectRatio: "329/246" }}>
                <video src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260516_122702_390f5305-8719-41d5-ae80-d23ab3796c28.mp4" autoPlay muted loop playsInline className="w-full h-full object-cover" />
                <ExpandBtn label="Learn more" />
              </div>
              <p className="text-[13px] sm:text-[14px] text-gray-600 mt-4 leading-relaxed">Students complete 20 targeted questions and receive instant dimension-level scores across all five competencies.</p>
              <p className="text-[14px] sm:text-[15px] font-semibold text-gray-900 mt-1">Student Assessment</p>
            </div>
            <div>
              <div className="group relative rounded-2xl overflow-hidden bg-[#0d2e1a] cursor-pointer" style={{ aspectRatio: "1/1" }}>
                
                <Image
                src='https://images.pexels.com/photos/8199557/pexels-photo-8199557.jpeg'
alt="College deployment" className="w-full h-full object-cover"
width={400}
height={300}
/>
                <ExpandBtn label="View details" dark />
              </div>
              <p className="text-[13px] sm:text-[14px] text-gray-600 mt-4 leading-relaxed">Colleges deploy code-gated assessments at batch scale — students are auto-segmented into four readiness bands with targeted workshop tracks.</p>
              <p className="text-[14px] sm:text-[15px] font-semibold text-gray-900 mt-1">College Deployment</p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          TWO PATHS
         ══════════════════════════════════════════════════════════ */}
      <section id="colleges" className="bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">
          <SectionBadge number="5" label="Access paths" />
          <h2 className="font-medium text-gray-900 leading-[1.1] tracking-[-0.02em] mb-12" style={{ fontSize: "clamp(1.5rem,4vw,3rem)" }}>
            One platform.
            <br />Two entry points.
          </h2>
          <div className="grid md:grid-cols-2 gap-5">
            {/* Student */}
            <div className="rounded-2xl border border-gray-100 bg-white p-8 sm:p-10 flex flex-col hover:border-green-200 hover:shadow-lg transition-all duration-200">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: GREEN }}>
                  <GraduationCap size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] mb-0.5" style={{ color: GREEN }}>Individual</p>
                  <h3 className="font-bold text-[18px] text-gray-900">Student Assessment</h3>
                </div>
              </div>
              <p className="text-[14px] text-gray-500 leading-relaxed mb-8">Take the assessment independently. Get your readiness score, understand your dimension-level gaps, and access a personalized development track.</p>
              <ul className="space-y-3 mb-10 flex-1">
                {["Complete the assessment — free", "Unlock your full scored report", "Join a targeted workshop or 1-on-1 session"].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-[13px] text-gray-600">
                    <CheckCircle2 size={15} className="mt-0.5 shrink-0" style={{ color: GREEN }} />{item}
                  </li>
                ))}
              </ul>
              <TextRollButton label="Take the Assessment" green href="/signup" />
            </div>

            {/* College */}
            <div className="rounded-2xl p-8 sm:p-10 flex flex-col" style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: GREEN }}>
                  <Building2 size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] mb-0.5" style={{ color: GREEN }}>Institutional</p>
                  <h3 className="font-bold text-[18px] text-white">College Deployment</h3>
                </div>
              </div>
              <p className="text-[14px] leading-relaxed mb-8" style={{ color: "rgba(255,255,255,0.45)" }}>Deploy assessments at batch scale. Segment students into readiness bands and run level-specific workshop tracks with full placement analytics.</p>
              <ul className="space-y-3 mb-10 flex-1">
                {["Code-gated access for batch management", "Automatic segmentation into 4 readiness bands", "College-specific workshop track deployment"].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-[13px]" style={{ color: "rgba(255,255,255,0.45)" }}>
                    <CheckCircle2 size={15} className="mt-0.5 shrink-0" style={{ color: GREEN }} />{item}
                  </li>
                ))}
              </ul>
              <TextRollButton label="I Have a College Code" outline href="/signup/student" />
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
            <a href="mailto:dhivihr@gmail.com" className="inline-flex items-center gap-2 border border-white/30 text-white/80 hover:text-white text-[13px] font-medium rounded-full px-6 py-3 transition-colors">
              Talk to the Team
            </a>
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

