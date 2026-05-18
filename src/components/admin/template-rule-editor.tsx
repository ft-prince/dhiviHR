"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateTemplateRulesAction } from "@/lib/admin/actions";
import type { TemplateRule, RuleCondition } from "@/lib/types/rules";

const OPS = [
  { value: "gte", label: "≥" },
  { value: "gt",  label: ">" },
  { value: "lte", label: "≤" },
  { value: "lt",  label: "<" },
  { value: "eq",  label: "=" },
] as const;

interface Competency { slug: string; label: string }

function newRule(priority: number): TemplateRule {
  return {
    id: crypto.randomUUID(),
    name: "",
    logic: "ALL",
    conditions: [],
    recommendation: "",
    track: "",
    priority,
  };
}

function newCondition(): RuleCondition {
  return { type: "total_score", op: "gte", value: 60 };
}

function ConditionRow({
  cond,
  competencies,
  onChange,
  onRemove,
}: {
  cond: RuleCondition;
  competencies: Competency[];
  onChange: (c: RuleCondition) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 bg-white border border-border rounded-lg px-3 py-2">
      {/* Type selector */}
      <select
        value={cond.type}
        onChange={(e) => {
          const type = e.target.value as RuleCondition["type"];
          if (type === "total_score") onChange({ type, op: "gte", value: 60 });
          else onChange({ type: "competency_score", slug: competencies[0]?.slug ?? "", op: "gte", value: 60 });
        }}
        className="rounded border border-border bg-white px-2 py-1 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-brand-500"
      >
        <option value="total_score">Total Score</option>
        <option value="competency_score">Competency Score</option>
      </select>

      {/* Competency slug selector (only for competency_score) */}
      {cond.type === "competency_score" && (
        <select
          value={cond.slug}
          onChange={(e) => onChange({ ...cond, slug: e.target.value })}
          className="rounded border border-border bg-white px-2 py-1 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          {competencies.map((c) => (
            <option key={c.slug} value={c.slug}>{c.label}</option>
          ))}
        </select>
      )}

      {/* Operator */}
      <select
        value={cond.op}
        onChange={(e) => onChange({ ...cond, op: e.target.value as RuleCondition["op"] })}
        className="rounded border border-border bg-white px-2 py-1 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-brand-500 w-14"
      >
        {OPS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>

      {/* Value */}
      <Input
        type="number"
        min={0}
        max={100}
        value={cond.value}
        onChange={(e) => onChange({ ...cond, value: Number(e.target.value) })}
        className="w-20 text-xs"
      />
      <span className="text-xs text-ink-soft">pts</span>

      <button type="button" onClick={onRemove} className="ml-auto text-xs text-red-500 hover:underline">Remove</button>
    </div>
  );
}

