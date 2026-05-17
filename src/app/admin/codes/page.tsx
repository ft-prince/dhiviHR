import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { accessCodes, accessCodeBatches, colleges } from "@/lib/db/schema";
import { PageHeader } from "@/components/admin/page-header";
import { DataTable } from "@/components/admin/data-table";
import { CodeBatchForm } from "@/components/admin/code-batch-form";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminCodesPage() {
  const batches = await db
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
    .orderBy(desc(accessCodeBatches.createdAt));

  const collegeList = await db.select({ id: colleges.id, name: colleges.name }).from(colleges).orderBy(colleges.name);

  return (
    <>
      <PageHeader
        title="Access Codes"
        description="Issue single-use codes per college. Students use them at /signup/student to register."
      />
      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        <DataTable
          rows={batches.map((b) => ({ ...b, id: b.id }))}
          emptyText="No batches yet — issue your first batch →"
          columns={[
            { key: "label", header: "Batch", render: (r) => (
              <div>
                <div className="font-medium text-ink">{r.label}</div>
                <div className="text-xs text-ink-soft">{r.collegeName ?? "—"}</div>
              </div>
            )},
            { key: "size", header: "Codes", render: (r) => r.size },
            { key: "created", header: "Created", render: (r) => new Date(r.createdAt).toLocaleDateString() },
            { key: "actions", header: "", render: (r) => (
              <Link href={`/api/admin/code-batches/${r.id}/csv`} className="text-brand-600 font-semibold hover:underline text-xs">
                Download CSV ↓
              </Link>
            )},
          ]}
        />
        <div className="rounded-2xl border border-border bg-white p-6">
          <h2 className="font-display font-bold text-lg text-ink">Issue Batch</h2>
          <p className="mt-1 text-xs text-ink-soft">Generates N single-use codes for a college.</p>
          <CodeBatchForm colleges={collegeList} />
        </div>
      </div>
    </>
  );
}
