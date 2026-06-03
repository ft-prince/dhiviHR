import { AssessmentScore } from "./scoring";
import {jsPDF} from "jspdf";
import autoTable from "jspdf-autotable";

interface AssessmentReportJSON{
  assessmentName: string;
  candidateName: string;
  completedAt: string;
  score: number;
  sections: Array<{
    title: string;
    score: number;
    feedback: string;
  }>;
}

export function build_prompt(result: AssessmentScore, userName: string, userEmail: string, userStream: string) {
    const scoresPayload = JSON.stringify(result, null, 2);

    return `
    You are an expert career coach, copywriter and industrial organizational psychologist.
    Your task is to generate the complete deep-dive content for a 6-page comprehensive student perfomance report based on their recent assessment metrics.
    ###  CLIENT DETAILS:
    - Name: ${userName}
    - Email: ${userEmail}
    -Stream: ${userStream}
    
    ### INPUT METRICS FROM SERVER (Scale 1-4)
    ${scoresPayload}
    
    ---

    ### CORE REPORT STRUCTURE REQUIREMENTS:
    You must generate tailored text content for each of the following 6 sections exactly as described below:

    1. COVER PAGE:
    - Provide a motivational, one-line plain-language description explaining their overall level tier (${result.levelLabel}). 

    2. OVERALL LEVEL EXPLAINED:
    - Write a 2-paragraph plain-language explanation of what their tier means, what it tells a recruiter, and what it does NOT mean.
    - Tone: Written in the second person ("You"), warm, highly motivational, and informative—never clinical or judgmental.

    3. COMMON BEHAVIOURAL COMPETENCY SCORECARD:
    - Group interpretations for the common competencies into 3 specific clusters: "Mindset & Character", "Communication & Influence", and "Execution & Thinking".
    - For each competency found in the input data, write a crisp 1-line plain-language interpretation explaining what their current gap level means.

    4. STREAM-SPECIFIC COMPETENCY SECTION:
    - Generate a professional 1-paragraph explanation answering: "Why these specific competencies matter for a ${userStream} professional entering the workforce in 2026."
    - Provide a 1-line contextual interpretation for any stream-specific competencies listed in the breakdown.

    5. AI AWARENESS INDICATOR:
    - Determine an AI readiness tier based on the data or overall profile ("Aware", "Exploring", or "Ready").
    - Write a 1-paragraph interpretation of this AI readiness level, highlighting it as a major platform differentiator and why recruiters value it highly right now.

    6. STRENGTHS & DEVELOPMENT AREAS:
    - Top 2-3 Strengths: Provide the competency name, what it means dynamically at work, and a concrete example of how the student can demonstrate it in interviews.
    - Top 2-3 Development Areas: Provide the competency name, what the gap looks like in real work situations, and 2-3 hyper-specific, actionable steps they can take in the next 30-60 days (e.g., instead of "improve communication", suggest "practice summarizing your day in 3 sentences every evening"). Frame these as growth opportunities, not failures.

    ---

    ### STRICT OUTPUT FORMAT
    You must respond ONLY with a valid JSON object. Do not include any markdown formatting wrappers like \\\`\\\`\\\`json or introductory/concluding conversational text. The JSON must strictly conform to this TypeScript structure:

    {
    "coverPage": {
        "oneLineDescription": "string"
    },
    "overallLevelExplained": {
        "paragraph1": "string",
        "paragraph2": "string"
    },
    "commonCompetencies": {
        "mindsetAndCharacter": [
        { "name": "string", "oneLineInterpretation": "string" }
        ],
        "communicationAndInfluence": [
        { "name": "string", "oneLineInterpretation": "string" }
        ],
        "executionAndThinking": [
        { "name": "string", "oneLineInterpretation": "string" }
        ]
    },
    "streamSpecific": {
        "whyItMattersParagraph": "string",
        "competencies": [
        { "name": "string", "oneLineInterpretation": "string" }
        ]
    },
    "aiAwareness": {
        "badgeLevel": "Aware | Exploring | Ready",
        "interpretationParagraph": "string"
    },
    "strengthsAndDevelopment": {
        "strengths": [
        {
            "competencyName": "string",
            "whatItMeansAtWork": "string",
            "howToDemonstrateInInterview": "string"
        }
        ],
        "developmentAreas": [
        {
            "competencyName": "string",
            "whatItLooksLikeAtWork": "string",
            "actionableSteps": ["string", "string", "string"]
        }
        ]
    }
    }
    `.trim();
}

export async function generatePdfData(result : AssessmentScore, userName: string, userEmail: string, userStream: string) {
    const api_key =  process.env.GROK_API_KEY 
    const GROK_API_URL = "https://api.groq.com/openai/v1/chat/completions"
    const GROQ_MODEL = "llama-3.3-70b-versatile"

    if (!api_key) {
        console.error("[ai_report] GROQ_API_KEY not set. Cannot generate AI report.");
        return null;
    }

    const prompt = build_prompt(result, userName, userEmail, userStream)

    try{
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
        console.log("[ai_report] Calling Groq with model:", GROQ_MODEL);
        const response = await fetch(GROK_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${api_key}`
            },
            body: JSON.stringify({
                "model": GROQ_MODEL,
                "messages": [
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.3,
                "max_tokens": 4096,
                "response_format": {type: "json_object"}
            }),
            signal: controller.signal
        }); 
        clearTimeout(timeoutId);
        console.log("[ai_report] Response status:", response.status);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP Error ${response.status}: ${errorText}`);
        }
        const data = await response.json();
        let content = data.choices?.[0]?.message?.content?.strip?.() ?? data.choices?.[0]?.message?.content;

        if (!content) {
            throw new Error("No content in API response");
        }

        content = content.trim();
        if(content.startsWith("```")){
            const parts = content.split("```");
            content = parts[1] || parts[0];
            if(content.startsWith("json")){
                content = content.substring(4);
        }
    }
    console.log("[ai_report] Raw content:", content?.substring(0, 200));
    return JSON.parse(content.trim());
}catch(exc:any){
    if(exc.name === "AbortError"){
    console.error("[ai_report] Request timed out after 60 seconds");
    }else{
        console.error("[ai_report] Error generating report:", exc);
    }
    return null;
}
}

export async function downloadAssessmentReport(assessmentId: string) : Promise<void>{
    try {
        const response = await fetch(`/api/report/${assessmentId}`);
        if (!response.ok) throw new Error(`Failed to download report: ${response.statusText}`);

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `report-${assessmentId}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error("PDF Download pipeline failed:", error);
        alert("Could not generate report document. Please try again.");
    } 
}
