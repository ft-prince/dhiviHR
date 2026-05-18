import { notFound, redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { assessments } from "@/lib/db/schema";
import { getActiveQuestionsAction } from "@/lib/assessment/actions";
import { SiteHeader } from "@/components/marketing/site-header";
import { AssessmentRunner } from "@/components/assessment/assessment-runner";

export default async function AssessmentRunPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect(`/login?callbackUrl=/assessment/${id}`);

  const attempt = await db
    .select()
    .from(assessments)
    .where(and(eq(assessments.id, id), eq(assessments.userId, session.user.id)))
    .limit(1);
  if (!attempt[0]) notFound();
  if (attempt[0].status === "completed") redirect(`/report/${id}`);

  const qs = await getActiveQuestionsAction();

  return (
    <>
      <SiteHeader user={{ name: session.user.name, role: (session.user as { role?: string }).role }} />
      <main className="container-narrow py-10">
        <AssessmentRunner
          assessmentId={id}
          questions={qs.map((q) => ({
            id: q.id,
            competency: q.competency,
            prompt: q.prompt,
            options: q.options as { id: string; label: string; weight: number }[],
          }))}
        />
      </main>
    </>
  );
}
