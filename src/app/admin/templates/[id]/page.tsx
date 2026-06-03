import { notFound } from "next/navigation";
import { eq, asc, not, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { formTemplates, templateQuestions, questions, colleges, competencies } from "@/lib/db/schema";
import { PageHeader } from "@/components/admin/page-header";
import { TemplateDetailClient } from "@/components/admin/template-detail-client";
import { TemplateRuleEditor } from "@/components/admin/template-rule-editor";
import type { TemplateRule } from "@/lib/types/rules";

export const dynamic = "force-dynamic";

export default async function TemplateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [template] = await db.select().from(formTemplates).where(eq(formTemplates.id, id)).limit(1);
  if (!template) notFound();

  const [inTemplate, assignedColleges, competencyRows] = await Promise.all([
    db
      .select({
        tqId: templateQuestions.id,
        tqActive: templateQuestions.active,
        tqOrderIndex: templateQuestions.orderIndex,
        id: questions.id,
        competencyId: questions.competencyId,
        prompt: questions.prompt,
        options: questions.options,
        active: questions.active,
        orderIndex: questions.orderIndex,
      })
      .from(templateQuestions)
      .innerJoin(questions, eq(templateQuestions.questionId, questions.id))
      .where(eq(templateQuestions.templateId, id))
      .orderBy(asc(templateQuestions.orderIndex), asc(questions.orderIndex)),
    db.select({ id: colleges.id, name: colleges.name }).from(colleges).where(eq(colleges.templateId, id)),
    db.select({ id: competencies.id, slug: competencies.slug, label: competencies.label }).from(competencies).where(eq(competencies.active, true)).orderBy(asc(competencies.orderIndex)),
  ]);

  const inTemplateIds = inTemplate.map((q) => q.id);
  const availableQuestions =
    inTemplateIds.length > 0
      ? await db
          .select({ id: questions.id, competencyId: questions.competencyId, prompt: questions.prompt, active: questions.active })
          .from(questions)
          .where(not(inArray(questions.id, inTemplateIds)))
          .orderBy(asc(questions.competencyId), asc(questions.orderIndex))
      : await db
          .select({ id: questions.id, competencyId: questions.competencyId, prompt: questions.prompt, active: questions.active })
          .from(questions)
          .orderBy(asc(questions.competencyId), asc(questions.orderIndex));

  const competencyLabels = Object.fromEntries(competencyRows.map((c) => [c.slug, c.label]));
  const rules = (template.rules ?? []) as TemplateRule[];

  return (
    <>
      <PageHeader
        title={template.name}
        description={template.description ?? "Manage questions and evaluation rules for this template."}
      />
      <div className="space-y-10">
        <TemplateDetailClient
          template={template}
          inTemplate={inTemplate as Parameters<typeof TemplateDetailClient>[0]["inTemplate"]}
          availableQuestions={availableQuestions}
          assignedColleges={assignedColleges}
          competencyLabels={competencyLabels}
          competencies={competencyRows}
        />
        <hr className="border-border" />
        <TemplateRuleEditor
          templateId={id}
          initialRules={rules}
          competencies={competencyRows}
        />
      </div>
    </>
  );
}
