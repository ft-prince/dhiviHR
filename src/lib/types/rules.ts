/** Condition based on a competency's percentage score (0–100) */
export interface CompetencyCondition {
  type: "competency_score";
  slug: string;
  op: "lt" | "lte" | "gt" | "gte" | "eq";
  value: number; // 0–100
}

/** Condition based on the student's total score */
export interface TotalScoreCondition {
  type: "total_score";
  op: "lt" | "lte" | "gt" | "gte" | "eq";
  value: number; // 0–100
}

export type RuleCondition = CompetencyCondition | TotalScoreCondition;

export interface TemplateRule {
  id: string;
  name: string;
  /** How to combine conditions: ALL = AND, ANY = OR */
  logic: "ALL" | "ANY";
  conditions: RuleCondition[];
  recommendation: string;
  /** Optional track override; leave blank to keep computed track */
  track?: string;
  priority: number; // lower = evaluated first
}

// ── Evaluation helpers ─────────────────────────────────────────────────────

function evalOp(actual: number, op: RuleCondition["op"], threshold: number): boolean {
  switch (op) {
    case "lt":  return actual < threshold;
    case "lte": return actual <= threshold;
    case "gt":  return actual > threshold;
    case "gte": return actual >= threshold;
    case "eq":  return actual === threshold;
  }
}

export interface RuleContext {
  total: number;
  /** competency slug → percentage score (0–100) */
  competencyPct: Record<string, number>;
}

function evalCondition(c: RuleCondition, ctx: RuleContext): boolean {
  if (c.type === "total_score") return evalOp(ctx.total, c.op, c.value);
  const pct = ctx.competencyPct[c.slug] ?? 0;
  return evalOp(pct, c.op, c.value);
}

/**
 * Returns the first matching rule (sorted by priority asc) or null.
 */
export function evaluateRules(rules: TemplateRule[], ctx: RuleContext): TemplateRule | null {
  const sorted = [...rules].sort((a, b) => a.priority - b.priority);
  for (const rule of sorted) {
    if (rule.conditions.length === 0) continue;
    const match =
      rule.logic === "ALL"
        ? rule.conditions.every((c) => evalCondition(c, ctx))
        : rule.conditions.some((c) => evalCondition(c, ctx));
    if (match) return rule;
  }
  return null;
}
