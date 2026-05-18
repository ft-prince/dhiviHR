"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CollegeEditForm } from "@/components/admin/college-edit-form";
import { DeleteButton } from "@/components/admin/delete-button";
import { assignTemplateToCollegeAction, deleteCollegeAction } from "@/lib/admin/actions";

interface College {
  id: string;
  name: string;
  contactEmail: string | null;
  contactPhone: string | null;
  notes: string | null;
  templateId: string | null;
  slug: string;
}

interface Template {
  id: string;
  name: string;
}

export function CollegeDetailClient({
  college,
  templateList,
}: {
  college: College;
  templateList: Template[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [pending, start] = useTransition();
  const [templateError, setTemplateError] = useState<string | null>(null);

  function handleTemplateChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    setTemplateError(null);
    start(async () => {
      const result = await assignTemplateToCollegeAction(college.id, value || null);
      if (!result.ok) setTemplateError("Failed to assign template");
      else router.refresh();
    });
  }

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
          <div>
            <span className="text-xs font-semibold text-ink-soft block mb-1">Assessment Template</span>
            <select
              defaultValue={college.templateId ?? ""}
              onChange={handleTemplateChange}
              disabled={pending}
              className="rounded-md border border-border bg-white px-3 py-1.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">— Use default template —</option>
              {templateList.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            {templateError && <p className="mt-1 text-xs text-destructive">{templateError}</p>}
          </div>
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
      {editing && (
        <div className="border-t border-border pt-4">
          <CollegeEditForm college={college} onDone={() => { setEditing(false); router.refresh(); }} />
        </div>
      )}
    </div>
  );
}
