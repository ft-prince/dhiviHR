import { and, eq, asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { assessments, scores, score_competencies, competencies, users as usersT, streams } from "@/lib/db/schema";
import { READINESS_LEVEL } from "@/lib/utils";
import { generateFullReport, type ReportData, type CompetencyScore } from "@/lib/pdf/layout";

export const dynamic = "force-dynamic";

interface GenerateReportOptions {
  assessmentId: string;
  user: {
    id: string;
    name?: string | null;
  };
}

export async function generateReportPdfBuffer({ assessmentId, user }: GenerateReportOptions): Promise<Buffer> {
  const [rows, dbCompetencies] = await Promise.all([
    db
      .select({
        assessment: assessments,
        score: scores,
        score_competencies: score_competencies,
        user: usersT,
      })
      .from(assessments)
      .leftJoin(scores, eq(scores.assessmentId, assessments.id))
      .leftJoin(score_competencies, eq(score_competencies.scoreId, scores.id))
      .leftJoin(usersT, eq(usersT.id, assessments.userId))
      .where(and(eq(assessments.id, assessmentId), eq(assessments.userId, user.id))),
    db
      .select({ id: competencies.id, label: competencies.label })
      .from(competencies)
      .orderBy(asc(competencies.orderIndex)),
  ]);

  if (!rows || rows.length === 0) throw new Error("Report not found");

  const { assessment, score, user: dbUser } = rows[0];
  if (assessment.status !== "completed" || !score) throw new Error("Assessment is not completed or scores are missing");

  const band = READINESS_LEVEL.find((b) => b.level === score.level);
  if (!band) throw new Error("Invalid readiness level detected");

  const breakdownData: Record<string, { average: number; gap: "critical_gap" | "development_gap" | "strength" }> = {};
  for (const r of rows) {
    if (r.score_competencies?.competencyId) {
      breakdownData[r.score_competencies.competencyId] = {
        average: Number(r.score_competencies.average) || 0,
        gap: r.score_competencies.gap as "critical_gap" | "development_gap" | "strength",
      };
    }
  }

  const labelMap = Object.fromEntries(dbCompetencies.map((c) => [c.id, c.label]));

  const competencyScores: CompetencyScore[] = Object.entries(labelMap)
    .filter(([compId]) => breakdownData[compId])
    .map(([compId, labelName]) => ({
      id: compId,
      label: labelName,
      average: breakdownData[compId].average,
      gap: breakdownData[compId].gap,
    }));

  let streamName = "CSE/IT";
  if (dbUser?.streamId) {
    const [s] = await db.select({ name: streams.name }).from(streams).where(eq(streams.id, dbUser.streamId)).limit(1);
    if (s) streamName = s.name;
  }

  const date = assessment.completedAt
    ? new Date(assessment.completedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const reportData: ReportData = {
    studentName: dbUser?.name || user.name || "Student Candidate",
    stream: streamName,
    date,
    totalScore: score.total,
    readinessLevel: score.level,
    readinessLabel: band.label,
    competencies: competencyScores,
    reportJson: assessment.reportJson as Record<string, unknown> | null,
  };

  return generateFullReport(reportData);
}
