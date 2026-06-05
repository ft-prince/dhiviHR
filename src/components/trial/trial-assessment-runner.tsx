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
  { value: "1", idle: "border-red-600 text-red-600",    selected: "bg-red-600 text-white" },
  { value: "2", idle: "border-orange-600 text-orange-600", selected: "bg-orange-600 text-white" },
  { value: "3", idle: "border-yellow-600 text-yellow-600", selected: "bg-yellow-500 text-white" },
  { value: "4", idle: "border-green-600 text-green-600",  selected: "bg-green-600 text-white" },
  { value: "5", idle: "border-blue-600 text-blue-600",   selected: "bg-blue-600 text-white" },
];
export function TrialAssessmentRunner({questions} : {questions: TrialQuestion[]}) {
    const router = useRouter();
    const trialQuestions = questions.length < 1 ? placeHolderQuestions : questions;
    const [error, setError] = useState<string | null>(null);
    const [answers, setAnswers] = useState<Record<string, string>>({});

    const allAnswered = trialQuestions.every(q => answers[q.id] !== undefined);


    async function handleSubmit(event: React.FormEvent<HTMLFormElement>){
        event.preventDefault();
        setError(null);
        try{
            const res = await submitTrialResponsesAction(answers);
            if(res.ok){
                const score = res.score;
                router.push(`/trial/result/${score}`);
            }
        } catch (error) {
            setError("An error occurred while submitting the trial responses.");
        }
    }

    return(
            <form className="mt-4 border rounded-lg divide-y font-display" onSubmit={handleSubmit}>
                {trialQuestions.map((question) => (
                    <div key={question.id} className="flex flex-col md:grid md:grid-cols-[1fr_1fr] md:items-center gap-2 py-3 px-4">
                        <h2 className="text-base md:text-lg">{question.prompt}</h2>
                        <div className="grid grid-cols-[1fr_1fr_1.25fr_1fr_1fr] md:grid-cols-5 md:gap-1">
                            {question.options.map((option) => (
                                <div key={option.value} className="flex justify-center">
                                    <button type="button" className={`w-fit md:w-full py-1.5 px-2 md:px-1 text-xs md:text-sm border-2 font-bold rounded-full transition-colors duration-150
                                        ${answers[question.id] === option.value
                                        ? `${button_colors.find((c) => c.value === option.value)?.selected} border-transparent`
                                        : `${button_colors.find((c) => c.value === option.value)?.idle} bg-white`
                                        }`}
                                        onClick={() => setAnswers(prev => ({...prev, [question.id]: option.value}))}
                                        >
                                        {option.label}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
                <button type="submit" 
                disabled={!allAnswered}
                className={`mt-6 px-5 py-2 rounded-full text-white text-xl flex flex-row gap-2 items-center transition-colors duration-200
                ${allAnswered
                ? "bg-brand-500 border border-brand-500 hover:bg-brand-600 cursor-pointer"
                : "bg-gray-300 border border-gray-300 cursor-not-allowed"
                }`}>
                    Submit 
                </button>
            </form>
    )
}