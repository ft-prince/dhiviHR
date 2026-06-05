"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { upsertTrialQuestionAction } from "@/lib/admin/actions";
import { Option, TrialQuestion } from "@/lib/types/rules";

type TrialQuestionData = {
    sectionId: string;
    prompt: string;
    options: Option[];
    active: boolean;
    orderIndex: number;
    hint: string | null;
};

interface TrialQuestionFormProps {
    initial?: {id: string} & TrialQuestionData;
    onDone?: () => void;
    sections: { id: string; name: string }[];
}

export function TrialQuestionForm({ initial, onDone, sections }: TrialQuestionFormProps) {
    const router = useRouter();
    const [pending, start] = useTransition();
    const [error, setError] = useState<string | null>(null);

    const [sectionId, setSectionId] = useState<string>(initial?.sectionId ?? sections?.[0]?.id ?? ""); //remove setting sections[0] as default
    const [prompt, setPrompt] = useState(initial?.prompt ?? ""); 
    const [orderIndex, setOrderIndex] = useState(initial?.orderIndex ?? 0);
    const [active, setActive] = useState(initial?.active ?? true);
    const [options, setOptions] = useState<Option[]>(
        initial?.options ?? [
            { label: "", value: "1" },
            { label: "", value: "2" },
            { label: "", value: "3" },
            { label: "", value: "4" },
        ],
    );
    const [hint, setHint] = useState<string | null>(initial?.hint ?? null);

    function addOption() {
        if (options.length >= 5) return;
        setOptions((prev) => [...prev, {label: "", value: String(prev.length + 1)}]);
    }

    function updateOption(idx: number, label: string, value: string) {
        setOptions((prev) => prev.map((o, i) => (i === idx ? { ...o, label, value } : o))); 
    }

    function removeOption(idx:number){
        if (options.length <= 2) return;
        setOptions((prev) => prev.filter((_, i) => i !== idx));
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        if (prompt.trim().length < 5){
            setError("Prompt must be at least 5 characters long.");
            return;
        }
        const data: TrialQuestionData = {
            sectionId,
            prompt,
            orderIndex,
            active,
            options,
            hint
        };

        start(async () => {
            const res = await upsertTrialQuestionAction({ id: initial?.id, ...data });
            if (res.ok){
                router.refresh();
                onDone?.();
            }else{
                setError(res.error ?? "Save failed.");
            }
        });
    }

    return(
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
                <div>
                    <label className="text-xs font-semibold text-ink-soft">Section</label>
                    <select
                        value={sectionId}
                        onChange={(e) => setSectionId(e.target.value)}
                        required
                        className="mt-1 w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-500"
                        >
                            <option value="">Select a section</option>
                            {sections.map((s) => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                </div>

                <div>
                    <label className="text-xs font-semibold text-ink-soft">Order Index</label>
                    <Input
                        type="number"
                        min={0}
                        value={orderIndex}
                        onChange={(e) => setOrderIndex(Number(e.target.value))}
                        className="mt-1"
                    />
                </div>

                <div>
                    <label className="text-xs font-semibold text-ink-soft">Question Prompt</label>
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        rows={3}
                        required
                        className="mt-1 w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-ink placeholder:text-ink-soft focus:ring-2 focus:ring-brand-500 resize-none"
                        placeholder="Enter the question prompt text..."
                        />
                </div>
                
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-semibold text-ink-soft">Options (weight 1–5)</label>
                        {options.length < 5 && (
                            <button type="button" onClick={addOption} className="text-xs text-brand-600 font-semibold hover:underline">
                                + Add option
                            </button>
                        )}
                    </div>
                </div>
                
                <div className="space-y-2">
                    {options.map((o,i)=> (
                        <div key={i} className="flex items-center gap-2">
                            <Input
                                value={o.label}
                                onChange={(e) => updateOption(i, "label", e.target.value)}
                                placeholder={`Option ${i+1}`}
                                required
                                className="flex-1"
                            />
                            <Input
                                type="number"
                                min={0}
                                max={5}
                                value={o.value}
                                onChange={(e) => updateOption(i, "value", e.target.value)}
                            />
                            {options.length > 2 && (
                                <button type="button" onClick={() => removeOption(i)} 
                                className="text-xs text-destructive hover:underline shrink-0">
                                    Remove
                                </button>
                            )}
                        </div>
                    ))}
                </div>
                <p className="mt-1 text-xs text-ink-soft">Weight: 1 = lowest, 5 = highest.</p>
            </div>
            <div>
                <label className="text-xs font-semibold text-ink-soft">Hint (optional)</label>
                <textarea
                    value={hint ?? ""}
                    onChange={(e) => setHint(e.target.value)}
                    rows={2}
                    className="mt-1 w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-ink placeholder:text-ink-soft focus:ring-2 focus:ring-brand-500 resize-none"
                    placeholder="Enter a hint for the question..."
                />
            </div>

            <div className="flex items-center gap-2">
                <input
                    type="checkbox"
                    id="active"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="h-4 w-4 rounded border-border text-brand-600 focus:ring-brand-500"
                />
                <label htmlFor="active" className="text-sm text-ink">Active</label>
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
            <div className="flex justify-end gap-2">
                {onDone && (
                    <Button type="button" variant="ghost" onClick={onDone}>
                        Cancel
                    </Button>
                )}
                <Button type="submit" disabled={pending}>
                    {pending ? "Saving…" : initial ?  "Save Changes" : "Create Question"}
                </Button>
            </div>
        </form>
    );
}