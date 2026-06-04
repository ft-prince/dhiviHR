// "use client";

// import { useState, useTransition } from "react";
// import { useRouter } from "next/navigation";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { upsertTrialQuestionAction } from "@/lib/admin/actions";
// import { Option, TrialQuestion } from "@/lib/types/rules";

// interface TrialQuestionFormProps {
//     initial?: {id: string} & TrialQuestion;
//     createAction?: (data: TrialQuestion) => Promise<{ ok: boolean; error?: string }>;
//     onDone?: () => void;
//     sections: { id: string; name: string }[];
// }

// export function TrialQuestionForm({ initial, createAction, onDone, sections }: TrialQuestionFormProps) {
//     const router = useRouter();
//     const [pending, start] = useTransition();
//     const [error, setError] = useState<string | null>(null);

//     const [sectionId, setSectionId] = useState<string>(initial?.sectionId ?? sections?.[0]?.id ?? "");
//     const [prompt, setPrompt] = useState(initial?.prompt ?? "");
//     const [orderIndex, setOrderIndex] = useState(initial?.orderIndex ?? 0);
//     const [active, setActive] = useState(initial?.active ?? true);
//     const [options, setOptions] = useState<Option[]>(
//         initial?.options ?? [
//             { label: "", value: "1" },
//             { label: "", value: "2" },
//             { label: "", value: "3" },
//             { label: "", value: "4" },
//         ],
//     );

//     function handleSubmit(e: React.FormEvent) {
//         e.preventDefault();
//         setError(null);
//         if (prompt.trim().length < 5){
//             setError("Prompt must be at least 5 characters long.");
//             return;
//         }
//         const data: TrialQuestion = {
//             sectionId,
//             prompt,
//             orderIndex,
//             active,
//             options
//         };

//         start(async () => {
//             const res = initial
//                 ? await upsertTrialQuestionAction({ id: initial.id, ...data })
//                 : await createAction?.(data) ?? { ok: false, error: "Create action not defined" };