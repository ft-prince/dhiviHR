import { desc, eq, ilike, and } from "drizzle-orm";
import { fmtDate } from "@/lib/utils";
import Link from "next/link";
import { db } from "@/lib/db";
import { accessCodes, accessCodeBatches, colleges } from "@/lib/db/schema";
import { sql } from "drizzle-orm";
import { PageHeader } from "@/components/admin/page-header";
import { DataTable } from "@/components/admin/data-table";
import { CodeBatchForm } from "@/components/admin/code-batch-form";
import { CodeBatchDeleteButton } from "@/components/admin/code-batch-delete-button";
import { CodesFilterBar } from "@/components/admin/codes-filter-bar";
import { Pagination } from "@/components/admin/pagination";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;

export default async function AdminCodesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const collegeFilter = sp.college ?? "";
  const page = Math.max(1, Number(sp.page ?? 1));

  const filters = [];
  if (q) filters.push(ilike(accessCodeBatches.label, `%${q}%`));
  if (collegeFilter) filters.push(eq(accessCodeBatches.collegeId, collegeFilter));
  const where = filters.length > 0 ? and(...filters) : undefined;

  const [batches, [{ total }], collegeList] = await Promise.all([
    db
      .select({
        id: accessCodeBatches.id,
        label: accessCodeBatches.label,
        size: accessCodeBatches.size,
        collegeName: colleges.name,
        collegeId: colleges.id,
        createdAt: accessCodeBatches.createdAt,
      })
      .from(accessCodeBatches)
      .leftJoin(colleges, eq(accessCodeBatches.collegeId, colleges.id))
      .where(where)
      .orderBy(desc(accessCodeBatches.createdAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ total: sql<number>`count(*)::int` }).from(accessCodeBatches).where(where),
    db.select({ id: colleges.id, name: colleges.name }).from(colleges).orderBy(colleges.name),
  ]);

  return (
    <>
      <PageHeader
        title="Access Codes"
        description="Issue single-use codes per college. Students use them at /signup/student to register."
      />
      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        <div className="min-w-0">
          <CodesFilterBar filters={{ q, college: collegeFilter }} colleges={collegeList} />
          <DataTable
            rows={batches}
            emptyText={q || collegeFilter ? "No batches match the current filters." : "No batches yet — issue your first batch →"}
            columns={[
              {
                key: "label",
                header: "Batch",
                render: (r) => (
                  <div>
                    <div className="font-medium text-ink">{r.label}</div>
                    <div className="text-xs text-ink-soft">{r.collegeName ?? "—"}</div>
                  </div>
                ),
              },
              { key: "size", header: "Codes", render: (r) => r.size },
              { key: "created", header: "Created", render: (r) => fmtDate(r.createdAt) },
              {
                key: "actions",
                header: "",
                render: (r) => (
                  <div className="flex items-center gap-2">
                    <Link href={`/api/admin/code-batches/${r.id}/csv`} className="text-brand-600 font-semibold hover:underline text-xs">
                      CSV ↓
                    </Link>
                    <CodeBatchDeleteButton batchId={r.id} />
                  </div>
                ),
              },
            ]}
          />
          <Pagination total={total} page={page} pageSize={PAGE_SIZE} />
        </div>
        <div className="rounded-2xl border border-border bg-white p-6">
          <h2 className="font-display font-bold text-lg text-ink">Issue Batch</h2>
          <p className="mt-1 text-xs text-ink-soft">Generates N single-use codes for a college.</p>
          <CodeBatchForm colleges={collegeList} />
        </div>
      </div>
    </>
  );
}
