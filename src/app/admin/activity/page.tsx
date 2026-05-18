import { desc, eq, ilike, or, and, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { auditLogs, users } from "@/lib/db/schema";
import { PageHeader } from "@/components/admin/page-header";
import { ActivityLogClient } from "@/components/admin/activity-log-client";
import { Pagination } from "@/components/admin/pagination";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

export default async function AdminActivityPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const action = sp.action ?? "";
  const page = Math.max(1, Number(sp.page ?? 1));

  const filters = [];
  if (q) filters.push(or(ilike(auditLogs.action, `%${q}%`), ilike(auditLogs.target, `%${q}%`))!);
  if (action) filters.push(eq(auditLogs.action, action));
  const where = filters.length ? and(...filters) : undefined;

  const [rows, [{ total }], actionOptions] = await Promise.all([
    db
      .select({ id: auditLogs.id, action: auditLogs.action, target: auditLogs.target, meta: auditLogs.meta, createdAt: auditLogs.createdAt, actor: users.name, actorEmail: users.email })
      .from(auditLogs)
      .leftJoin(users, eq(users.id, auditLogs.actorId))
      .where(where)
      .orderBy(desc(auditLogs.createdAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ total: sql<number>`count(*)::int` }).from(auditLogs).where(where),
    db.select({ action: auditLogs.action }).from(auditLogs).groupBy(auditLogs.action).orderBy(auditLogs.action),
  ]);

  return (
    <>
      <PageHeader title="Activity Log" description="Admin actions across the platform, newest first." />
      <ActivityLogClient
        rows={rows}
        filters={{ q, action }}
        actionOptions={actionOptions.map((r) => r.action)}
      />
      <Pagination total={total} page={page} pageSize={PAGE_SIZE} />
    </>
  );
}
