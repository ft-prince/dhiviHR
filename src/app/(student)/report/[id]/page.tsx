import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { and, eq, asc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { assessments, scores, users as usersT, competencies, score_competencies } from "@/lib/db/schema";
import { SiteHeader } from "@/components/marketing/site-header";
import { Button } from "@/components/ui/button";
import { Paywall } from "@/components/payment/paywall";
import { isAssessmentPaid } from "@/lib/payment/actions";
import { READINESS_LEVEL } from "@/lib/utils";
import DownloadButton from "@/components/assessment/downloadButton";

export const dynamic = "force-dynamic";

interface CompetencyDetail {
  average: number;
  gap: "critical_gap" | "development_gap" | "strength";
}

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect(`/login?callbackUrl=/report/${id}`);

  const [row, dbCompetencies] = await Promise.all([
    db
      .select({
        assessment: assessments,
        score: scores,
        score_competencies: score_competencies,
        user: usersT,
      })
      .from(assessments)
      .leftJoin(scores, eq(scores.assessmentId, assessments.id))
      .leftJoin(score_competencies, eq(score_competencies.scoreId, scores.id))
      .leftJoin(usersT, eq(usersT.id, assessments.userId))
      .where(and(eq(assessments.id, id), eq(assessments.userId, session.user.id)))
      ,
    db
      .select({ id: competencies.id, label: competencies.label })
      .from(competencies)
      .orderBy(asc(competencies.orderIndex))
  ]);

  if (!row[0]) notFound();
  const { assessment, score, user } = row[0];
  if (assessment.status !== "completed" || !score) redirect(`/assessment/${id}`);

  const paid = await isAssessmentPaid(id, session.user.id);
  const band = READINESS_LEVEL.find((b) => b.level === score.level)!;
  
  // Cast the breakdown object coming from JSONB
  const breakdownData: Record<string, CompetencyDetail> = {};
  for (const r of row) {
    if (r.score_competencies?.competencyId) {
      breakdownData[r.score_competencies.competencyId] = {
        average: r.score_competencies.average,
        gap: r.score_competencies.gap,
      };
    }
  }
  // Transform DB competencies into a tidy lookup map: { [id]: "Label Name" }
  const labelMap = Object.fromEntries(dbCompetencies.map((c) => [c.id, c.label]));

  return (
    <>
      <SiteHeader user={{ name: session.user.name, role: (session.user as { role?: string }).role }} solid />
      <main className="container-narrow pt-24 sm:pt-28 pb-12">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="display-headline text-3xl sm:text-4xl">Your Readiness Report</h1>
          <Link href="/dashboard" className="self-start sm:self-auto">
            <Button variant="ghost">Back to dashboard</Button>
          </Link>
        </div>

        {!paid ? (
          <div className="mt-8 sm:mt-10 grid md:grid-cols-2 gap-6 sm:gap-8">
            <div className="rounded-2xl bg-brand-50 border border-brand-100 p-6 sm:p-8 relative overflow-hidden">
              <div className="absolute inset-0 backdrop-blur-sm bg-white/40 grid place-items-center z-10">
                <div className="bg-white rounded-pill px-4 py-2 text-xs font-bold uppercase tracking-widest text-brand-700 shadow-soft">
                  Locked
                </div>
              </div>
              <div className="text-xs font-bold uppercase tracking-widest text-brand-600">Preview</div>
              <div className="mt-2 display-headline text-2xl sm:text-3xl">{paid ? band.label : "████████"}</div>
              <div className="mt-1 text-ink-muted">Total Score</div>
              <div className="mt-1 display-headline text-4xl sm:text-5xl text-brand-600">██ / 100</div>
            </div>
            <Paywall assessmentId={id} userName={user?.name ?? null} userEmail={user?.email ?? null} />
          </div>
        ) : (
          <FullReport
            total={score.total}
            band={band}
            breakdown={breakdownData}
            labelMap={labelMap}
            track={score.track}
            assessmentId={id}
          />
        )}
      </main>
    </>
  );
}

function FullReport({
  total,
  band,
  breakdown,
  labelMap,
  track,
  assessmentId,
}: {
  total: number;
  band: (typeof READINESS_LEVEL)[number];
  breakdown: Record<string, CompetencyDetail>;
  labelMap: Record<string, string>;
  track: string;
  assessmentId: string;
}) {
  const getGapStyling = (gap: string) => {
    switch (gap) {
      case "strength": return { bar: "bg-brand-500", text: "text-brand-700 bg-brand-50", label: "Strength" };
      case "development_gap": return { bar: "bg-amber-500", text: "text-amber-700 bg-amber-50", label: "Development Gap" };
      default: return { bar: "bg-red-500", text: "text-red-700 bg-red-50", label: "Critical Gap" };
    }
  };
  return (
    <div className="mt-8 sm:mt-10">
      <div className="grid md:grid-cols-3 gap-5">
        <div className="md:col-span-2 rounded-2xl border border-border bg-white p-6 sm:p-8 shadow-soft">
          <div className="text-xs font-bold uppercase tracking-widest text-brand-600">Overall Score (Scale 1-4)</div>
          <div className="mt-2 display-headline text-5xl sm:text-6xl text-brand-600">
            {total} <span className="text-ink-soft text-2xl sm:text-3xl">/ 4.0</span>
          </div>
          <div className="mt-4 display-headline text-2xl">{band?.label || "Assessment Completed"}</div>
          <div className="mt-6">
            <DownloadButton assessmentId={assessmentId} />
          </div>
        </div>
        <div className="rounded-2xl border border-brand-100 bg-brand-50 p-6">
          <div className="text-xs font-bold uppercase tracking-widest text-brand-700">Next Step</div>
          <p className="mt-2 text-sm text-ink">
            Based on your level, join us via WhatsApp to construct your professional path!
          </p>
          <a href="https://wa.me/919780973238" target="_blank" rel="noopener noreferrer" className="mt-4 inline-block">
            <Button size="sm">Join via WhatsApp</Button>
          </a>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-border bg-white p-6 sm:p-8">
  <h2 className="display-headline text-xl sm:text-2xl">Competency Gaps</h2>
  <div className="mt-6 space-y-6">
    {Object.entries(labelMap)
    .filter(([compId]) => breakdown[compId])
    .map(([compId, labelName]) => {
      
      // 1. SAFELY GRAB THE DATA:
      // If breakdown[compId] is completely undefined, we fall back to a safe empty object.
      const competencyRow = breakdown[compId] || {};
      
      // 2. APPLY DEFAULTS FOR NESTED METRICS:
      // If average or gap don't exist on that object, default them cleanly.
      const averageValue = typeof competencyRow === 'number' 
        ? competencyRow  // Handles old database rows where breakdown was a raw number
        : (competencyRow.average ?? 0); // Handles new nested object structural layout
        
      const gapStatus = competencyRow.gap ?? "critical_gap";
      const styles = getGapStyling(gapStatus);

      return (
        <div key={compId} className="border-b border-gray-50 pb-4 last:border-0 last:pb-0">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-sm mb-2 gap-1">
            <span className="font-medium text-ink">{labelName}</span>
            <div className="flex items-center gap-3">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${styles.text}`}>
                {styles.label}
              </span>
              {/* This is now completely safe from throwing a "Cannot read properties of undefined" error! */}
              <span className="text-ink-muted font-mono font-medium">{averageValue} / 4.0</span>
            </div>
          </div>
          <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
            <div
              className={`h-full transition-all ${styles.bar}`}
              style={{ width: `${(averageValue / 4) * 100}%` }}
            />
          </div>
        </div>
      );
    })}
  </div>
</div>
    </div>
  );
}