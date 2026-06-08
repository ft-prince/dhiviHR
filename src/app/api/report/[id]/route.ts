import { NextRequest, NextResponse } from "next/server";
import { eq, asc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { assessments, scores, score_competencies, competencies, users, streams } from "@/lib/db/schema";
import { isAssessmentPaid } from "@/lib/payment/actions";
import { READINESS_LEVEL } from "@/lib/utils";
import { tierSubHeadingForLevel } from "@/lib/scoring";
import { generateFullReport, type ReportData, type CompetencyScore } from "@/lib/pdf/layout";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const paid = await isAssessmentPaid(id, session.user.id);
  if (!paid) return NextResponse.json({ error: "Payment required" }, { status: 402 });

  const [assessmentRow] = await db
    .select()
    .from(assessments)
    .where(eq(assessments.id, id))
    .limit(1);

  if (!assessmentRow) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (assessmentRow.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (assessmentRow.status !== "completed") return NextResponse.json({ error: "Assessment not completed" }, { status: 400 });

  const [scoreRow] = await db.select().from(scores).where(eq(scores.assessmentId, id)).limit(1);
  if (!scoreRow) return NextResponse.json({ error: "Scores not found" }, { status: 404 });

  const band = READINESS_LEVEL.find((b) => b.level === scoreRow.level);
  if (!band) return NextResponse.json({ error: "Invalid readiness level" }, { status: 500 });

  const [dbCompetencies, scoreComps, [userRow]] = await Promise.all([
    db.select({ id: competencies.id, label: competencies.label }).from(competencies).orderBy(asc(competencies.orderIndex)),
    db.select().from(score_competencies).where(eq(score_competencies.scoreId, scoreRow.id)),
    db.select({ name: users.name, streamId: users.streamId }).from(users).where(eq(users.id, session.user.id)).limit(1),
  ]);

  const labelMap = Object.fromEntries(dbCompetencies.map((c) => [c.id, c.label]));
  const breakdownMap = new Map(scoreComps.map((sc) => [sc.competencyId, sc]));

  const competencyScores: CompetencyScore[] = dbCompetencies
    .filter((c) => breakdownMap.has(c.id))
    .map((c) => {
      const sc = breakdownMap.get(c.id)!;
      return {
        id: c.id,
        label: c.label,
        average: Number(sc.average) || 0,
        gap: sc.gap as "critical_gap" | "development_gap" | "strength",
      };
    });

  let streamName = "CSE/IT";
  if (userRow?.streamId) {
    const [s] = await db.select({ name: streams.name }).from(streams).where(eq(streams.id, userRow.streamId)).limit(1);
    if (s) streamName = s.name;
  }

  const date = assessmentRow.completedAt
    ? new Date(assessmentRow.completedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const reportData: ReportData = {
    studentName: userRow?.name || session.user.name || "Student Candidate",
    stream: streamName,
    date,
    totalScore: scoreRow.total,
    readinessLevel: scoreRow.level,
    readinessLabel: band.label,
    subHeading: tierSubHeadingForLevel(scoreRow.level),
    competencies: competencyScores,
    reportJson: assessmentRow.reportJson as Record<string, unknown> | null,
  };

  const pdfBytes = generateFullReport(reportData);

  return new NextResponse(pdfBytes, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="dhiviHR-report-${id}.pdf"`,
    },
  });
}
