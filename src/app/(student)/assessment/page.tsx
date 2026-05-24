import { startAssessmentAction } from "@/lib/assessment/actions";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/marketing/site-header";
import { auth } from "@/lib/auth";

export default async function AssessmentLandingPage() {
  const session = await auth();
  const user = session?.user ? { name: session.user.name, role: (session.user as { role?: string }).role } : null;
  return (
    <>
      <SiteHeader user={user} solid />
      <main className="container-narrow pt-24 sm:pt-28 pb-16">
        <h1 className="display-headline text-3xl sm:text-4xl">Interview Readiness Assessment</h1>
        <p className="mt-3 text-ink-muted max-w-2xl">
          25 situational questions across 5 competencies. Takes about 12 minutes. Your answers are saved
          on every submit — you can resume any time.
        </p>
        <form action={startAssessmentAction} className="mt-8">
          <Button type="submit" size="lg">Start Assessment</Button>
        </form>
      </main>
    </>
  );
}
