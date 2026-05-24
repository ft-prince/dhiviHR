"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { setUserRoleAction } from "@/lib/admin/actions";

const ROLES = ["student", "college_student", "client_admin", "super_admin"] as const;

const ROLE_LABELS: Record<string, string> = {
  student: "Student",
  college_student: "College Student",
  client_admin: "Admin",
  super_admin: "Super Admin",
};

export function RoleSelect({ userId, role }: { userId: string; role: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as (typeof ROLES)[number];
    setErr(null);
    start(async () => {
      const res = await setUserRoleAction({ userId, role: next });
      if (res.ok) router.refresh();
      else setErr(res.error);
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <select
        defaultValue={role}
        onChange={onChange}
        disabled={pending}
        className="h-9 rounded-md border border-input bg-white px-2 text-sm focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-ring"
      >
        {ROLES.map((r) => (
          <option key={r} value={r}>{ROLE_LABELS[r] ?? r}</option>
        ))}
      </select>
      {err && <span className="text-[10px] text-destructive">{err}</span>}
    </div>
  );
}
