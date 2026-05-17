import { eq, sql, desc, gte, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, assessments, scores, payments, colleges, accessCodes } from "@/lib/db/schema";

export async function getPlatformStats() {
  const [
    [{ totalUsers }],
    [{ studentUsers }],
    [{ collegeStudents }],
    [{ totalAttempts }],
    [{ completedAttempts }],
    [{ paidCount, revenuePaise }],
    [{ totalColleges }],
    [{ codesIssued }],
    [{ codesRedeemed }],
  ] = await Promise.all([
    db.select({ totalUsers: sql<number>`count(*)::int` }).from(users),
    db.select({ studentUsers: sql<number>`count(*)::int` }).from(users).where(eq(users.role, "student")),
    db.select({ collegeStudents: sql<number>`count(*)::int` }).from(users).where(eq(users.role, "college_student")),
    db.select({ totalAttempts: sql<number>`count(*)::int` }).from(assessments),
    db.select({ completedAttempts: sql<number>`count(*)::int` }).from(assessments).where(eq(assessments.status, "completed")),
    db.select({
      paidCount: sql<number>`count(*) FILTER (WHERE status = 'paid')::int`,
      revenuePaise: sql<number>`COALESCE(SUM(amount) FILTER (WHERE status = 'paid'), 0)::int`,
    }).from(payments),
    db.select({ totalColleges: sql<number>`count(*)::int` }).from(colleges),
    db.select({ codesIssued: sql<number>`count(*)::int` }).from(accessCodes),
    db.select({ codesRedeemed: sql<number>`count(*) FILTER (WHERE redeemed_at IS NOT NULL)::int` }).from(accessCodes),
  ]);

  return {
    totalUsers, studentUsers, collegeStudents,
    totalAttempts, completedAttempts,
    paidCount, revenueInr: Math.round((revenuePaise as number) / 100),
    totalColleges, codesIssued, codesRedeemed,
    conversionPct: completedAttempts > 0 ? Math.round((paidCount / completedAttempts) * 100) : 0,
  };
}

export async function getLevelDistribution() {
  const rows = await db
    .select({
      level: scores.level,
      count: sql<number>`count(*)::int`,
    })
    .from(scores)
    .groupBy(scores.level);
  return rows;
}

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
  const rows = await db
    .select({
      day: sql<string>`to_char(created_at, 'YYYY-MM-DD')`,
      amount: sql<number>`COALESCE(SUM(amount), 0)::int`,
      count: sql<number>`count(*)::int`,
    })
    .from(payments)
    .where(and(eq(payments.status, "paid"), gte(payments.createdAt, since)))
    .groupBy(sql`to_char(created_at, 'YYYY-MM-DD')`)
    .orderBy(sql`to_char(created_at, 'YYYY-MM-DD')`);
  return rows;
}
