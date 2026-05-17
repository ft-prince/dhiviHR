import { desc, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { PageHeader } from "@/components/admin/page-header";
import { DataTable } from "@/components/admin/data-table";
import { RoleSelect } from "@/components/admin/role-select";

export const dynamic = "force-dynamic";

export default async function SuperAdminsPage() {
  const admins = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(inArray(users.role, ["client_admin", "super_admin"]))
    .orderBy(desc(users.createdAt));

  return (
    <>
      <PageHeader title="Admin Team" description="Promote or demote platform staff. Super admins can change any user role." />
      <DataTable
        rows={admins}
        emptyText="No admins yet"
        columns={[
          { key: "name", header: "Name", render: (r) => (
            <div>
              <div className="font-medium text-ink">{r.name ?? "—"}</div>
              <div className="text-xs text-ink-soft">{r.email}</div>
            </div>
          )},
          { key: "role", header: "Role", render: (r) => <RoleSelect userId={r.id} role={r.role} /> },
          { key: "since", header: "Since", render: (r) => new Date(r.createdAt).toLocaleDateString() },
        ]}
      />
    </>
  );
}
