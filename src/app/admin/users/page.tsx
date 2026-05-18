import { desc, eq, ilike, or, and, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, colleges } from "@/lib/db/schema";
import { PageHeader } from "@/components/admin/page-header";
import { UsersTableClient } from "@/components/admin/users-table-client";
import { Pagination } from "@/components/admin/pagination";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const role = sp.role ?? "";
  const collegeFilter = sp.college ?? "";
  const page = Math.max(1, Number(sp.page ?? 1));

  const filters = [];
  if (q) filters.push(or(ilike(users.name, `%${q}%`), ilike(users.email, `%${q}%`))!);
  if (role) filters.push(eq(users.role, role as never));
  if (collegeFilter) filters.push(eq(users.collegeId, collegeFilter));
  const where = filters.length > 0 ? and(...filters) : undefined;

  const [list, [{ total }], collegeList] = await Promise.all([
    db
      .select({ id: users.id, name: users.name, email: users.email, role: users.role, phone: users.phone, collegeId: users.collegeId, createdAt: users.createdAt })
      .from(users)
      .where(where)
      .orderBy(desc(users.createdAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ total: sql<number>`count(*)::int` }).from(users).where(where),
    db.select({ id: colleges.id, name: colleges.name }).from(colleges).orderBy(colleges.name),
  ]);

  return (
    <>
      <PageHeader title="Users" description="All registered users across the platform." />
      <UsersTableClient
        users={list}
        colleges={collegeList}
        filters={{ q, role, college: collegeFilter }}
        exportHref={`/api/admin/users/csv?q=${encodeURIComponent(q)}&role=${encodeURIComponent(role)}&college=${encodeURIComponent(collegeFilter)}`}
      />
      <Pagination total={total} page={page} pageSize={PAGE_SIZE} />
    </>
  );
}
