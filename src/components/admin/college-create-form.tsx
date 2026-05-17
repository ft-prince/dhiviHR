"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { createCollegeAction } from "@/lib/admin/actions";

export function CollegeCreateForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [pending, start] = useTransition();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setOk(false);
    const fd = new FormData(e.currentTarget);
    start(async () => {
      const res = await createCollegeAction({
        name: String(fd.get("name") ?? ""),
        contactEmail: String(fd.get("contactEmail") ?? ""),
        contactPhone: String(fd.get("contactPhone") ?? ""),
      });
      if (res.ok) {
        setOk(true);
        (e.target as HTMLFormElement).reset();
        router.refresh();
      } else setError(res.error);
    });
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 space-y-3">
      <div>
        <Label htmlFor="name">College Name</Label>
        <Input id="name" name="name" required minLength={2} />
      </div>
      <div>
        <Label htmlFor="contactEmail">Contact Email</Label>
        <Input id="contactEmail" name="contactEmail" type="email" />
      </div>
      <div>
        <Label htmlFor="contactPhone">Contact Phone</Label>
        <Input id="contactPhone" name="contactPhone" type="tel" />
      </div>
      {error && <div className="text-sm text-destructive">{error}</div>}
      {ok && <div className="text-sm text-brand-700">✓ College added.</div>}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Adding…" : "Add College"}
      </Button>
    </form>
  );
}
