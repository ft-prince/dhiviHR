"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { QuestionForm } from "@/components/admin/question-form";
import { DeleteButton } from "@/components/admin/delete-button";
import { upsertTrialQuestionAction, toggleTrialQuestionActiveAction, deleteTrialQuestionAction } from "@/lib/admin/actions";

export function TrialQuestionRow({
    id,
    sectionId,
    prompt,
    options,
    orderIndex,
    active,
    hint,
    sections,
}:{
    id: string;
    sectionId: string;
    prompt: string;
    options: { label: string; value: string }[];
    orderIndex: number;
    active: boolean;
    hint: string | null;
    sections: { id: string; name: string }[];
}){
    const router = useRouter();
    const [expanded, setExpanded] = useState(false);
    const [editing, setEditing] = useState(false);
    const [pending, start] = useTransition();

    function toggle(){
        start(async()=>{
            await toggleTrialQuestionActiveAction(id);
            router.refresh();
        })
    }
        return(
            <div className="rounded-2xl border border-border bg-white p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 text-xs text-ink-soft flex-wrap">
                            <span className="rounded-full bg-brand-50 text-brand-700 px-2 py-0.5 font-bold">#{orderIndex || "—"}</span>
                            <span className={`rounded-full px-2 py-0.5 font-bold ${active ? "bg-brand-500 text-white" : "bg-ink-soft/20 text-ink-soft"}`}>
                                {active ? "Active" : "Inactive"}
                            </span>
                        </div>
                        <div className="mt-2 font-medium text-ink break-words">{prompt}</div>
                    </div>
                    <div className="flex gap-1 flex-wrap sm:shrink-0 sm:justify-end">
                        <Button size="sm" variant="ghost" onClick={() => { setExpanded((v) => !v); setEditing(false); }}>
                            {expanded && !editing ? "Hide" : "Options"}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => { setEditing((v) => !v); setExpanded(false); }}>
                            {editing ? "Cancel" : "Edit"}
                        </Button>
                        <Button size="sm" variant={active ? "outline" : "default"} onClick={toggle} disabled={pending}>
                            {pending ? "…" : active ? "Disable" : "Enable"}
                        </Button>
                        <DeleteButton
                            label="Delete"
                            onDelete={() => deleteTrialQuestionAction(id)}
                        />
                    </div>
                </div>

                {expanded && !editing && (
                    <div className="mt-4 grid sm:grid-cols-2 gap-2">
                            {options.map((option) => (
                                <div key={option.value} className="rounded-lg border border-border bg-brand-50/40 px-3 py-2 text-sm flex justify-between">
                                    <span className="text-ink">
                                        {option.value}
                                    </span>
                                    <span className="text-brand-700 font-bold">{option.label}</span>
                                </div>
                            ))}
                        </div>
                )}

                {editing && (
                    <div className="mt-4 border-t border-border pt-4">
                        {/* <TrialQuestionForm
                            id={id}
                            sectionId={sectionId}
                            prompt={prompt}
                            options={options}
                            orderIndex={orderIndex}
                            active={active}
                            hint={hint}
                            sections={sections}
                            onSubmit={() => {
                                setEditing(false);
                                router.refresh();
                            }}
                        /> */}
                    </div>
                )}
            </div>
        )
    }