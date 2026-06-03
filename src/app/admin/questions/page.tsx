import { asc, desc, eq, ilike, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { questions, competencies } from "@/lib/db/schema";
import { sql } from "drizzle-orm";
import { PageHeader } from "@/components/admin/page-header";
import { QuestionRow } from "@/components/admin/question-row";
import { QuestionCreatePanel } from "@/components/admin/question-create-panel";
import { QuestionsFilterBar } from "@/components/admin/questions-filter-bar";
import { Pagination } from "@/components/admin/pagination";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 30;

export default async function AdminQuestionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const competencyFilter = sp.competency ?? "";
  const activeFilter = sp.active ?? "";
  const page = Math.max(1, Number(sp.page ?? 1));

  const filters = [];
  if (q) filters.push(ilike(questions.prompt, `%${q}%`));
  if (competencyFilter) filters.push(eq(questions.competencyId, competencyFilter));
  if (activeFilter === "active") filters.push(eq(questions.active, true));
  if (activeFilter === "inactive") filters.push(eq(questions.active, false));
  const where = filters.length > 0 ? and(...filters) : undefined;

  const [rows, [{ total }], competencyRows] = await Promise.all([
    db
      .select()
      .from(questions)
      .where(where)
      .orderBy(asc(questions.orderIndex))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ total: sql<number>`count(*)::int` }).from(questions).where(where),
    db
      .select({ id: competencies.id, slug: competencies.slug, label: competencies.label })
      .from(competencies)
      .orderBy(asc(competencies.orderIndex)),
  ]);

  const competencyList = competencyRows.length > 0 ? competencyRows : [];
  const labelMap = Object.fromEntries(competencyList.map((c) => [c.id, c.label]));

  const grouped = new Map<string, typeof rows>();
  for (const r of rows) {
    const arr = grouped.get(r.competencyId) ?? [];
    arr.push(r);
    grouped.set(r.competencyId, arr);
  }

  return (
    <>
      <PageHeader
        title="Question Bank"
        description="Edit prompts, options, and weights. Inactive questions are hidden from candidates."
        actions={<QuestionCreatePanel competencies={competencyList} />}
      />
      <div className="space-y-4">
        <QuestionsFilterBar
          filters={{ q, competency: competencyFilter, active: activeFilter }}
          competencies={competencyList}
        />

        {rows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-white p-12 text-center text-sm text-ink-soft">
            {q || competencyFilter || activeFilter
              ? "No questions match the current filters."
              : "No questions yet. Create your first question using the button above."}
          </div>
        ) : (
          <div className="space-y-8">
            {Array.from(grouped.entries()).map(([comp, list]) => (
              <section key={comp}>
                <h2 className="font-display font-bold text-lg text-ink mb-3">
                  {labelMap[comp] ?? comp}
                  <span className="ml-2 text-sm text-ink-soft font-normal">({list.length})</span>
                </h2>
                <div className="space-y-3">
                  {list.map((r) => (
                    <QuestionRow
                      key={r.id}
                      id={r.id}
                      prompt={r.prompt}
                      active={r.active}
                      orderIndex={r.orderIndex}
                      competencyId={r.competencyId}
                      options={r.options as { id: string; label: string; weight: number }[]}
                      competencies={competencyList}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        <Pagination total={total} page={page} pageSize={PAGE_SIZE} />
      </div>
    </>
  );
}
