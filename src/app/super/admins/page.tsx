import { desc, inArray } from "drizzle-orm";
import { fmtDate } from "@/lib/utils";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { PageHeader } from "@/components/admin/page-header";
import { DataTable } from "@/components/admin/data-table";
import { RoleSelect } from "@/components/admin/role-select";
import { AdminCreateForm } from "@/components/admin/admin-create-form";

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
      <PageHeader title="Admin Team" description="Create new admins, or promote and demote existing platform staff." />
      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        <div className="min-w-0">
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
              { key: "since", header: "Since", render: (r) => fmtDate(r.createdAt) },
            ]}
          />
        </div>
        <div className="rounded-2xl border border-border bg-white p-6 h-fit">
          <h2 className="font-display font-bold text-lg text-ink">Create Admin</h2>
          <p className="mt-1 text-xs text-ink-soft">Adds a new staff account directly. Only super admins can do this.</p>
          <AdminCreateForm />
        </div>
      </div>
    </>
  );
}
