import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { assessments, scores, users as usersT } from "@/lib/db/schema";
import { isAssessmentPaid } from "@/lib/payment/actions";
import { renderToStream } from "@react-pdf/renderer";
import { ReportDocument, type ReportData } from "@/lib/pdf/report";
import { READINESS_BANDS } from "@/lib/utils";
import type { Competency } from "@/lib/scoring";

export const runtime = "nodejs";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const row = await db
    .select({ assessment: assessments, score: scores, user: usersT })
    .from(assessments)
    .leftJoin(scores, eq(scores.assessmentId, assessments.id))
    .leftJoin(usersT, eq(usersT.id, assessments.userId))
    .where(and(eq(assessments.id, id), eq(assessments.userId, session.user.id)))
    .limit(1);
  const r = row[0];
  if (!r || !r.score) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const paid = await isAssessmentPaid(id, session.user.id);
  if (!paid) return NextResponse.json({ error: "Payment required" }, { status: 402 });

  const band = READINESS_BANDS.find((b) => b.level === r.score!.level)!;
  const data: ReportData = {
    name: r.user?.name ?? "Candidate",
    email: r.user?.email ?? "",
    total: r.score.total,
    level: r.score.level,
    levelLabel: band.label,
    track: r.score.track,
    breakdown: r.score.breakdown as Record<Competency, number>,
    generatedAt: new Date(),
  };

  const stream = await renderToStream(<ReportDocument data={data} />);
  const chunks: Uint8Array[] = [];
  for await (const chunk of stream as AsyncIterable<Uint8Array>) {
    chunks.push(chunk);
  }
  const ab = Buffer.concat(chunks);

  return new NextResponse(ab, {
    status: 200,
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="dhivi-hr-report-${id.slice(0, 8)}.pdf"`,
      "cache-control": "private, no-store",
    },
  });
}