import { eq, sql, desc, gte, and } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import { users, assessments, scores, payments, colleges, accessCodes } from "@/lib/db/schema";

async function _getPlatformStats() {
  const [[userRow], [attemptRow], [paymentRow], [collegeRow], [codeRow]] = await Promise.all([
    db.select({
      totalUsers:     sql<number>`count(*)::int`,
      studentUsers:   sql<number>`count(*) FILTER (WHERE role = 'student')::int`,
      collegeStudents: sql<number>`count(*) FILTER (WHERE role = 'college_student')::int`,
    }).from(users),

    db.select({
      totalAttempts:     sql<number>`count(*)::int`,
      completedAttempts: sql<number>`count(*) FILTER (WHERE status = 'completed')::int`,
    }).from(assessments),

    db.select({
      paidCount:    sql<number>`count(*) FILTER (WHERE status = 'paid')::int`,
      revenuePaise: sql<number>`COALESCE(SUM(amount) FILTER (WHERE status = 'paid'), 0)::int`,
    }).from(payments),

    db.select({ totalColleges: sql<number>`count(*)::int` }).from(colleges),

    db.select({
      codesIssued:   sql<number>`count(*)::int`,
      codesRedeemed: sql<number>`count(*) FILTER (WHERE redeemed_at IS NOT NULL)::int`,
    }).from(accessCodes),
  ]);

  const { totalUsers, studentUsers, collegeStudents } = userRow;
  const { totalAttempts, completedAttempts } = attemptRow;
  const { paidCount, revenuePaise } = paymentRow;
  const { totalColleges } = collegeRow;
  const { codesIssued, codesRedeemed } = codeRow;

  return {
    totalUsers, studentUsers, collegeStudents,
    totalAttempts, completedAttempts,
    paidCount, revenueInr: Math.round((revenuePaise as number) / 100),
    totalColleges, codesIssued, codesRedeemed,
    conversionPct: completedAttempts > 0 ? Math.round((paidCount / completedAttempts) * 100) : 0,
  };
}

export const getPlatformStats = unstable_cache(
  _getPlatformStats,
  ["platform-stats"],
  { revalidate: 60, tags: ["platform-stats"] },
);

async function _getLevelDistribution() {
  return db
    .select({
      level: scores.level,
      count: sql<number>`count(*)::int`,
    })
    .from(scores)
    .groupBy(scores.level);
}

export const getLevelDistribution = unstable_cache(
  _getLevelDistribution,
  ["level-distribution"],
  { revalidate: 60, tags: ["level-distribution"] },
);

export async function getRecentSignups(limit = 8) {
  return db
    .select({ id: users.id, name: users.name, email: users.email, role: users.role, createdAt: users.createdAt })
    .from(users)
    .orderBy(desc(users.createdAt))
    .limit(limit);
}

export async function getRecentAttempts(limit = 8) {
  return db
    .select({
      id: assessments.id,
      status: assessments.status,
      startedAt: assessments.startedAt,
      userName: users.name,
      userEmail: users.email,
      total: scores.total,
      level: scores.level,
    })
    .from(assessments)
    .leftJoin(users, eq(users.id, assessments.userId))
    .leftJoin(scores, eq(scores.assessmentId, assessments.id))
    .orderBy(desc(assessments.startedAt))
    .limit(limit);
}

export async function getRevenueByDay(days = 14) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return db
    .select({
      day: sql<string>`to_char(created_at, 'YYYY-MM-DD')`,
      amount: sql<number>`COALESCE(SUM(amount), 0)::int`,
      count: sql<number>`count(*)::int`,
    })
    .from(payments)
    .where(and(eq(payments.status, "paid"), gte(payments.createdAt, since)))
    .groupBy(sql`to_char(created_at, 'YYYY-MM-DD')`)
    .orderBy(sql`to_char(created_at, 'YYYY-MM-DD')`);
}
