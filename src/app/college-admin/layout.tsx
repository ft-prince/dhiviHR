import { requireRole } from "@/lib/auth/guards";
import { CollegeAdminShell } from "@/components/college-admin/college-admin-shell";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { users } from "@/lib/db/schema";

export default async function CollegeAdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole(["college_admin"], "/login?callbackUrl=/admin");

  const adminDetail = await db
  .select({
    collegeName: users.collegeName,
    state: users.state,
    city: users.city,
    pocDesignation: users.pocDesignation,
  }).from(users)
  .where(eq(users.id, user.id))
  .limit(1)
  .then((res) => res[0]);

  return (
    <CollegeAdminShell user={user} adminDetail={adminDetail}>
      {children}
    </CollegeAdminShell>
  );
}