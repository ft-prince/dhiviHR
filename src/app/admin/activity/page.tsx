import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { auditLogs, users } from "@/lib/db/schema";
import { PageHeader } from "@/components/admin/page-header";
import { DataTable } from "@/components/admin/data-table";

export const dynamic = "force-dynamic";

export default async function AdminActivityPage() {
  const rows = await db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      target: auditLogs.target,
      meta: auditLogs.meta,
      createdAt: auditLogs.createdAt,
      actor: users.name,
      actorEmail: users.email,
    })
    .from(auditLogs)
    .leftJoin(users, eq(users.id, auditLogs.actorId))
    .orderBy(desc(auditLogs.createdAt))
    .limit(100);

  return (
    <>
      <PageHeader title="Activity Log" description="Recent admin actions across the platform." />
      <DataTable
        rows={rows}
        emptyText="No admin activity yet"
        columns={[
          { key: "when", header: "When", render: (r) => (
            <div className="text-xs">
              <div>{new Date(r.createdAt).toLocaleDateString()}</div>
              <div className="text-ink-soft">{new Date(r.createdAt).toLocaleTimeString()}</div>
            </div>
          )},
          { key: "actor", header: "Actor", render: (r) => (
            <div>
              <div className="font-medium text-ink">{r.actor ?? "system"}</div>
              <div className="text-xs text-ink-soft">{r.actorEmail ?? ""}</div>
            </div>
          )},
          { key: "action", header: "Action", render: (r) => (
            <span className="rounded-full bg-brand-50 text-brand-700 px-2 py-0.5 text-xs font-bold">{r.action}</span>
          )},
          { key: "target", header: "Target", render: (r) => <code className="text-xs text-ink-soft">{r.target ?? "—"}</code> },
        ]}
      />
    </>
  );
}
