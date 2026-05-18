import Link from "next/link";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { assessments, scores } from "@/lib/db/schema";
import { SiteHeader } from "@/components/marketing/site-header";
import { Button } from "@/components/ui/button";
import { READINESS_BANDS, fmtDate } from "@/lib/utils";
import { logoutAction } from "@/lib/auth/actions";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/dashboard");

  const attempts = await db
    .select({
      id: assessments.id,
      status: assessments.status,
      startedAt: assessments.startedAt,
      completedAt: assessments.completedAt,
      total: scores.total,
      level: scores.level,
      track: scores.track,
    })
    .from(assessments)
    .leftJoin(scores, eq(scores.assessmentId, assessments.id))
    .where(eq(assessments.userId, session.user.id))
    .orderBy(desc(assessments.startedAt));

  const latest = attempts.find((a) => a.status === "completed");
  const band = latest ? READINESS_BANDS.find((b) => b.level === latest.level) : null;

  return (
    <>
      <SiteHeader user={{ name: session.user.name, role: (session.user as { role?: string }).role }} />
      <main className="container-narrow py-12">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="display-headline text-4xl">Welcome, {session.user.name?.split(" ")[0] ?? "there"}</h1>
            <p className="mt-2 text-ink-muted">Your readiness journey at a glance.</p>
          </div>
          <form action={logoutAction}><Button variant="ghost" size="sm">Log out</Button></form>
        </div>

        <div className="mt-10 grid md:grid-cols-3 gap-5">
          <div className="md:col-span-2 rounded-2xl border border-border bg-white p-8 shadow-soft">
            <div className="text-xs font-bold uppercase tracking-widest text-brand-600">Current Readiness</div>
            {latest && band ? (
              <>
                <div className="mt-2 display-headline text-3xl">{band.label}</div>
                <div className="mt-1 text-ink-muted">Score: <b className="text-ink">{latest.total} / 100</b></div>
                <div className="mt-4 inline-flex rounded-pill bg-brand-50 text-brand-700 px-4 py-1.5 text-xs font-bold uppercase tracking-wider">
                  {latest.track}
                </div>
                <div className="mt-6 flex gap-3">
                  <Link href={`/report/${latest.id}`}><Button>View Report</Button></Link>
                  <Link href="/assessment"><Button variant="outline">Retake</Button></Link>
                </div>
              </>
            ) : (
              <>
                <div className="mt-2 display-headline text-3xl">Not Yet Assessed</div>
                <p className="mt-2 text-ink-muted">Take the 12-minute assessment to map your employability level.</p>
                <div className="mt-6"><Link href="/assessment"><Button>Start Assessment</Button></Link></div>
              </>
            )}
          </div>
          <div className="rounded-2xl border border-border bg-brand-50 p-8">
            <div className="text-xs font-bold uppercase tracking-widest text-brand-700">Profile</div>
            <div className="mt-3 text-sm">
              <div className="text-ink-muted">Name</div>
              <div className="font-medium text-ink">{session.user.name}</div>
            </div>
            <div className="mt-3 text-sm">
              <div className="text-ink-muted">Email</div>
              <div className="font-medium text-ink">{session.user.email}</div>
            </div>
            <div className="mt-3 text-sm">
              <div className="text-ink-muted">Role</div>
              <div className="font-medium text-ink capitalize">{session.user.role.replace("_", " ")}</div>
            </div>
          </div>
        </div>

        <div className="mt-10">
          <h2 className="display-headline text-2xl">All Attempts</h2>
          <div className="mt-4 overflow-hidden rounded-2xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-brand-50 text-ink-muted">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Started</th>
                  <th className="text-left px-4 py-3 font-semibold">Status</th>
                  <th className="text-left px-4 py-3 font-semibold">Score</th>
                  <th className="text-left px-4 py-3 font-semibold">Level</th>
                  <th className="text-right px-4 py-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {attempts.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-6 text-center text-ink-soft">No attempts yet</td></tr>
                )}
                {attempts.map((a) => (
                  <tr key={a.id} className="border-t border-border">
                    <td className="px-4 py-3">{fmtDate(a.startedAt)}</td>
                    <td className="px-4 py-3 capitalize">{a.status.replace("_", " ")}</td>
                    <td className="px-4 py-3">{a.total ?? "—"}</td>
                    <td className="px-4 py-3">{a.level ? READINESS_BANDS.find((b) => b.level === a.level)?.label : "—"}</td>
                    <td className="px-4 py-3 text-right">
                      {a.status === "completed"
                        ? <Link href={`/report/${a.id}`} className="text-brand-600 font-semibold hover:underline">Report →</Link>
                        : <Link href={`/assessment/${a.id}`} className="text-brand-600 font-semibold hover:underline">Resume →</Link>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </>
  );
}