function RuleCard({
  rule,
  competencies,
  onChange,
  onRemove,
}: {
  rule: TemplateRule;
  competencies: Competency[];
  onChange: (r: TemplateRule) => void;
  onRemove: () => void;
}) {
  function updateCondition(i: number, c: RuleCondition) {
    const conditions = rule.conditions.map((x, idx) => (idx === i ? c : x));
    onChange({ ...rule, conditions });
  }
  function addCondition() {
    onChange({ ...rule, conditions: [...rule.conditions, newCondition()] });
  }
  function removeCondition(i: number) {
    onChange({ ...rule, conditions: rule.conditions.filter((_, idx) => idx !== i) });
  }

  return (
    <div className="rounded-xl border border-border bg-brand-50/30 p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="flex-1 grid sm:grid-cols-2 gap-2">
          <div>
            <label className="text-xs font-semibold text-ink-soft">Rule Name</label>
            <Input
              value={rule.name}
              onChange={(e) => onChange({ ...rule, name: e.target.value })}
              placeholder="e.g. Strong Communicator, Weak Problem Solver"
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-ink-soft">Condition Logic</label>
            <select
              value={rule.logic}
              onChange={(e) => onChange({ ...rule, logic: e.target.value as "ALL" | "ANY" })}
              className="mt-1 w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="ALL">ALL conditions must match (AND)</option>
              <option value="ANY">ANY condition must match (OR)</option>
            </select>
          </div>
        </div>
        <button type="button" onClick={onRemove} className="text-xs text-red-500 hover:underline mt-5 shrink-0">Delete rule</button>
      </div>

      {/* Conditions */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-ink-soft">Conditions</span>
          <button type="button" onClick={addCondition} className="text-xs text-brand-600 hover:underline font-semibold">+ Add condition</button>
        </div>
        {rule.conditions.length === 0 && (
          <p className="text-xs text-ink-soft italic">No conditions yet — rule will never match.</p>
        )}
        {rule.conditions.map((c, i) => (
          <ConditionRow
            key={i}
            cond={c}
            competencies={competencies}
            onChange={(updated) => updateCondition(i, updated)}
            onRemove={() => removeCondition(i)}
          />
        ))}
      </div>

      {/* Output */}
      <div className="grid sm:grid-cols-2 gap-2">
        <div className="sm:col-span-2">
          <label className="text-xs font-semibold text-ink-soft">Recommendation <span className="font-normal">(shown to student when this rule fires)</span></label>
          <textarea
            value={rule.recommendation}
            onChange={(e) => onChange({ ...rule, recommendation: e.target.value })}
            rows={2}
            placeholder="Based on your strong communication but lower problem-solving score, we recommend…"
            className="mt-1 w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-ink placeholder:text-ink-soft focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-ink-soft">Track Override <span className="font-normal">(leave blank to use default)</span></label>
          <Input
            value={rule.track ?? ""}
            onChange={(e) => onChange({ ...rule, track: e.target.value })}
            placeholder="e.g. Communication Excellence Track"
            className="mt-1"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-ink-soft">Priority <span className="font-normal">(lower fires first)</span></label>
          <Input
            type="number"
            min={0}
            value={rule.priority}
            onChange={(e) => onChange({ ...rule, priority: Number(e.target.value) })}
            className="mt-1"
          />
        </div>
      </div>
    </div>
  );
}

export function TemplateRuleEditor({
  templateId,
  initialRules,
  competencies,
}: {
  templateId: string;
  initialRules: TemplateRule[];
  competencies: Competency[];
}) {
  const router = useRouter();
  const [rules, setRules] = useState<TemplateRule[]>(initialRules);
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function updateRule(id: string, r: TemplateRule) {
    setRules((prev) => prev.map((x) => (x.id === id ? r : x)));
    setSaved(false);
  }
  function removeRule(id: string) {
    setRules((prev) => prev.filter((x) => x.id !== id));
    setSaved(false);
  }
  function addRule() {
    setRules((prev) => [...prev, newRule(prev.length)]);
    setSaved(false);
  }

  function save() {
    setErr(null);
    start(async () => {
      const res = await updateTemplateRulesAction(templateId, rules);
      if (res.ok) { setSaved(true); router.refresh(); }
      else setErr(res.error ?? "Save failed");
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-lg text-ink">
            Evaluation Rules
            <span className="ml-2 text-sm font-normal text-ink-soft">({rules.length})</span>
          </h2>
          <p className="text-xs text-ink-soft mt-0.5">
            Rules are evaluated in priority order. The first match provides the recommendation shown to the student.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {saved && <span className="text-xs text-green-600 font-semibold">Saved ✓</span>}
          {err && <span className="text-xs text-red-600">{err}</span>}
          <Button size="sm" variant="outline" onClick={addRule}>+ Add Rule</Button>
          <Button size="sm" onClick={save} disabled={pending}>{pending ? "Saving…" : "Save Rules"}</Button>
        </div>
      </div>

      {rules.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-white p-10 text-center text-sm text-ink-soft">
          No rules yet. Click "+ Add Rule" to create your first evaluation rule.
        </div>
      ) : (
        <div className="space-y-3">
          {rules
            .slice()
            .sort((a, b) => a.priority - b.priority)
            .map((r) => (
              <RuleCard
                key={r.id}
                rule={r}
                competencies={competencies}
                onChange={(updated) => updateRule(r.id, updated)}
                onRemove={() => removeRule(r.id)}
              />
            ))}
        </div>
      )}
    </div>
  );
}
