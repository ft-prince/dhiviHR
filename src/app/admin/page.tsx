import Link from "next/link";
import { PageHeader } from "@/components/admin/page-header";
import { KpiCard } from "@/components/admin/kpi-card";
import { DataTable } from "@/components/admin/data-table";
import { getPlatformStats, getRecentAttempts, getRecentSignups, getLevelDistribution } from "@/lib/admin/stats";
import { Users, BookOpenCheck, IndianRupee, GraduationCap, TrendingUp } from "lucide-react";
import { READINESS_BANDS, fmtDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const [stats, attempts, signups, dist] = await Promise.all([
    getPlatformStats(),
    getRecentAttempts(8),
    getRecentSignups(6),
    getLevelDistribution(),
  ]);
  const distMap = new Map(dist.map((d) => [d.level, d.count]));
  const distMax = Math.max(...dist.map((d) => d.count), 1);

  return (
    <>
      <PageHeader title="Overview" description="Platform health at a glance — users, attempts, conversion, and revenue." />

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Total Users" value={stats.totalUsers} icon={Users} hint={`${stats.studentUsers} public · ${stats.collegeStudents} college`} />
        <KpiCard label="Attempts" value={stats.totalAttempts} icon={BookOpenCheck} hint={`${stats.completedAttempts} completed`} />
        <KpiCard label="Conversion" value={`${stats.conversionPct}%`} icon={TrendingUp} hint={`${stats.paidCount} paid reports`} />
        <KpiCard label="Revenue" value={`₹${stats.revenueInr.toLocaleString("en-IN")}`} icon={IndianRupee} tone="accent" hint="paid attempts" />
      </section>

      <section className="grid lg:grid-cols-3 gap-4 mt-8">
        <div className="rounded-2xl border border-border bg-white p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-lg text-ink">Readiness Distribution</h2>
            <Link href="/admin/analytics" className="text-xs text-brand-600 font-bold uppercase tracking-widest">View analytics →</Link>
          </div>
          <div className="space-y-4">
            {READINESS_BANDS.map((b) => {
              const c = distMap.get(b.level) ?? 0;
              return (
                <div key={b.level}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-medium text-ink">{b.label}</span>
                    <span className="text-ink-soft">{c} {c === 1 ? "candidate" : "candidates"}</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-brand-50 overflow-hidden">
                    <div className="h-full bg-brand-500" style={{ width: `${(c / distMax) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-white p-6">
          <h2 className="font-display font-bold text-lg text-ink mb-4">Colleges & Codes</h2>
          <KpiCard label="Colleges" value={stats.totalColleges} icon={GraduationCap} />
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-brand-50/60 p-3">
              <div className="text-[10px] font-bold uppercase tracking-widest text-ink-soft">Issued</div>
              <div className="font-display text-2xl font-bold text-ink">{stats.codesIssued}</div>
            </div>
            <div className="rounded-lg bg-brand-50/60 p-3">
              <div className="text-[10px] font-bold uppercase tracking-widest text-ink-soft">Redeemed</div>
              <div className="font-display text-2xl font-bold text-ink">{stats.codesRedeemed}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid lg:grid-cols-2 gap-4 mt-8">
        <div>
          <h2 className="font-display font-bold text-lg text-ink mb-3">Recent Attempts</h2>
          <DataTable
            rows={attempts.map((a) => ({ ...a, id: a.id ?? "" }))}
            emptyText="No attempts yet"
            columns={[
              { key: "user", header: "Candidate", render: (r) => (
                <div>
                  <div className="font-medium text-ink">{r.userName ?? "—"}</div>
                  <div className="text-xs text-ink-soft">{r.userEmail}</div>
                </div>
              )},
              { key: "score", header: "Score", render: (r) => r.total ?? "—" },
              { key: "level", header: "Level", render: (r) => r.level ? READINESS_BANDS.find((b) => b.level === r.level)?.label : "—" },
              { key: "when", header: "When", render: (r) => fmtDate(r.startedAt) },
            ]}
          />
        </div>
        <div>
          <h2 className="font-display font-bold text-lg text-ink mb-3">Recent Signups</h2>
          <DataTable
            rows={signups}
            emptyText="No signups yet"
            columns={[
              { key: "name", header: "Name", render: (r) => <span className="font-medium text-ink">{r.name ?? "—"}</span> },
              { key: "email", header: "Email", render: (r) => <span className="text-ink-soft">{r.email}</span> },
              { key: "role", header: "Role", render: (r) => <span className="rounded-full bg-brand-50 text-brand-700 px-2 py-0.5 text-xs font-bold">{r.role.replace("_", " ")}</span> },
              { key: "joined", header: "Joined", render: (r) => fmtDate(r.createdAt) },
            ]}
          />
        </div>
      </section>
    </>
  );
}
