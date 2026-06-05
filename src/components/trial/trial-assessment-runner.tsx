import { TrialQuestion } from "@/lib/types/rules";
import { useState } from "react";
import { submitTrialResponsesAction } from "@/lib/trial/actions";
import { redirect } from "next/navigation";
import { useRouter } from "next/navigation";
const placeHolderQuestions = [
    {
        id: "placeholder-1",
        prompt: "This is a placeholder question for demonstration purposes.",
        options: [
            {label: "Never", value: "1"},
            {label: "Rarely", value: "2"},
            {label: "Sometimes", value: "3"},
            {label: "Usually", value: "4"},
            {label: "Always", value: "5"}
        ],
        orderIndex: 0,
        hint: "Hint question 1"
    },
    {
        id: "placeholder-2",
        prompt: "Please replace this with actual questions from the database.",
        options: [
            {label: "Never", value: "1"},
            {label: "Rarely", value: "2"},
            {label: "Sometimes", value: "3"},
            {label: "Usually", value: "4"},
            {label: "Always", value: "5"}
        ],
        orderIndex: 1,
        hint: "Hint question 2"
    },
    {
        id: "placeholder-3",
        prompt: "Please replace this with actual questions from the database.",
        options: [
            {label: "Never", value: "1"},
            {label: "Rarely", value: "2"},
            {label: "Sometimes", value: "3"},
            {label: "Usually", value: "4"},
            {label: "Always", value: "5"}
        ],
        orderIndex: 2,
        hint: "Hint question 3"
    },
    {
        id: "placeholder-4",
        prompt: "Please replace this with actual questions from the database.",
        options: [
            {label: "Never", value: "1"},
            {label: "Rarely", value: "2"},
            {label: "Sometimes", value: "3"},
            {label: "Usually", value: "4"},
            {label: "Always", value: "5"}
        ],
        orderIndex: 3,
        hint: "Hint question 4"
    },
    {
        id: "placeholder-5",
        prompt: "Please replace this with actual questions from the database.",
        options: [
            {label: "Never", value: "1"},
            {label: "Rarely", value: "2"},
            {label: "Sometimes", value: "3"},
            {label: "Usually", value: "4"},
            {label: "Always", value: "5"}
        ],
        orderIndex: 4,
        hint: "Hint question 5"
    },
    {
        id: "placeholder-6",
        prompt: "Please replace this with actual questions from the database.",
        options: [
            {label: "Never", value: "1"},
            {label: "Rarely", value: "2"},
            {label: "Sometimes", value: "3"},
            {label: "Usually", value: "4"},
            {label: "Always", value: "5"}
        ],
        orderIndex: 5,
        hint: "Hint question 6"
    },
    {
        id: "placeholder-7",
        prompt: "Please replace this with actual questions from the database.",
        options: [
            {label: "Never", value: "1"},
            {label: "Rarely", value: "2"},
            {label: "Sometimes", value: "3"},
            {label: "Usually", value: "4"},
            {label: "Always", value: "5"}
        ],
        orderIndex: 6,
        hint: "Hint question 7"
    }
];

const button_colors = [
    {value: "1", color: "border-red-700 text-red-700 hover:bg-red-600 hover:text-white"},
    {value: "2", color: "border-orange-700 text-orange-700 hover:bg-orange-600 hover:text-white"},
    {value: "3", color: "border-yellow-700 text-yellow-700 hover:bg-yellow-600 hover:text-white"},
    {value: "4", color: "border-green-700 text-green-700 hover:bg-green-600 hover:text-white"},
    {value: "5", color: "border-blue-700 text-blue-700 hover:bg-blue-600 hover:text-white"}
]
export function TrialAssessmentRunner({questions} : {questions: TrialQuestion[]}) {
    const router = useRouter();
    const trialQuestions = questions.length < 1 ? placeHolderQuestions : questions;
    const [error, setError] = useState<string | null>(null);
    const [answers, setAnswers] = useState<Record<string, string>>({});


    async function handleSubmit(event: React.FormEvent<HTMLFormElement>){
        event.preventDefault();
        setError(null);
        try{
            const res = await submitTrialResponsesAction(answers);
            if(res.ok){
                router.push(`/trial/result/${res.score}`);
            }
        } catch (error) {
            setError("An error occurred while submitting the trial responses.");
        }
    }

    return(
            <form className="mt-4 border rounded-lg divide-y" onSubmit={handleSubmit}>
                {trialQuestions.map((question) => (
                    <div key={question.id} className="flex flex-col md:grid md:grid-cols-[1fr_1fr] md:items-center gap-2 py-3 px-4">
                        <h2 className="text-base md:text-lg">{question.prompt}</h2>
                        <div className="grid grid-cols-[1fr_1fr_1.25fr_1fr_1fr] md:grid-cols-5 md:gap-1">
                            {question.options.map((option) => (
                                <div key={option.value} className="flex justify-center">
                                    <button className={`w-fit md:w-full md:gap-4 py-1.5 px-2 md:px-1 text-xs md:text-sm border-2 font-bold ${button_colors.find((c) => c.value === option.value)?.color} rounded-full bg-white truncate`}
                                        onClick={() => setAnswers(prev => ({...prev, [question.id]: option.value}))}
                                        >
                                        {option.label}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </form>
    )
}