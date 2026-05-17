import { sql, gte, asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, assessments } from "@/lib/db/schema";
import { PageHeader } from "@/components/admin/page-header";
import { KpiCard } from "@/components/admin/kpi-card";

export const dynamic = "force-dynamic";

async function userGrowth(days = 30) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return db
    .select({
      day: sql<string>`to_char(created_at, 'YYYY-MM-DD')`,
      count: sql<number>`count(*)::int`,
    })
    .from(users)
    .where(gte(users.createdAt, since))
    .groupBy(sql`to_char(created_at, 'YYYY-MM-DD')`)
    .orderBy(asc(sql`to_char(created_at, 'YYYY-MM-DD')`));
}

async function attemptGrowth(days = 30) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return db
    .select({
      day: sql<string>`to_char(started_at, 'YYYY-MM-DD')`,
      count: sql<number>`count(*)::int`,
    })
    .from(assessments)
    .where(gte(assessments.startedAt, since))
    .groupBy(sql`to_char(started_at, 'YYYY-MM-DD')`)
    .orderBy(asc(sql`to_char(started_at, 'YYYY-MM-DD')`));
}

export default async function SuperGrowthPage() {
  const [growth, attempts] = await Promise.all([userGrowth(30), attemptGrowth(30)]);
  const max = Math.max(...growth.map((g) => g.count), ...attempts.map((a) => a.count), 1);
  const total30 = growth.reduce((s, g) => s + g.count, 0);
  const totalAtt = attempts.reduce((s, g) => s + g.count, 0);

  return (
    <>
      <PageHeader title="Growth" description="User signups and assessment attempts, day by day." />

      <section className="grid grid-cols-2 gap-4 mb-8">
        <KpiCard label="New users · 30d" value={total30} />
        <KpiCard label="Attempts started · 30d" value={totalAtt} />
      </section>

      <section className="rounded-2xl border border-border bg-white p-6">
        <h2 className="font-display font-bold text-lg text-ink">Daily Signups vs Attempts</h2>
        <p className="text-xs text-ink-soft">Green = signups, dark = attempts.</p>
        <div className="mt-6 flex items-end gap-1 h-48">
          {growth.length === 0 && attempts.length === 0 ? (
            <div className="grid w-full place-items-center text-sm text-ink-soft">No data yet</div>
          ) : (
            Array.from(new Set([...growth.map((g) => g.day), ...attempts.map((a) => a.day)]))
              .sort()
              .map((day) => {
                const g = growth.find((x) => x.day === day)?.count ?? 0;
                const a = attempts.find((x) => x.day === day)?.count ?? 0;
                return (
                  <div key={day} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex items-end gap-0.5 h-full">
                      <div className="w-1/2 bg-brand-500 rounded-t" style={{ height: `${(g / max) * 100}%`, minHeight: g > 0 ? 4 : 0 }} title={`${day}: ${g} signups`} />
                      <div className="w-1/2 bg-ink rounded-t" style={{ height: `${(a / max) * 100}%`, minHeight: a > 0 ? 4 : 0 }} title={`${day}: ${a} attempts`} />
                    </div>
                    <div className="text-[9px] text-ink-soft">{day.slice(5)}</div>
                  </div>
                );
              })
          )}
        </div>
      </section>
    </>
  );
}
