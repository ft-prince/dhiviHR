import { PageHeader } from "@/components/admin/page-header";
import { KpiCard } from "@/components/admin/kpi-card";
import { getPlatformStats, getLevelDistribution, getRevenueByDay } from "@/lib/admin/stats";
import { READINESS_LEVEL } from "@/lib/utils";
import { COMPETENCY_LABELS } from "@/lib/scoring";

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  const [stats, dist, revenue] = await Promise.all([
    getPlatformStats(),
    getLevelDistribution(),
    getRevenueByDay(14),
  ]);
  const distMap = new Map(dist.map((d) => [d.level, d.count]));
  const distTotal = Math.max(dist.reduce((s, d) => s + d.count, 0), 1);
  const revMax = Math.max(...revenue.map((r) => r.amount), 1);

  return (
    <>
      <PageHeader title="Analytics" description="Funnel performance, readiness distribution, and 14-day revenue." />

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Attempts" value={stats.totalAttempts} hint={`${stats.completedAttempts} completed`} />
        <KpiCard label="Paid Reports" value={stats.paidCount} hint={`${stats.conversionPct}% conversion`} />
        <KpiCard label="Revenue" value={`₹${stats.revenueInr.toLocaleString("en-IN")}`} tone="accent" />
        <KpiCard label="Codes Redeemed" value={stats.codesRedeemed} hint={`${stats.codesIssued} issued`} />
      </section>

      <section className="grid lg:grid-cols-2 gap-6 mt-8">
        <div className="rounded-2xl border border-border bg-white p-6">
          <h2 className="font-display font-bold text-lg text-ink">Readiness Distribution</h2>
          <p className="text-xs text-ink-soft">Share of completed assessments per band.</p>
          <div className="mt-6 space-y-4">
            {READINESS_LEVEL.map((level) => {
              const n = distMap.get(level.level) ?? 0;
              const pct = Math.round((n / distTotal) * 100);
              return (
                <div key={level.level}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-medium">{level.label}</span>
                    <span className="text-ink-soft">{n} ({pct}%)</span>
                  </div>
                  <div className="h-3 rounded-full bg-brand-50 overflow-hidden">
                    <div className="h-full bg-brand-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-white p-6">
          <h2 className="font-display font-bold text-lg text-ink">Revenue · last 14 days</h2>
          <p className="text-xs text-ink-soft">Paid attempts by day. Empty bars mean no sales that day.</p>
          <div className="mt-6 flex items-end gap-1.5 h-40">
            {revenue.length === 0 ? (
              <div className="grid w-full place-items-center text-sm text-ink-soft">No revenue yet</div>
            ) : (
              revenue.map((r) => (
                <div key={r.day} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-brand-500 rounded-t"
                    title={`${r.day}: ₹${(r.amount / 100).toLocaleString("en-IN")} (${r.count})`}
                    style={{ height: `${(r.amount / revMax) * 100}%`, minHeight: 4 }}
                  />
                  <div className="text-[9px] text-ink-soft">{r.day.slice(5)}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-border bg-white p-6">
        <h2 className="font-display font-bold text-lg text-ink">Competencies tracked</h2>
        <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-5 gap-2">
          {Object.values(COMPETENCY_LABELS).map((label) => (
            <div key={label} className="rounded-pill bg-brand-50 text-brand-700 px-4 py-2 text-center text-xs font-medium">
              {label}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
