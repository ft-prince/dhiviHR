import { fmtDate } from "@/lib/utils";
import { PageHeader } from "@/components/admin/page-header";
import { KpiCard } from "@/components/admin/kpi-card";
import { getPlatformStats, getRevenueByDay, getRecentSignups } from "@/lib/admin/stats";
import { DataTable } from "@/components/admin/data-table";
import { Users, IndianRupee, BookOpenCheck, TrendingUp, GraduationCap, Ticket } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SuperOverviewPage() {
  const [stats, revenue, signups] = await Promise.all([
    getPlatformStats(),
    getRevenueByDay(30),
    getRecentSignups(8),
  ]);
  const revMax = Math.max(...revenue.map((r) => r.amount), 1);
  const totalRev30 = revenue.reduce((s, r) => s + r.amount, 0);

  return (
    <>
      <PageHeader
        title="Platform Overview"
        description="Single pane of glass for the entire DHIVI HR platform — internal team only."
      />
      <section className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiCard label="Total Users" value={stats.totalUsers} icon={Users} hint={`${stats.studentUsers + stats.collegeStudents} students`} />
        <KpiCard label="Paid Reports" value={stats.paidCount} icon={BookOpenCheck} hint={`${stats.conversionPct}% of completed`} />
        <KpiCard label="Lifetime Revenue" value={`₹${stats.revenueInr.toLocaleString("en-IN")}`} icon={IndianRupee} tone="accent" />
        <KpiCard label="Revenue · 30d" value={`₹${(totalRev30 / 100).toLocaleString("en-IN")}`} icon={TrendingUp} />
        <KpiCard label="Colleges" value={stats.totalColleges} icon={GraduationCap} />
        <KpiCard label="Codes Issued / Redeemed" value={`${stats.codesRedeemed} / ${stats.codesIssued}`} icon={Ticket} />
      </section>

      <section className="mt-8 rounded-2xl border border-border bg-white p-6">
        <h2 className="font-display font-bold text-lg text-ink">Revenue · last 30 days</h2>
        <div className="mt-6 flex items-end gap-1 h-44">
          {revenue.length === 0 ? (
            <div className="grid w-full place-items-center text-sm text-ink-soft">No revenue in this window</div>
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
      </section>

      <section className="mt-8">
        <h2 className="font-display font-bold text-lg text-ink mb-3">Recent Signups</h2>
        <DataTable
          rows={signups}
          emptyText="No signups yet"
          columns={[
            { key: "name", header: "Name", render: (r) => <span className="font-medium text-ink">{r.name ?? "—"}</span> },
            { key: "email", header: "Email", render: (r) => r.email },
            { key: "role", header: "Role", render: (r) => (
              <span className="rounded-full bg-brand-50 text-brand-700 px-2 py-0.5 text-xs font-bold">{r.role.replace("_", " ")}</span>
            )},
            { key: "joined", header: "Joined", render: (r) => fmtDate(r.createdAt) },
          ]}
        />
      </section>
    </>
  );
}
