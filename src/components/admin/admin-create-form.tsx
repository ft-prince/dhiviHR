"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { createAdminAction } from "@/lib/admin/actions";

type AdminRole = "client_admin" | "super_admin";

export function AdminCreateForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [pending, start] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setOk(false);
    const form = e.currentTarget;
    const fd = new FormData(form);
    start(async () => {
      const res = await createAdminAction({
        name: String(fd.get("name") ?? ""),
        email: String(fd.get("email") ?? ""),
        password: String(fd.get("password") ?? ""),
        role: (String(fd.get("role") ?? "client_admin") as AdminRole),
      });
      if (res.ok) {
        setOk(true);
        form.reset();
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 space-y-3">
      <div>
        <Label htmlFor="admin-name">Full Name</Label>
        <Input id="admin-name" name="name" required minLength={2} />
      </div>
      <div>
        <Label htmlFor="admin-email">Email</Label>
        <Input id="admin-email" name="email" type="email" required autoComplete="off" />
      </div>
      <div>
        <Label htmlFor="admin-password">Temporary Password</Label>
        <PasswordInput id="admin-password" name="password" required minLength={8} autoComplete="new-password" />
        <p className="mt-1 text-xs text-ink-soft">Share securely; ask them to change it after first login.</p>
      </div>
      <div>
        <Label htmlFor="admin-role">Role</Label>
        <select
          id="admin-role"
          name="role"
          defaultValue="client_admin"
          className="mt-1 flex h-11 w-full rounded-md border border-input bg-white px-3 text-sm text-ink focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-ring"
        >
          <option value="client_admin">Admin</option>
          <option value="super_admin">Super Admin</option>
        </select>
      </div>
      {error && <div className="text-sm text-destructive">{error}</div>}
      {ok && <div className="text-sm text-brand-700">✓ Admin account created.</div>}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Creating…" : "Create Admin"}
      </Button>
    </form>
  );
}
