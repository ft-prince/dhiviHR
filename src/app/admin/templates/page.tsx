import { desc, eq, ilike, isNotNull, sql } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/lib/db";
import { formTemplates, templateQuestions, colleges } from "@/lib/db/schema";
import { PageHeader } from "@/components/admin/page-header";
import { DataTable } from "@/components/admin/data-table";
import { TemplateForm } from "@/components/admin/template-form";
import { TemplatesFilterBar } from "@/components/admin/templates-filter-bar";
import { Pagination } from "@/components/admin/pagination";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

export default async function AdminTemplatesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const page = Math.max(1, Number(sp.page ?? 1));

  const where = q ? ilike(formTemplates.name, `%${q}%`) : undefined;

  const [templateList, [{ total }], collegeList, questionCounts, collegeCounts] = await Promise.all([
    db
      .select({
        id: formTemplates.id,
        name: formTemplates.name,
        description: formTemplates.description,
        isDefault: formTemplates.isDefault,
        createdAt: formTemplates.createdAt,
      })
      .from(formTemplates)
      .where(where)
      .orderBy(desc(formTemplates.createdAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),

    db.select({ total: sql<number>`count(*)::int` }).from(formTemplates).where(where),

    db.select({ id: colleges.id, name: colleges.name }).from(colleges).orderBy(colleges.name),

    // Aggregate question counts per template — avoids correlated subquery driver issues
    db
      .select({
        templateId: templateQuestions.templateId,
        count: sql<number>`count(*)::int`,
      })
      .from(templateQuestions)
      .groupBy(templateQuestions.templateId),

    // Aggregate college counts per template
    db
      .select({
        templateId: colleges.templateId,
        count: sql<number>`count(*)::int`,
      })
      .from(colleges)
      .where(isNotNull(colleges.templateId))
      .groupBy(colleges.templateId),
  ]);

  const qMap = new Map(questionCounts.map((r) => [r.templateId, r.count]));
  const cMap = new Map(collegeCounts.map((r) => [r.templateId as string, r.count]));

  const rows = templateList.map((t) => ({
    ...t,
    questionCount: qMap.get(t.id) ?? 0,
    collegeCount: cMap.get(t.id) ?? 0,
  }));

  return (
    <>
      <PageHeader
        title="Form Templates"
        description="Create and manage question templates. Assign templates to colleges so each cohort gets the right assessment."
      />
      <div className="grid lg:grid-cols-[1fr_380px] gap-6">
        <div>
          <TemplatesFilterBar filters={{ q }} />
          <DataTable
            rows={rows}
            emptyText={q ? "No templates match the current search." : "No templates yet — create your first one →"}
            columns={[
              {
                key: "name",
                header: "Template",
                render: (r) => (
                  <Link href={`/admin/templates/${r.id}`} className="block hover:underline">
                    <div className="font-medium text-ink">{r.name}</div>
                    {r.description && <div className="text-xs text-ink-soft truncate max-w-xs">{r.description}</div>}
                  </Link>
                ),
              },
              {
                key: "default",
                header: "Default",
                render: (r) =>
                  r.isDefault ? (
                    <span className="rounded-full bg-brand-500 text-white px-2 py-0.5 text-xs font-bold">Default</span>
                  ) : (
                    <span className="text-ink-soft text-xs">—</span>
                  ),
              },
              { key: "questions", header: "Questions", render: (r) => r.questionCount },
              { key: "colleges", header: "Colleges", render: (r) => r.collegeCount },
              {
                key: "actions",
                header: "",
                render: (r) => (
                  <Link href={`/admin/templates/${r.id}`} className="text-brand-600 font-semibold hover:underline text-xs">
                    Manage →
                  </Link>
                ),
              },
            ]}
          />
          <Pagination total={total} page={page} pageSize={PAGE_SIZE} />
        </div>
        <div className="rounded-2xl border border-border bg-white p-6">
          <h2 className="font-display font-bold text-lg text-ink">New Template</h2>
          <p className="mt-1 text-xs text-ink-soft">Create a blank template or copy one from an existing college.</p>
          <div className="mt-4">
            <TemplateForm colleges={collegeList} />
          </div>
        </div>
      </div>
    </>
  );
}
