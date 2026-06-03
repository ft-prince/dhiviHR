import { asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { competencies, questions } from "@/lib/db/schema";
import { sql } from "drizzle-orm";
import { PageHeader } from "@/components/admin/page-header";
import { CompetencyManager } from "@/components/admin/competency-manager";

export const dynamic = "force-dynamic";

export default async function AdminCompetenciesPage() {
  const rows = await db
    .select({
      id: competencies.id,
      slug: competencies.slug,
      label: competencies.label,
      description: competencies.description,
      weight: competencies.weight,
      active: competencies.active,
      orderIndex: competencies.orderIndex,
      questionCount: sql<number>`(SELECT count(*)::int FROM questions WHERE questions.competency_id = competencies.id)`,
    })
    .from(competencies)
    .orderBy(asc(competencies.orderIndex), asc(competencies.slug));

  return (
    <>
      <PageHeader
        title="Competencies"
        description="Define the skills measured by assessments. Each competency contributes to the total score based on its weight."
      />
      <CompetencyManager initialRows={rows} />
    </>
  );
}
