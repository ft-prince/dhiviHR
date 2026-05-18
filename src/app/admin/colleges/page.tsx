import { desc, sql, ilike, and } from "drizzle-orm";
import { fmtDate } from "@/lib/utils";
import Link from "next/link";
import { db } from "@/lib/db";
import { colleges, accessCodes, users } from "@/lib/db/schema";
import { PageHeader } from "@/components/admin/page-header";
import { DataTable } from "@/components/admin/data-table";
import { CollegeCreateForm } from "@/components/admin/college-create-form";
import { CollegesFilterBar } from "@/components/admin/colleges-filter-bar";
import { Pagination } from "@/components/admin/pagination";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

export default async function AdminCollegesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const page = Math.max(1, Number(sp.page ?? 1));

  const where = q
    ? ilike(colleges.name, `%${q}%`)
    : undefined;

  const [list, [{ total }]] = await Promise.all([
    db
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
      .where(where)
      .orderBy(desc(colleges.createdAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ total: sql<number>`count(*)::int` }).from(colleges).where(where),
  ]);

  return (
    <>
      <PageHeader
        title="Colleges"
        description="Institutions registered on the platform. Click a college to manage it."
      />
      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        <div>
          <CollegesFilterBar filters={{ q }} />
          <DataTable
            rows={list}
            emptyText={q ? "No colleges match the current search." : "No colleges yet — add your first one →"}
            columns={[
              {
                key: "name",
                header: "Name",
                render: (r) => (
                  <Link href={`/admin/colleges/${r.id}`} className="block hover:underline">
                    <div className="font-medium text-ink">{r.name}</div>
                    <div className="text-xs text-ink-soft">{r.slug}</div>
                  </Link>
                ),
              },
              {
                key: "contact",
                header: "Contact",
                render: (r) => (
                  <div className="text-xs">
                    <div>{r.contactEmail ?? "—"}</div>
                    <div className="text-ink-soft">{r.contactPhone ?? ""}</div>
                  </div>
                ),
              },
              { key: "students", header: "Students", render: (r) => r.students },
              {
                key: "codes",
                header: "Codes",
                render: (r) => (
                  <span>
                    <b className="text-ink">{r.codesRedeemed}</b>
                    <span className="text-ink-soft"> / {r.codesTotal}</span>
                  </span>
                ),
              },
              { key: "joined", header: "Added", render: (r) => fmtDate(r.createdAt) },
              {
                key: "actions",
                header: "",
                render: (r) => (
                  <Link href={`/admin/colleges/${r.id}`} className="text-brand-600 font-semibold hover:underline text-xs whitespace-nowrap">
                    Manage →
                  </Link>
                ),
              },
            ]}
          />
          <Pagination total={total} page={page} pageSize={PAGE_SIZE} />
        </div>
        <div className="rounded-2xl border border-border bg-white p-6">
          <h2 className="font-display font-bold text-lg text-ink">Add College</h2>
          <p className="mt-1 text-xs text-ink-soft">Then issue an access-code batch from the Access Codes page.</p>
          <CollegeCreateForm />
        </div>
      </div>
    </>
  );
}
