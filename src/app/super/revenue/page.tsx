import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { payments, users } from "@/lib/db/schema";
import { PageHeader } from "@/components/admin/page-header";
import { KpiCard } from "@/components/admin/kpi-card";
import { DataTable } from "@/components/admin/data-table";
import { getPlatformStats, getRevenueByDay } from "@/lib/admin/stats";

export const dynamic = "force-dynamic";

export default async function SuperRevenuePage() {
  const [stats, byDay, recent] = await Promise.all([
    getPlatformStats(),
    getRevenueByDay(30),
    db
      .select({
        id: payments.id,
        amount: payments.amount,
        status: payments.status,
        userName: users.name,
        userEmail: users.email,
        razorpayOrderId: payments.razorpayOrderId,
        createdAt: payments.createdAt,
      })
      .from(payments)
      .leftJoin(users, eq(users.id, payments.userId))
      .orderBy(desc(payments.createdAt))
      .limit(50),
  ]);

  const totalRev30 = byDay.reduce((s, r) => s + r.amount, 0);

  return (
    <>
      <PageHeader title="Revenue" description="Order ledger and 30-day collections." />

      <section className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <KpiCard label="Lifetime" value={`₹${stats.revenueInr.toLocaleString("en-IN")}`} tone="accent" />
        <KpiCard label="30 days" value={`₹${(totalRev30 / 100).toLocaleString("en-IN")}`} />
        <KpiCard label="Paid orders" value={stats.paidCount} hint={`${stats.conversionPct}% conversion`} />
      </section>

      <section className="mt-8">
        <h2 className="font-display font-bold text-lg text-ink mb-3">Recent Orders</h2>
        <DataTable
          rows={recent}
          emptyText="No payments yet"
          columns={[
            { key: "when", header: "When", render: (r) => new Date(r.createdAt).toLocaleString() },
            { key: "user", header: "User", render: (r) => (
              <div>
                <div className="font-medium text-ink">{r.userName ?? "—"}</div>
                <div className="text-xs text-ink-soft">{r.userEmail}</div>
              </div>
            )},
            { key: "amount", header: "Amount", render: (r) => `₹${(r.amount / 100).toLocaleString("en-IN")}` },
            { key: "status", header: "Status", render: (r) => (
              <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                r.status === "paid" ? "bg-brand-500 text-white" :
                r.status === "failed" ? "bg-destructive text-white" :
                "bg-brand-50 text-brand-700"
              }`}>{r.status}</span>
            )},
            { key: "order", header: "Order", render: (r) => <code className="text-xs text-ink-soft">{r.razorpayOrderId ?? "—"}</code> },
          ]}
        />
      </section>
    </>
  );
}
