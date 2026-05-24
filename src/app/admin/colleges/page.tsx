import { sql } from "drizzle-orm";
import { fmtDate } from "@/lib/utils";
import Link from "next/link";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/admin/page-header";
import { DataTable } from "@/components/admin/data-table";
import { CollegeCreateForm } from "@/components/admin/college-create-form";
import { CollegesFilterBar } from "@/components/admin/colleges-filter-bar";
import { Pagination } from "@/components/admin/pagination";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

type CollegeRow = {
  id: string;
  name: string;
  slug: string;
  contactEmail: string | null;
  contactPhone: string | null;
  createdAt: Date;
  codesTotal: number;
  codesRedeemed: number;
  students: number;
};

export default async function AdminCollegesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const page = Math.max(1, Number(sp.page ?? 1));
  const offset = (page - 1) * PAGE_SIZE;

  const [list, countResult] = await Promise.all([
    db.execute(sql`
      SELECT
        c.id,
        c.name,
        c.slug,
        c.contact_email  AS "contactEmail",
        c.contact_phone  AS "contactPhone",
        c.created_at     AS "createdAt",
        COUNT(DISTINCT ac.id)::int AS "codesTotal",
        COUNT(DISTINCT CASE WHEN ac.redeemed_at IS NOT NULL THEN ac.id END)::int AS "codesRedeemed",
        COUNT(DISTINCT u.id)::int  AS "students"
      FROM colleges c
      LEFT JOIN access_codes ac ON ac.college_id = c.id
      LEFT JOIN users u ON u.college_id = c.id
      ${q ? sql`WHERE c.name ILIKE ${"%" + q + "%"}` : sql``}
      GROUP BY c.id
      ORDER BY c.created_at DESC
      LIMIT ${PAGE_SIZE} OFFSET ${offset}
    `),
    db.execute(sql`
      SELECT COUNT(*)::int AS total
      FROM colleges
      ${q ? sql`WHERE name ILIKE ${"%" + q + "%"}` : sql``}
    `),
  ]);

  const rows = list.rows as unknown as CollegeRow[];
  const total = (countResult.rows[0] as { total: number }).total;

  return (
    <>
      <PageHeader
        title="Colleges"
        description="Institutions registered on the platform. Click a college to manage it."
      />
      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        <div className="min-w-0">
          <CollegesFilterBar filters={{ q }} />
          <DataTable
            rows={rows}
            emptyText={
              q
                ? "No colleges match the current search."
                : "No colleges yet — add your first one →"
            }
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
              {
                key: "students",
                header: "Students",
                render: (r) => r.students,
              },
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
              {
                key: "joined",
                header: "Added",
                render: (r) => fmtDate(r.createdAt),
              },
              {
                key: "actions",
                header: "",
                render: (r) => (
                  <Link
                    href={`/admin/colleges/${r.id}`}
                    className="text-brand-600 font-semibold hover:underline text-xs whitespace-nowrap"
                  >
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
          <p className="mt-1 text-xs text-ink-soft">
            Then issue an access-code batch from the Access Codes page.
          </p>
          <CollegeCreateForm />
        </div>
      </div>
    </>
  );
}