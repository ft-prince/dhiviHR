import { requireRole } from "@/lib/auth/guards";
import { CollegeAdminShell } from "@/components/college-admin/college-admin-shell";

export default async function CollegeAdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole(["college_admin"], "/login?callbackUrl=/admin");
  return (
    <CollegeAdminShell user={user}>
      {children}
    </CollegeAdminShell>
  );
}