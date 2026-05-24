"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TemplateForm } from "@/components/admin/template-form";
import { DeleteButton } from "@/components/admin/delete-button";
import { QuestionForm } from "@/components/admin/question-form";
import {
  addQuestionToTemplateAction,
  removeQuestionFromTemplateAction,
  deleteTemplateAction,
  deleteQuestionAction,
  createAndAddToTemplateAction,
  forkAndUpdateTemplateQuestionAction,
} from "@/lib/admin/actions";

interface Option {
  id: string;
  label: string;
  weight: number;
}

interface InTemplateQuestion {
  tqId: string;
  tqActive: boolean;
  tqOrderIndex: number;
  id: string;
  competency: string;
  prompt: string;
  options: unknown;
  active: boolean;
  orderIndex: number;
}

interface AvailableQuestion {
  id: string;
  competency: string;
  prompt: string;
  active: boolean;
}

interface Props {
  template: {
    id: string;
    name: string;
    description: string | null;
    isDefault: boolean;
  };
  inTemplate: InTemplateQuestion[];
  availableQuestions: AvailableQuestion[];
  assignedColleges: { id: string; name: string }[];
  competencyLabels: Record<string, string>;
}

// ── Inline question card (in-template list) ──────────────────────────────────

function InTemplateCard({
  q,
  templateId,
  competencyLabels,
  competencies,
}: {
  q: InTemplateQuestion;
  templateId: string;
  competencyLabels: Record<string, string>;
  competencies: { slug: string; label: string }[];
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [removePending, startRemove] = useTransition();

  function handleRemove() {
    startRemove(async () => {
      await removeQuestionFromTemplateAction(templateId, q.id);
      router.refresh();
    });
  }

  return (
    <div className="rounded-xl border border-border bg-white">
      {/* Header row */}
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:gap-3">
        <div className="flex-1 min-w-0">
          <span className="text-xs font-semibold text-brand-600">
            {competencyLabels[q.competency] ?? q.competency}
          </span>
          <p className="mt-0.5 text-sm text-ink break-words">{q.prompt}</p>
          {mode === "view" && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {(q.options as Option[]).map((o) => (
                <span key={o.id} className="rounded-md bg-brand-50 text-brand-700 px-2 py-0.5 text-xs">
                  {o.label} <b>({o.weight})</b>
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-1 flex-wrap sm:shrink-0 sm:justify-end">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setMode(mode === "edit" ? "view" : "edit")}
          >
            {mode === "edit" ? "Cancel" : "Edit"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleRemove}
            disabled={removePending}
            className="text-amber-600 hover:bg-amber-50"
          >
            {removePending ? "…" : "Remove"}
          </Button>
          <DeleteButton
            label="Delete"
            confirmText="Delete this question from the bank entirely?"
            onDelete={() => deleteQuestionAction(q.id)}
          />
        </div>
      </div>

      {/* Inline edit form */}
      {mode === "edit" && (
        <div className="border-t border-border px-4 pb-4 pt-3 bg-brand-50/30">
          <p className="text-xs text-amber-600 mb-3">
            Edits here create a copy for this template only — other templates keep the original.
          </p>
          <QuestionForm
            initial={{
              id: q.id,
              competency: q.competency,
              prompt: q.prompt,
              options: q.options as Option[],
              orderIndex: q.orderIndex,
              active: q.active,
            }}
            competencies={competencies}
            createAction={(data) => forkAndUpdateTemplateQuestionAction(q.tqId, templateId, data)}
            onDone={() => { setMode("view"); router.refresh(); }}
          />
        </div>
      )}
    </div>
  );
}

// ── Create-new question form ──────────────────────────────────────────────────

function NewQuestionPanel({
  templateId,
  nextIndex,
  competencies,
}: {
  templateId: string;
  nextIndex: number;
  competencies: { slug: string; label: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button size="sm" onClick={() => setOpen(true)} className="w-full">
        + Create New Question
      </Button>
    );
  }

  return (
    <div className="rounded-xl border border-brand-200 bg-brand-50/40 p-4">
      <h3 className="font-semibold text-sm text-ink mb-3">New question — will be added to this template</h3>
      <QuestionForm
        createAction={async (data) => createAndAddToTemplateAction(templateId, { ...data, orderIndex: nextIndex })}
        competencies={competencies}
        onDone={() => { setOpen(false); router.refresh(); }}
      />
    </div>
  );
}

// ── Available question row ────────────────────────────────────────────────────

function AvailableRow({
  q,
  templateId,
  index,
  competencyLabels,
}: {
  q: AvailableQuestion;
  templateId: string;
  index: number;
  competencyLabels: Record<string, string>;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function handleAdd() {
    start(async () => {
      await addQuestionToTemplateAction(templateId, q.id, index);
      router.refresh();
    });
  }

  return (
    <div className="flex items-start gap-3 px-4 py-3 border-b border-border last:border-0 hover:bg-brand-50/30">
      <div className="flex-1 min-w-0">
        <span className="text-xs font-semibold text-brand-600">
          {competencyLabels[q.competency] ?? q.competency}
        </span>
        <p className="mt-0.5 text-sm text-ink line-clamp-2">{q.prompt}</p>
      </div>
      <Button size="sm" onClick={handleAdd} disabled={pending} className="shrink-0">
        {pending ? "…" : "Add"}
      </Button>
    </div>
  );
}

// ── Root component ────────────────────────────────────────────────────────────

export function TemplateDetailClient({
  template,
  inTemplate,
  availableQuestions,
  assignedColleges,
  competencyLabels,
}: Props) {
  const router = useRouter();
  const [editingMeta, setEditingMeta] = useState(false);
  const [filter, setFilter] = useState("");
  const [deletingTemplate, startDeleteTemplate] = useTransition();

  const competencies = Object.entries(competencyLabels).map(([slug, label]) => ({ slug, label }));

  const filteredAvailable = availableQuestions.filter(
    (q) =>
      !filter ||
      q.prompt.toLowerCase().includes(filter.toLowerCase()) ||
      q.competency.includes(filter.toLowerCase()),
  );

  function handleDeleteTemplate() {
    startDeleteTemplate(async () => {
      await deleteTemplateAction(template.id);
      router.push("/admin/templates");
    });
  }

  return (
    <div className="space-y-6">
      {/* Template meta card */}
      <div className="rounded-2xl border border-border bg-white p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {template.isDefault && (
                <span className="rounded-full bg-brand-500 text-white px-2 py-0.5 text-xs font-bold">Default</span>
              )}
              {assignedColleges.length > 0 && (
                <span className="text-xs text-ink-soft break-words">
                  Assigned to: {assignedColleges.map((c) => c.name).join(", ")}
                </span>
              )}
            </div>
            {template.description && <p className="mt-2 text-sm text-ink-soft">{template.description}</p>}
          </div>
          <div className="flex gap-2 shrink-0 flex-wrap">
            <Button size="sm" variant="outline" onClick={() => setEditingMeta((v) => !v)}>
              {editingMeta ? "Cancel" : "Edit Template"}
            </Button>
            {/* Delete template — navigates back to listing after deletion */}
            <Button
              size="sm"
              variant="ghost"
              className="text-red-600 hover:bg-red-50"
              disabled={deletingTemplate}
              onClick={() => {
                if (confirm("Delete this template? Colleges using it will lose their template assignment.")) {
                  handleDeleteTemplate();
                }
              }}
            >
              {deletingTemplate ? "Deleting…" : "Delete Template"}
            </Button>
          </div>
        </div>
        {editingMeta && (
          <div className="mt-4 border-t border-border pt-4">
            <TemplateForm
              initial={template}
              onDone={() => { setEditingMeta(false); router.refresh(); }}
            />
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-[1fr_400px] gap-6 items-start">
        {/* ── Left: questions in this template ── */}
        <div className="space-y-3 min-w-0">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-lg text-ink">
              Questions in Template
              <span className="ml-2 text-sm font-normal text-ink-soft">({inTemplate.length})</span>
            </h2>
          </div>

          <NewQuestionPanel templateId={template.id} nextIndex={inTemplate.length} competencies={competencies} />

          {inTemplate.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-white p-10 text-center text-sm text-ink-soft">
              No questions yet. Create one above or pick from the bank →
            </div>
          ) : (
            <div className="space-y-2">
              {inTemplate.map((q) => (
                <InTemplateCard
                  key={q.id}
                  q={q}
                  templateId={template.id}
                  competencyLabels={competencyLabels}
                  competencies={competencies}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Right: question bank ── */}
        <div className="space-y-3 min-w-0 lg:sticky lg:top-6">
          <h2 className="font-display font-bold text-lg text-ink">
            Add from Bank
            <span className="ml-2 text-sm font-normal text-ink-soft">({filteredAvailable.length})</span>
          </h2>

          <Input
            placeholder="Filter questions…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />

          {filteredAvailable.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-white p-8 text-center text-sm text-ink-soft">
              {filter ? "No questions match that filter." : "All bank questions are already in this template."}
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-white overflow-hidden max-h-[70vh] overflow-y-auto">
              {filteredAvailable.map((q, i) => (
                <AvailableRow
                  key={q.id}
                  q={q}
                  templateId={template.id}
                  index={inTemplate.length + i}
                  competencyLabels={competencyLabels}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}