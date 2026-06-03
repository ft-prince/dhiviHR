"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CollegeEditForm } from "@/components/admin/college-edit-form";
import { DeleteButton } from "@/components/admin/delete-button";
import { deleteCollegeAction } from "@/lib/admin/actions";
import Link from "next/link";

interface College {
  id: string;
  name: string;
  contactEmail: string | null;
  contactPhone: string | null;
  notes: string | null;
  slug: string;
}

interface StreamRow {
  id: string;
  name: string;
  templateName: string | null;
}

export function CollegeDetailClient({
  college,
  collegeStreams,
}: {
  college: College;
  collegeStreams: StreamRow[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);

  return (
    <div className="rounded-2xl border border-border bg-white p-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="grid sm:grid-cols-2 gap-3 flex-1 text-sm">
          <div>
            <span className="text-xs font-semibold text-ink-soft block">Contact Email</span>
            <span className="text-ink">{college.contactEmail ?? "—"}</span>
          </div>
          <div>
            <span className="text-xs font-semibold text-ink-soft block">Contact Phone</span>
            <span className="text-ink">{college.contactPhone ?? "—"}</span>
          </div>
          {college.notes && (
            <div className="sm:col-span-2">
              <span className="text-xs font-semibold text-ink-soft block">Notes</span>
              <span className="text-ink">{college.notes}</span>
            </div>
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          <Button size="sm" variant="outline" onClick={() => setEditing((v) => !v)}>
            {editing ? "Cancel" : "Edit"}
          </Button>
          <DeleteButton
            label="Delete College"
            confirmText="Delete this college? This cannot be undone."
            onDelete={() => deleteCollegeAction(college.id)}
          />
        </div>
      </div>

      <div>
        <span className="text-xs font-semibold text-ink-soft block mb-2">Streams</span>
        {collegeStreams.length === 0 ? (
          <p className="text-sm text-ink-soft">
            No streams assigned.{" "}
            <Link href="/admin/streams" className="text-brand-600 hover:underline">
              Create one →
            </Link>
          </p>
        ) : (
          <div className="space-y-1">
            {collegeStreams.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
                <span className="font-medium text-ink">{s.name}</span>
                <span className="text-ink-soft">{s.templateName ?? "No template"}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {editing && (
        <div className="border-t border-border pt-4">
          <CollegeEditForm college={college} onDone={() => { setEditing(false); router.refresh(); }} />
        </div>
      )}
    </div>
  );
}
