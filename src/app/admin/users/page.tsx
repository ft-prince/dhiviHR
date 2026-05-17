import { desc, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { PageHeader } from "@/components/admin/page-header";
import { DataTable } from "@/components/admin/data-table";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const list = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      phone: users.phone,
      collegeId: users.collegeId,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt))
    .limit(200);

  return (
    <>
      <PageHeader title="Users" description="All registered users across the platform. Most recent first." />
      <DataTable
        rows={list}
        emptyText="No users yet"
        columns={[
          { key: "name", header: "Name", render: (r) => (
            <div>
              <div className="font-medium text-ink">{r.name ?? "—"}</div>
              <div className="text-xs text-ink-soft">{r.email}</div>
            </div>
          )},
          { key: "role", header: "Role", render: (r) => (
            <span className="rounded-full bg-brand-50 text-brand-700 px-2 py-0.5 text-xs font-bold whitespace-nowrap">
              {r.role.replace("_", " ")}
            </span>
          )},
          { key: "phone", header: "Phone", render: (r) => r.phone ?? "—" },
          { key: "joined", header: "Joined", render: (r) => new Date(r.createdAt).toLocaleDateString() },
        ]}
      />
      <p className="mt-4 text-xs text-ink-soft">Showing up to 200 most-recent users.</p>
    </>
  );
}
