import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { colleges, accessCodes, users } from "@/lib/db/schema";
import { PageHeader } from "@/components/admin/page-header";
import { DataTable } from "@/components/admin/data-table";
import { CollegeCreateForm } from "@/components/admin/college-create-form";

export const dynamic = "force-dynamic";

export default async function AdminCollegesPage() {
  const list = await db
    .select({
      id: colleges.id,
      name: colleges.name,
      slug: colleges.slug,
      contactEmail: colleges.contactEmail,
      contactPhone: colleges.contactPhone,
      createdAt: colleges.createdAt,
      codesTotal: sql<number>`(SELECT count(*)::int FROM ${accessCodes} WHERE ${accessCodes.collegeId} = ${colleges.id})`,
      codesRedeemed: sql<number>`(SELECT count(*)::int FROM ${accessCodes} WHERE ${accessCodes.collegeId} = ${colleges.id} AND redeemed_at IS NOT NULL)`,
      students: sql<number>`(SELECT count(*)::int FROM ${users} WHERE ${users.collegeId} = ${colleges.id})`,
    })
    .from(colleges)
    .orderBy(desc(colleges.createdAt));

  return (
    <>
      <PageHeader
        title="Colleges"
        description="Institutions registered on the platform. Create a college, then issue access-code batches."
      />
      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        <DataTable
          rows={list}
          emptyText="No colleges yet — add your first one →"
          columns={[
            { key: "name", header: "Name", render: (r) => (
              <div>
                <div className="font-medium text-ink">{r.name}</div>
                <div className="text-xs text-ink-soft">{r.slug}</div>
              </div>
            )},
            { key: "contact", header: "Contact", render: (r) => (
              <div className="text-xs">
                <div>{r.contactEmail ?? "—"}</div>
                <div className="text-ink-soft">{r.contactPhone ?? ""}</div>
              </div>
            )},
            { key: "students", header: "Students", render: (r) => r.students },
            { key: "codes", header: "Codes", render: (r) => (
              <span>
                <b className="text-ink">{r.codesRedeemed}</b>
                <span className="text-ink-soft"> / {r.codesTotal}</span>
              </span>
            )},
            { key: "joined", header: "Added", render: (r) => new Date(r.createdAt).toLocaleDateString() },
          ]}
        />
        <div className="rounded-2xl border border-border bg-white p-6">
          <h2 className="font-display font-bold text-lg text-ink">Add College</h2>
          <p className="mt-1 text-xs text-ink-soft">Then issue an access-code batch from the Access Codes page.</p>
          <CollegeCreateForm />
        </div>
      </div>
    </>
  );
}
