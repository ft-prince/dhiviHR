"use client";

import { useState, useTransition } from "react";
import { fmtDate } from "@/lib/utils";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/admin/data-table";
import { DeleteButton } from "@/components/admin/delete-button";
import { updateUserAction, deleteUserAction } from "@/lib/admin/actions";

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  phone: string | null;
  collegeId: string | null;
  createdAt: Date;
}

interface College { id: string; name: string }

interface Filters { q: string; role: string; college: string }

const ROLES = ["student", "college_student", "client_admin"];

const ROLE_LABELS: Record<string, string> = {
  student: "Student",
  college_student: "College Student",
  client_admin: "Admin",
  super_admin: "Super Admin",
};

function UserEditRow({ user, colleges, onDone }: { user: User; colleges: College[]; onDone: () => void }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [name, setName] = useState(user.name ?? "");
  const [phone, setPhone] = useState(user.phone ?? "");
  const [collegeId, setCollegeId] = useState(user.collegeId ?? "");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    start(async () => {
      const res = await updateUserAction({ userId: user.id, name, phone, collegeId });
      if (res.ok) { router.refresh(); onDone(); } else setErr(res.error ?? "Update failed");
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap gap-2 items-end p-3 bg-brand-50/40 rounded-xl mt-1">
      <div><label className="text-xs font-semibold text-ink-soft">Name</label><Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-36" /></div>
      <div><label className="text-xs font-semibold text-ink-soft">Phone</label><Input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 w-32" /></div>
      <div>
        <label className="text-xs font-semibold text-ink-soft">College</label>
        <select value={collegeId} onChange={(e) => setCollegeId(e.target.value)} className="mt-1 block rounded-md border border-border bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-500">
          <option value="">No college</option>
          {colleges.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div className="flex gap-2"><Button type="submit" size="sm" disabled={pending}>{pending ? "…" : "Save"}</Button><Button type="button" size="sm" variant="ghost" onClick={onDone}>Cancel</Button></div>
      {err && <p className="w-full text-xs text-red-600">{err}</p>}
    </form>
  );
}

export function UsersTableClient({
  users,
  colleges,
  filters,
  exportHref,
}: {
  users: User[];
  colleges: College[];
  filters: Filters;
  exportHref: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [editingId, setEditingId] = useState<string | null>(null);

  // Local filter state (updates URL on submit)
  const [q, setQ] = useState(filters.q);
  const [role, setRole] = useState(filters.role);
  const [college, setCollege] = useState(filters.college);

  function applyFilters(e?: React.FormEvent) {
    e?.preventDefault();
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (role) params.set("role", role);
    if (college) params.set("college", college);
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  }

  function clearFilters() {
    setQ(""); setRole(""); setCollege("");
    router.push(pathname);
  }

  const hasFilters = filters.q || filters.role || filters.college;

  return (
    <div className="space-y-3">
      {/* Filter bar */}
      <form onSubmit={applyFilters} className="flex flex-wrap gap-2 items-end rounded-2xl border border-border bg-white p-4">
        <div className="flex-1 min-w-44">
          <label className="text-xs font-semibold text-ink-soft">Search</label>
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name or email…" className="mt-1" />
        </div>
        <div>
          <label className="text-xs font-semibold text-ink-soft">Role</label>
          <select value={role} onChange={(e) => setRole(e.target.value)} className="mt-1 block rounded-md border border-border bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-500">
            <option value="">All roles</option>
            {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r] ?? r}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-ink-soft">College</label>
          <select value={college} onChange={(e) => setCollege(e.target.value)} className="mt-1 block rounded-md border border-border bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-500">
            <option value="">All colleges</option>
            {colleges.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="flex gap-2">
          <Button type="submit" size="sm">Apply</Button>
          {hasFilters && <Button type="button" size="sm" variant="ghost" onClick={clearFilters}>Clear</Button>}
          <a href={exportHref} download="users.csv">
            <Button type="button" size="sm" variant="outline">Export CSV</Button>
          </a>
        </div>
      </form>

      <DataTable
        rows={users}
        emptyText="No users match the current filters."
        columns={[
          { key: "name", header: "Name", render: (r) => (
            <div><div className="font-medium text-ink">{r.name ?? "—"}</div><div className="text-xs text-ink-soft">{r.email}</div></div>
          )},
          { key: "role", header: "Role", render: (r) => (
            <span className="rounded-full bg-brand-50 text-brand-700 px-2 py-0.5 text-xs font-bold whitespace-nowrap">{ROLE_LABELS[r.role] ?? r.role}</span>
          )},
          { key: "phone", header: "Phone", render: (r) => r.phone ?? "—" },
          { key: "college", header: "College", render: (r) => {
            const c = colleges.find((c) => c.id === r.collegeId);
            return c ? <span className="text-xs">{c.name}</span> : <span className="text-ink-soft">—</span>;
          }},
          { key: "joined", header: "Joined", render: (r) => fmtDate(r.createdAt) },
          { key: "actions", header: "", render: (r) => (
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" onClick={() => setEditingId(editingId === r.id ? null : r.id)}>
                {editingId === r.id ? "Cancel" : "Edit"}
              </Button>
              <DeleteButton label="Delete" onDelete={() => deleteUserAction(r.id)} />
            </div>
          )},
        ]}
      />

      {editingId && (
        <UserEditRow
          user={users.find((u) => u.id === editingId)!}
          colleges={colleges}
          onDone={() => setEditingId(null)}
        />
      )}
    </div>
  );
}
