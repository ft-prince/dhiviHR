import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { Cloverleaf } from "@/components/marketing/cloverleaf";
import { READINESS_BANDS } from "@/lib/utils";
import { COMPETENCY_LABELS, COMPETENCIES } from "@/lib/scoring";
import { ArrowRight, CheckCircle2, GraduationCap, Building2 } from "lucide-react";

const PROCESS_STEPS = [
  { title: "Training Needs Diagnosis", desc: "Identification of high-impact development areas" },
  { title: "Role-Based Learning Architecture", desc: "Right learning for the right audience." },
  { title: "Customized Module Design", desc: "Higher relevance and faster adoption." },
  { title: "Delivery Roadmap & Calendar", desc: "Smooth implementation with measurable momentum" },
  { title: "Effectiveness Measurement Built-In", desc: "Visible ROI from training investments." },
];

const APPROACH_BENEFITS = [
  "Stronger leadership bench strength",
  "Higher employee productivity",
  "Improved manager accountability",
  "Stronger culture during growth phase",
  "Scalable people capability systems",
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      <SiteHeader />

      {/* Decorative top blob */}
      <div className="pointer-events-none absolute top-16 left-1/2 -translate-x-1/2 h-32 w-[420px] rounded-b-[120px] bg-brand-500/90" aria-hidden />

      {/* Hero */}
      <section className="container-narrow pt-16 pb-24 relative">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="order-2 lg:order-1">
            <Cloverleaf logoPosition="tr" />
          </div>
          <div className="order-1 lg:order-2 animate-fade-in">
            <h1 className="display-headline text-5xl md:text-6xl leading-[1.05]">
              Build Better People.<br />
              Build Stronger Organizations.
            </h1>
            <p className="mt-6 font-display text-lg text-ink-muted">Training &amp; Development</p>
            <div className="mt-6">
              <Link href="/signup" className="pill-cta">
                Start Now <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <p className="mt-8 max-w-md text-ink-muted leading-relaxed">
              We&apos;re excited to share our comprehensive human resources and training strategy with you today.
              Our approach focuses on developing talent while building a stronger organizational culture.
            </p>
          </div>
        </div>
      </section>

      {/* Why our HR approach works */}
      <section className="bg-ink text-white py-20 relative overflow-hidden">
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 h-32 w-[420px] rounded-b-[120px] bg-brand-500" aria-hidden />
        <div className="container-narrow grid md:grid-cols-2 gap-14 items-center relative">
          <div className="flex justify-center">
            <div className="rounded-full bg-brand-500 h-60 w-60 grid place-items-center shadow-glow">
              <div className="text-center">
                <svg viewBox="0 0 100 50" width="120" height="60" aria-hidden>
                  <circle cx="28" cy="14" r="9" fill="#fff" />
                  <circle cx="72" cy="36" r="9" fill="#fff" />
                  <path d="M10 44 Q 50 -8, 90 44" fill="none" stroke="#fff" strokeWidth="7" strokeLinecap="round" />
                </svg>
                <div className="font-display font-bold tracking-[0.18em] mt-2">DHIVI HR</div>
              </div>
            </div>
          </div>
          <div>
            <h2 className="display-headline text-4xl md:text-5xl text-white">
              Why Our<br />HR Approach Works
            </h2>
            <p className="mt-4 text-white/80 leading-relaxed">
              We understand that great employees are your most valuable asset for long-term success.
              You&apos;ll see how our HR Rehabb strategies transform workplace culture and performance.
            </p>
            <ul className="mt-6 space-y-3">
              {APPROACH_BENEFITS.map((b) => (
                <li key={b} className="rounded-pill bg-brand-500/90 px-5 py-2.5 text-white flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span className="text-sm">{b}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* How we create */}
      <section id="how" className="container-narrow py-20">
        <h2 className="display-headline text-3xl md:text-5xl text-center">
          How We Create the Custom<br />Training Structure
        </h2>
        <div className="mt-14 grid grid-cols-2 md:grid-cols-5 gap-5">
          {PROCESS_STEPS.map((s, i) => (
            <div key={s.title} className="flex flex-col items-center text-center">
              <div className="w-full rounded-2xl border-2 border-brand-200 bg-white shadow-soft p-5 min-h-[170px] flex flex-col justify-center">
                <div className="font-display font-bold text-ink">{s.title}</div>
                <div className="mt-2 text-xs text-ink-muted">{s.desc}</div>
              </div>
              <div className="h-6 w-px bg-brand-300" />
              <div className="h-11 w-11 rounded-full bg-brand-500 text-white grid place-items-center font-display font-bold shadow-glow">
                {String(i + 1).padStart(2, "0")}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Readiness Levels */}
      <section id="levels" className="bg-brand-50 py-20">
        <div className="container-narrow">
          <div className="text-center mb-12">
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-brand-600">Market-aligned</div>
            <h2 className="mt-2 display-headline text-3xl md:text-5xl">Readiness Levels</h2>
            <p className="mt-3 text-ink-muted max-w-2xl mx-auto">
              Premium employability bands designed to align with recruiter language and institutional credibility.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {READINESS_BANDS.map((b, i) => (
              <div
                key={b.level}
                className="rounded-2xl border border-brand-100 bg-white p-6 hover:shadow-card hover:-translate-y-1 transition-all"
              >
                <div className="h-10 w-10 rounded-full bg-brand-500 text-white grid place-items-center font-display font-bold mb-4 shadow-glow">
                  {i + 1}
                </div>
                <div className="text-xs font-bold text-brand-600">{b.min}–{b.max} MARKS</div>
                <div className="mt-1 font-display font-bold text-xl text-ink">{b.label}</div>
                <div className="mt-3 text-sm text-ink-muted">{b.track}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Two funnels */}
      <section id="colleges" className="container-narrow py-20">
        <h2 className="display-headline text-3xl md:text-5xl text-center">Two Funnels. One Engine.</h2>
        <div className="mt-12 grid md:grid-cols-2 gap-6">
          <div className="rounded-2xl border-2 border-brand-200 bg-white p-8 hover:shadow-card transition-shadow">
            <div className="flex items-center gap-2 text-brand-600">
              <GraduationCap className="h-5 w-5" />
              <span className="text-xs font-bold uppercase tracking-[0.18em]">Public Funnel</span>
            </div>
            <h3 className="mt-2 font-display font-bold text-2xl text-ink">Student Self-Assessment</h3>
            <ol className="mt-5 space-y-3 text-sm text-ink-muted">
              <li className="flex gap-3"><Step n={1} /><span>Complete the readiness assessment for free</span></li>
              <li className="flex gap-3"><Step n={2} /><span>Unlock your full report for <b className="text-brand-600">₹199</b></span></li>
              <li className="flex gap-3"><Step n={3} /><span>Join a workshop or book a 1-1 consultation</span></li>
            </ol>
            <div className="mt-6"><Link href="/signup"><Button>Take the Assessment</Button></Link></div>
          </div>
          <div className="rounded-2xl border-2 border-brand-200 bg-white p-8 hover:shadow-card transition-shadow">
            <div className="flex items-center gap-2 text-brand-600">
              <Building2 className="h-5 w-5" />
              <span className="text-xs font-bold uppercase tracking-[0.18em]">College Funnel</span>
            </div>
            <h3 className="mt-2 font-display font-bold text-2xl text-ink">Institutional Mapping</h3>
            <ol className="mt-5 space-y-3 text-sm text-ink-muted">
              <li className="flex gap-3"><Step n={1} /><span>Student enters with a unique access code</span></li>
              <li className="flex gap-3"><Step n={2} /><span>System segments students into 4 readiness levels</span></li>
              <li className="flex gap-3"><Step n={3} /><span>College runs level-specific workshop tracks</span></li>
            </ol>
            <div className="mt-6"><Link href="/signup/student"><Button variant="outline">I have a College Code</Button></Link></div>
          </div>
        </div>
      </section>

      {/* Workshop Tracks dark band */}
      <section id="tracks" className="bg-ink text-white py-20">
        <div className="container-narrow">
          <div className="text-center mb-12">
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-brand-300">Workshop Tracks</div>
            <h2 className="mt-2 display-headline text-3xl md:text-5xl text-white">Targeted Development at Every Level</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {READINESS_BANDS.map((b, i) => (
              <div key={b.level} className="rounded-2xl bg-white/5 border border-white/10 p-6 hover:bg-white/10 transition">
                <div className="text-xs text-brand-300 font-bold uppercase tracking-widest">Level {i + 1}</div>
                <div className="mt-2 font-display font-bold text-lg">{b.label}</div>
                <div className="mt-3 text-sm text-white/70">{b.track}</div>
              </div>
            ))}
          </div>
          <div className="mt-12 grid md:grid-cols-5 gap-3">
            {COMPETENCIES.map((c) => (
              <div key={c} className="rounded-pill bg-brand-500/90 px-4 py-2 text-center text-xs font-medium">
                {COMPETENCY_LABELS[c]}
              </div>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}

function Step({ n }: { n: number }) {
  return (
    <span className="h-6 w-6 shrink-0 rounded-full bg-brand-500 text-white grid place-items-center text-xs font-bold">
      {n}
    </span>
  );
}
