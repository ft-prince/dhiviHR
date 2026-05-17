import { requireRole } from "@/lib/auth/guards";
import { AdminShell } from "@/components/admin/admin-shell";

export default async function SuperLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole(["super_admin"], "/login?callbackUrl=/super");
  return (
    <AdminShell scope="Super Admin" user={user}>
      {children}
    </AdminShell>
  );
}