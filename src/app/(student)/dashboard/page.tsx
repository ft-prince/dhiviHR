import Link from "next/link";
import { redirect } from "next/navigation";
import { desc, eq, sql, and,isNull } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, streams, assessments, scores, accessGrants } from "@/lib/db/schema";
import { SiteHeader } from "@/components/marketing/site-header";
import { Button } from "@/components/ui/button";
import { READINESS_LEVEL, fmtDate } from "@/lib/utils";
import { logoutAction } from "@/lib/auth/actions";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/dashboard");

  const grants = await db.select({count: sql<number>`count(*)::int`})
    .from(accessGrants)
    .where(and(
      eq(accessGrants.userId, session.user.id),
      isNull(accessGrants.usedAt),
    ))

  const grantCount = grants[0]?.count ?? 0;

  const userDetail = await db.select({
    streamName: streams.name,
    createdBy: users.createdBy,
  }).from(users)
  .leftJoin(streams, eq(streams.id, users.streamId))
  .where(eq(users.id, session.user.id))
  .limit(1)
  .then((r) => r[0])

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
  const band = latest ? READINESS_LEVEL.find((b) => b.level === latest.level) : null;
  const user = session.user as { name?: string | null; email?: string | null; role?: string };

  return (
    <>
      <SiteHeader user={{ name: user.name, role: user.role }} solid />

      <main className="container-narrow pt-24 sm:pt-28 pb-12 sm:pb-16">

        {/* ── Page header ──────────────────────────────────────── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8 sm:mb-10">
          <div>
            <h1 className="display-headline text-3xl sm:text-4xl">
              Welcome, {user.name?.split(" ")[0] ?? "there"}
            </h1>
            <p className="mt-1.5 text-sm sm:text-base text-ink-muted">
              Your readiness journey at a glance.
            </p>
          </div>
          <form action={logoutAction}>
            <Button variant="outline" size="sm" className="self-start sm:self-auto">
              Log out
            </Button>
          </form>
        </div>

        {/* ── Top cards ────────────────────────────────────────── */}
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5">

          {/* Current readiness */}
          <div className="sm:col-span-2 rounded-2xl border border-border bg-white p-6 sm:p-8 shadow-soft">
            <div className="text-[10px] font-bold uppercase tracking-widest text-brand-600">
              Current Readiness
            </div>
            {latest && band ? (
              <>
                <div className="mt-2 display-headline text-2xl sm:text-3xl">{band.label}</div>
                <div className="mt-1 text-sm text-ink-muted">
                  Score: <b className="text-ink">{latest.total} / 4</b>
                </div>
                <div className="mt-4 inline-flex rounded-pill bg-brand-50 text-brand-700 px-4 py-1.5 text-xs font-bold uppercase tracking-wider">
                  {latest.track}
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link href={`/report/${latest.id}`}>
                    <Button size="sm">View Report</Button>
                  </Link>
                  <Link href="/assessment">
                    <Button variant="outline" size="sm">Retake Assessment</Button>
                  </Link>
                </div>
              </>
            ) : (
              <>
                <div className="mt-2 display-headline text-2xl sm:text-3xl">Not Yet Assessed</div>
                <p className="mt-2 text-sm text-ink-muted max-w-sm">
                  Take the 20-minute assessment to map your employability level across five competency dimensions.
                </p>
                <div className="mt-6">
                  <Link href="/assessment">
                    <Button size="sm">Start Assessment</Button>
                  </Link>
                </div>
              </>
            )}
          </div>

          {/* Profile */}
          <div className="rounded-2xl border border-border bg-brand-50 p-6 sm:p-8">
            <div className="text-[10px] font-bold uppercase tracking-widest text-brand-700 mb-4">
              Profile
            </div>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-ink-muted">Name</dt>
                <dd className="font-medium text-ink mt-0.5">{user.name ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-ink-muted">Email</dt>
                <dd className="font-medium text-ink mt-0.5 break-all">{user.email ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-ink-muted">Stream</dt>
                <dd className="font-medium text-ink mt-0.5">{userDetail?.streamName ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-ink-muted">Role</dt>
                <dd className="font-medium text-ink mt-0.5 capitalize">
                  {user.role?.replace("_", " ") ?? "—"}
                </dd>
              </div>
              <div className="pt-3 mt-3 border-t border-border">
              <dt className="text-ink-muted">Assessment Grants</dt>
              <dd className="mt-1 flex items-center gap-2">
                <span className={`text-2xl font-bold ${grantCount > 0 ? "text-brand-600" : "text-ink-muted"}`}>
                  {grantCount}
                </span>
                <span className="text-xs text-ink-muted">available</span>
              </dd>
              {grantCount === 0 && (
                <p className="text-xs text-ink-soft mt-1">
                  No grants available. Contact your college admin.
                </p>
              )}
            </div>
            </dl>
          </div>
        </div>

        {/* ── Attempts table ───────────────────────────────────── */}
        <div className="mt-10 sm:mt-12">
          <h2 className="display-headline text-xl sm:text-2xl mb-4">All Attempts</h2>
          <div className="rounded-2xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[520px]">
                <thead className="bg-brand-50 text-ink-muted">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold whitespace-nowrap">Started</th>
                    <th className="text-left px-4 py-3 font-semibold whitespace-nowrap">Status</th>
                    <th className="text-left px-4 py-3 font-semibold whitespace-nowrap">Score</th>
                    <th className="text-left px-4 py-3 font-semibold whitespace-nowrap">Level</th>
                    <th className="text-right px-4 py-3 font-semibold whitespace-nowrap">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {attempts.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-ink-soft">
                        No attempts yet — start your first assessment above.
                      </td>
                    </tr>
                  )}
                  {attempts.map((a) => (
                    <tr key={a.id} className="border-t border-border hover:bg-brand-50/30 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">{fmtDate(a.startedAt)}</td>
                      <td className="px-4 py-3 whitespace-nowrap capitalize">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${
                          a.status === "completed"
                            ? "bg-brand-50 text-brand-700"
                            : "bg-amber-50 text-amber-700"
                        }`}>
                          {a.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium">{a.total ?? "—"}</td>
                      <td className="px-4 py-3">
                        {a.level ? READINESS_LEVEL.find((b) => b.level === a.level)?.label : "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {a.status === "completed" ? (
                          <Link
                            href={`/report/${a.id}`}
                            className="text-brand-600 font-semibold hover:underline text-sm"
                          >
                            Report →
                          </Link>
                        ) : (
                          <Link
                            href={`/assessment/${a.id}`}
                            className="text-brand-600 font-semibold hover:underline text-sm"
                          >
                            Resume →
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </main>
    </>
  );
}
