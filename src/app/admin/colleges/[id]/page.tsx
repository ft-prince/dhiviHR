import { notFound } from "next/navigation";
import { fmtDate } from "@/lib/utils";
import { eq, desc, sql } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/lib/db";
import { colleges, users, accessCodeBatches, formTemplates } from "@/lib/db/schema";
import { PageHeader } from "@/components/admin/page-header";
import { DataTable } from "@/components/admin/data-table";
import { CollegeDetailClient } from "@/components/admin/college-detail-client";

export const dynamic = "force-dynamic";

type StudentRow = {
  id: string;
  name: string | null;
  email: string;
  createdAt: Date;
  assessmentCount: number;
  latestScore: number | null;
};

type BatchRow = {
  id: string;
  label: string;
  size: number;
  createdAt: Date;
  redeemed: number;
};

export default async function CollegeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [college] = await db
    .select({
      id: colleges.id,
      name: colleges.name,
      slug: colleges.slug,
      contactEmail: colleges.contactEmail,
      contactPhone: colleges.contactPhone,
      notes: colleges.notes,
      templateId: colleges.templateId,
      createdAt: colleges.createdAt,
      updatedAt: colleges.updatedAt,
    })
    .from(colleges)
    .where(eq(colleges.id, id))
    .limit(1);

  if (!college) notFound();

  const [studentsResult, batchesResult, templateList] = await Promise.all([
    // Raw SQL for students — correlated subqueries need raw to avoid Drizzle interpolation bug
    db.execute(sql`
      SELECT
        u.id,
        u.name,
        u.email,
        u.created_at                                          AS "createdAt",
        (
          SELECT COUNT(*)::int
          FROM assessments
          WHERE assessments.user_id = u.id
        )                                                     AS "assessmentCount",
        (
          SELECT sc.total
          FROM scores sc
          JOIN assessments a ON sc.assessment_id = a.id
          WHERE a.user_id = u.id
          ORDER BY a.started_at DESC
          LIMIT 1
        )                                                     AS "latestScore"
      FROM users u
      WHERE u.college_id = ${id}
      ORDER BY u.created_at DESC
    `),

    // Raw SQL for batches — same fix for redeemed count
    db.execute(sql`
      SELECT
        b.id,
        b.label,
        b.size,
        b.created_at  AS "createdAt",
        (
          SELECT COUNT(*)::int
          FROM access_codes ac
          WHERE ac.batch_id = b.id
            AND ac.redeemed_at IS NOT NULL
        )             AS "redeemed"
      FROM access_code_batches b
      WHERE b.college_id = ${id}
      ORDER BY b.created_at DESC
    `),

    db.select({ id: formTemplates.id, name: formTemplates.name })
      .from(formTemplates)
      .orderBy(formTemplates.name),
  ]);

  const students = studentsResult.rows as unknown as StudentRow[];
  const batches  = batchesResult.rows  as unknown as BatchRow[];

  return (
    <>
      <div className="mb-2">
        <Link href="/admin/colleges" className="text-xs text-ink-soft hover:text-brand-600">
          ← Colleges
        </Link>
      </div>
      <PageHeader
        title={college.name}
        description={`Slug: ${college.slug} · Added ${fmtDate(college.createdAt)}`}
      />

      <CollegeDetailClient college={college} templateList={templateList} />

      <div className="mt-8 space-y-8">
        {/* Students */}
        <section>
          <h2 className="font-display font-bold text-lg text-ink mb-3">
            Students
            <span className="ml-2 text-sm font-normal text-ink-soft">({students.length})</span>
          </h2>
          <DataTable
            rows={students}
            emptyText="No students enrolled yet."
            columns={[
              {
                key: "name",
                header: "Student",
                render: (r) => (
                  <div>
                    <div className="font-medium text-ink">{r.name ?? "—"}</div>
                    <div className="text-xs text-ink-soft">{r.email}</div>
                  </div>
                ),
              },
              { key: "assessments", header: "Attempts",     render: (r) => r.assessmentCount },
              {
                key: "score",
                header: "Latest Score",
                render: (r) =>
                  r.latestScore != null
                    ? <b className="text-brand-700">{r.latestScore}</b>
                    : "—",
              },
              { key: "joined", header: "Joined", render: (r) => fmtDate(r.createdAt) },
            ]}
          />
        </section>

        {/* Code batches */}
        <section>
          <h2 className="font-display font-bold text-lg text-ink mb-3">
            Access Code Batches
            <span className="ml-2 text-sm font-normal text-ink-soft">({batches.length})</span>
          </h2>
          <DataTable
            rows={batches}
            emptyText="No batches yet."
            columns={[
              {
                key: "label",
                header: "Label",
                render: (r) => <span className="font-medium text-ink">{r.label}</span>,
              },
              {
                key: "codes",
                header: "Codes",
                render: (r) => (
                  <span>
                    <b className="text-ink">{r.redeemed}</b>
                    <span className="text-ink-soft"> / {r.size} redeemed</span>
                  </span>
                ),
              },
              { key: "created", header: "Created", render: (r) => fmtDate(r.createdAt) },
              {
                key: "actions",
                header: "",
                render: (r) => (
                  <Link
                    href={`/api/admin/code-batches/${r.id}/csv`}
                    className="text-brand-600 font-semibold hover:underline text-xs"
                  >
                    CSV ↓
                  </Link>
                ),
              },
            ]}
          />
        </section>
      </div>
    </>
  );
}