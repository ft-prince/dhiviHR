import { notFound, redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { assessments } from "@/lib/db/schema";
import { getActiveQuestionsAction } from "@/lib/assessment/actions";
import { SiteHeader } from "@/components/marketing/site-header";
import { AssessmentRunner } from "@/components/assessment/assessment-runner";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AssessmentRunPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  console.log("=== SERVER: RUNNING ASSESSMENT PAGE FOR ID ===", id);

  const session = await auth();
  console.log("=== SERVER: SESSION USER ID ===", session?.user?.id);
  if (!session?.user?.id) redirect(`/login?callbackUrl=/assessment/${id}`);

  const attempt = await db
    .select()
    .from(assessments)
    .where(and(eq(assessments.id, id), eq(assessments.userId, session.user.id)))
    .limit(1);
    
  console.log("=== SERVER: ASSESSMENT ATTEMPT ROW FOUND ===", attempt[0]);

  if (!attempt[0]) {
    console.log("=== SERVER: RENDERING 404 NOT FOUND (No matching assessment record) ===");
    notFound();
  }
  
  if (attempt[0].status === "completed") {
    console.log("=== SERVER: REDIRECTING BECAUSE STATUS IS COMPLETED ===");
    redirect(`/report/${id}`);
  }

  console.log("=== SERVER: TRIGGERING getActiveQuestionsAction ===");
  const qs = await getActiveQuestionsAction();
  console.log("=== SERVER: RETURNED QUESTIONS LENGTH ===", qs?.length);

  return (
    <>
      <SiteHeader user={{ name: session.user.name, role: (session.user as { role?: string }).role }} solid />
      <main className="container-narrow pt-24 sm:pt-28 pb-10">
        <AssessmentRunner
          assessmentId={id}
          questions={qs.map((q) => ({
            id: q.id,
            competency: q.competency,
            prompt: q.prompt,
            options: (q.options || []) as { id: string; label: string; weight: number }[],
          }))}
        />
      </main>
    </>
  );
}
