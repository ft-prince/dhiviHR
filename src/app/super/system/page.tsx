import { PageHeader } from "@/components/admin/page-header";
import { KpiCard } from "@/components/admin/kpi-card";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { Server, Database, Lock, CreditCard } from "lucide-react";
import { isRazorpayConfigured } from "@/lib/razorpay";

export const dynamic = "force-dynamic";

async function dbPing() {
  const start = Date.now();
  try {
    await db.execute(sql`select 1`);
    return { ok: true as const, ms: Date.now() - start };
  } catch (e) {
    return { ok: false as const, ms: Date.now() - start, error: (e as Error).message };
  }
}

export default async function SuperSystemPage() {
  const ping = await dbPing();
  const razorpay = isRazorpayConfigured();
  const authSet = Boolean(process.env.AUTH_SECRET);

  return (
    <>
      <PageHeader title="System Health" description="Runtime configuration & dependency status." />

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          label="Database"
          value={ping.ok ? "OK" : "DOWN"}
          icon={Database}
          tone={ping.ok ? "accent" : "default"}
          hint={`${ping.ms} ms`}
        />
        <KpiCard
          label="Auth Secret"
          value={authSet ? "Set" : "Missing"}
          icon={Lock}
          tone={authSet ? "accent" : "default"}
        />
        <KpiCard
          label="Razorpay"
          value={razorpay ? "Live" : "Dev mode"}
          icon={CreditCard}
          tone={razorpay ? "accent" : "default"}
          hint={razorpay ? "keys present" : "auto-mark paid"}
        />
        <KpiCard
          label="Runtime"
          value={process.env.NODE_ENV ?? "—"}
          icon={Server}
          hint="Next 15 · OpenNext"
        />
      </section>

      <section className="mt-8 rounded-2xl border border-border bg-white p-6">
        <h2 className="font-display font-bold text-lg text-ink">Deployment</h2>
        <p className="mt-1 text-xs text-ink-soft">Configured for Cloudflare Workers via OpenNext.</p>
        <dl className="mt-4 grid sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <div className="flex justify-between"><dt className="text-ink-soft">Adapter</dt><dd className="text-ink font-medium">@opennextjs/cloudflare</dd></div>
          <div className="flex justify-between"><dt className="text-ink-soft">DB driver</dt><dd className="text-ink font-medium">@neondatabase/serverless (HTTP)</dd></div>
          <div className="flex justify-between"><dt className="text-ink-soft">PDF</dt><dd className="text-ink font-medium">@react-pdf/renderer · Node runtime</dd></div>
          <div className="flex justify-between"><dt className="text-ink-soft">Auth</dt><dd className="text-ink font-medium">Auth.js v5 · JWT sessions</dd></div>
        </dl>
      </section>
    </>
  );
}
