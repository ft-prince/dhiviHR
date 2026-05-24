import { requireRole } from "@/lib/auth/guards";
import { AdminShell } from "@/components/admin/admin-shell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole(["client_admin", "super_admin"], "/login?callbackUrl=/admin");
  return (
    <AdminShell scope="Admin" user={user}>
      {children}
    </AdminShell>
  );
}