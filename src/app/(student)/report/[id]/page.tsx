import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { assessments, scores, users as usersT } from "@/lib/db/schema";
import { SiteHeader } from "@/components/marketing/site-header";
import { Button } from "@/components/ui/button";
import { Paywall } from "@/components/payment/paywall";
import { isAssessmentPaid } from "@/lib/payment/actions";
import { COMPETENCY_LABELS, type Competency } from "@/lib/scoring";
import { READINESS_BANDS } from "@/lib/utils";
import { Download } from "lucide-react";

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect(`/login?callbackUrl=/report/${id}`);

  const row = await db
    .select({
      assessment: assessments,
      score: scores,
      user: usersT,
    })
    .from(assessments)
    .leftJoin(scores, eq(scores.assessmentId, assessments.id))
    .leftJoin(usersT, eq(usersT.id, assessments.userId))
    .where(and(eq(assessments.id, id), eq(assessments.userId, session.user.id)))
    .limit(1);

  if (!row[0]) notFound();
  const { assessment, score, user } = row[0];
  if (assessment.status !== "completed" || !score) redirect(`/assessment/${id}`);

  const paid = await isAssessmentPaid(id, session.user.id);
  const band = READINESS_BANDS.find((b) => b.level === score.level)!;
  const breakdown = (score.breakdown as Record<Competency, number>) ?? {};

  return (
    <>
      <SiteHeader user={{ name: session.user.name, role: (session.user as { role?: string }).role }} solid />
      <main className="container-narrow pt-24 sm:pt-28 pb-12">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="display-headline text-3xl sm:text-4xl">Your Readiness Report</h1>
          <Link href="/dashboard" className="self-start sm:self-auto"><Button variant="ghost">Back to dashboard</Button></Link>
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
              <div className="mt-2 display-headline text-2xl sm:text-3xl">{band.label}</div>
              <div className="mt-1 text-ink-muted">Total Score</div>
              <div className="mt-1 display-headline text-4xl sm:text-5xl text-brand-600">██ / 100</div>
            </div>
            <Paywall assessmentId={id} userName={user?.name ?? null} userEmail={user?.email ?? null} />
          </div>
        ) : (
          <FullReport
            total={score.total}
            band={band}
            breakdown={breakdown}
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
  track,
  assessmentId,
}: {
  total: number;
  band: (typeof READINESS_BANDS)[number];
  breakdown: Record<Competency, number>;
  track: string;
  assessmentId: string;
}) {
  return (
    <div className="mt-8 sm:mt-10">
      <div className="grid md:grid-cols-3 gap-5">
        <div className="md:col-span-2 rounded-2xl border border-border bg-white p-6 sm:p-8 shadow-soft">
          <div className="text-xs font-bold uppercase tracking-widest text-brand-600">Total Score</div>
          <div className="mt-2 display-headline text-5xl sm:text-6xl text-brand-600">{total} <span className="text-ink-soft text-2xl sm:text-3xl">/ 100</span></div>
          <div className="mt-4 display-headline text-2xl">{band.label}</div>
          <div className="mt-3 inline-flex rounded-pill bg-brand-50 text-brand-700 px-4 py-1.5 text-xs font-bold uppercase tracking-wider">{track}</div>
          <div className="mt-6">
            <a href={`/api/report/${assessmentId}/pdf`} target="_blank" rel="noopener">
              <Button><Download className="h-4 w-4" /> Download PDF</Button>
            </a>
          </div>
        </div>
        <div className="rounded-2xl border border-brand-100 bg-brand-50 p-6">
          <div className="text-xs font-bold uppercase tracking-widest text-brand-700">Next Step</div>
          <p className="mt-2 text-sm text-ink">
            Based on your level, we recommend the <b>{track}</b>.
          </p>
          <a href="https://wa.me/919780973238?text=Hi%2C%20I%20want%20to%20join%20the%20DHIVI%20HR%20workshop." target="_blank" rel="noopener" className="mt-4 inline-block">
            <Button size="sm">Join via WhatsApp</Button>
          </a>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-border bg-white p-6 sm:p-8">
        <h2 className="display-headline text-xl sm:text-2xl">Competency Breakdown</h2>
        <div className="mt-6 space-y-5">
          {(Object.keys(COMPETENCY_LABELS) as Competency[]).map((c) => {
            const v = breakdown[c] ?? 0;
            return (
              <div key={c}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium">{COMPETENCY_LABELS[c]}</span>
                  <span className="text-ink-muted">{v.toFixed(1)} / 20</span>
                </div>
                <div className="h-3 rounded-full bg-brand-50 overflow-hidden">
                  <div className="h-full bg-brand-500 transition-all" style={{ width: `${(v / 20) * 100}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
