import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { questions } from "@/lib/db/schema";
import { PageHeader } from "@/components/admin/page-header";
import { COMPETENCY_LABELS, type Competency } from "@/lib/scoring";
import { QuestionRow } from "@/components/admin/question-row";

export const dynamic = "force-dynamic";

export default async function AdminQuestionsPage() {
  const rows = await db
    .select()
    .from(questions)
    .orderBy(asc(questions.competency), asc(questions.orderIndex));

  const grouped = new Map<string, typeof rows>();
  for (const r of rows) {
    const arr = grouped.get(r.competency) ?? [];
    arr.push(r);
    grouped.set(r.competency, arr);
  }

  return (
    <>
      <PageHeader
        title="Question Bank"
        description="Edit prompts, options, and weights. Inactive questions are hidden from candidates."
      />
      <div className="space-y-8">
        {Array.from(grouped.entries()).map(([comp, list]) => (
          <section key={comp}>
            <h2 className="font-display font-bold text-lg text-ink mb-3">
              {COMPETENCY_LABELS[comp as Competency] ?? comp}
              <span className="ml-2 text-sm text-ink-soft font-normal">({list.length})</span>
            </h2>
            <div className="space-y-3">
              {list.map((q) => (
                <QuestionRow
                  key={q.id}
                  id={q.id}
                  prompt={q.prompt}
                  active={q.active}
                  orderIndex={q.orderIndex}
                  options={q.options as { id: string; label: string; weight: number }[]}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
