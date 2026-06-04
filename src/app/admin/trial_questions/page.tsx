import {asc, desc, eq, ilike, and} from "drizzle-orm";
import {db} from "@/lib/db";
import {trial_questions, sections} from "@/lib/db/schema";
import {sql} from "drizzle-orm";
import {PageHeader} from "@/components/admin/page-header";
import { Pagination } from "@/components/admin/pagination";
import { TrialQuestionsFilterBar } from "@/components/admin/trial-questions-filter-bar";
import { TrialQuestionRow } from "@/components/admin/trial-question-row";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 30;

export default async function AdminTrialQuestionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
    const sp = await searchParams;
    const q = sp.q?.trim() ?? "";
    const sectionFilter = sp.section ?? "";
    const activeFilter = sp.active ?? "";
    const page = Math.max(1, Number(sp.page ?? 1));

    const filters = [];
    if (q) filters.push(ilike(trial_questions.prompt, `%${q}%`));
    if (sectionFilter) filters.push(eq(trial_questions.sectionId, sectionFilter));
    if (activeFilter === "active") filters.push(eq(trial_questions.active, true));
    if (activeFilter === "inactive") filters.push(eq(trial_questions.active, false));
    const where = filters.length > 0 ? and(...filters) : undefined;

    const [rows, [{total}], sectionRows] = await Promise.all([
        db.select(
            {
                id: trial_questions.id,
                sectionId: trial_questions.sectionId,
                prompt: trial_questions.prompt,
                options: trial_questions.options,
                active: trial_questions.active,
                orderIndex: trial_questions.orderIndex,
                hint: trial_questions.hint,
            }
        )
        .from(trial_questions)
        .where(where)
        .orderBy(asc(trial_questions.orderIndex))
        .limit(PAGE_SIZE)
        .offset((page - 1) * PAGE_SIZE),
        db.select({total: sql<number>`count(*)::int`}).from(trial_questions).where(where),
        db.select({id: sections.id, name: sections.name}).from(sections),
    ])

    // const [rows, [{total}], sectionRows] = [
    //     [{id: "1", sectionId: "1", prompt: "What is 2+2?", options: [{label: "3", value: "1"}, {label: "4", value: "2"}, {label: "5", value: "3"}, {label: "6", value: "4"}], active: true, orderIndex: 1, hint: null}],
    //     [{total: 1}],
    //     [{id: "1", name: "Math"}]
    // ]

    const grouped = new Map<string, typeof rows>();
    for (const r of rows) {
        const arr = grouped.get(r.sectionId ?? "") ?? [];
        arr.push(r);
        grouped.set(r.sectionId ?? "", arr);
    }

    return(
        <>
        <PageHeader
            title="Trial Questions"
            description="Edit trial questions prompts, options, and order."
        />
        <div className="space-y-4">
           <TrialQuestionsFilterBar filters={{ q, sectionId: sectionFilter, active: activeFilter }} sections={sectionRows} />

            {rows.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-white p-12 text-center text-sm text-ink-soft">
                    {q || sectionFilter || activeFilter ?
                    "No questions match the current filters." :
                    "No questions yet. Create your first question using the button above."}
                </div>
            ) : (
                <div>
                    {rows.map((row) => (
                        <TrialQuestionRow
                            key={row.id}
                            id={row.id}
                            sectionId={row.sectionId ?? ""}
                            prompt={row.prompt}
                            options={row.options}
                            orderIndex={row.orderIndex}
                            active={row.active}
                            hint={row.hint}
                            sections={sectionRows}
                        />
                    ))}
                </div>
            )}

        </div>
        <Pagination total={total} page={page} pageSize={PAGE_SIZE} />
        </>
    )
}   