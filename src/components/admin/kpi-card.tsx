import { cn } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  delta,
  hint,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string | number;
  delta?: string;
  hint?: string;
  icon?: React.ComponentType<{ className?: string }>;
  tone?: "default" | "accent";
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border bg-white p-5 md:p-6 shadow-soft",
        tone === "accent" ? "border-brand-200 bg-brand-50/60" : "border-border",
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-widest text-ink-soft">{label}</span>
        {Icon && (
          <span className="h-9 w-9 rounded-full bg-brand-50 grid place-items-center text-brand-600">
            <Icon className="h-4 w-4" />
          </span>
        )}
      </div>
      <div className="mt-3 font-display font-bold text-3xl md:text-4xl text-ink leading-none">{value}</div>
      <div className="mt-2 flex items-center gap-2 text-xs">
        {delta && <span className="rounded-full bg-brand-50 text-brand-700 px-2 py-0.5 font-bold">{delta}</span>}
        {hint && <span className="text-ink-soft">{hint}</span>}
      </div>
    </div>
  );
}
