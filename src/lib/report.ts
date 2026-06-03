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
Generate the complete deep-dive content for a comprehensive student assessment report.

### CLIENT DETAILS:
- Name: ${userName}
- Email: ${userEmail}
- Stream: ${userStream}

### INPUT METRICS FROM SERVER (Scale 1-4)
${scoresPayload}

---

### REPORT SECTIONS (generate all 10):

1. COVER PAGE:
- One motivational sentence explaining their overall level tier (${result.levelLabel}).

2. OVERALL LEVEL EXPLAINED:
- 2 paragraphs: what their tier means to a recruiter, and what it does NOT mean.
- Tone: second person ("You"), warm, motivational, never clinical.

3. COMMON BEHAVIOURAL COMPETENCY SCORECARD:
- Group into 3 clusters: "Mindset & Character", "Communication & Influence", "Execution & Thinking".
- For each competency: 1-line interpretation of what their gap level means.

4. STREAM-SPECIFIC COMPETENCIES:
- 1 paragraph: why these competencies matter for a ${userStream} professional entering the workforce in 2026.
- 1-line interpretation for each stream-specific competency.

5. AI AWARENESS INDICATOR:
- Determine tier: "Aware", "Exploring", or "Ready".
- 1 paragraph interpreting this level and why recruiters value it.
- List 3-5 specific AI tools relevant to ${userStream} they should learn (e.g. GitHub Copilot, ChatGPT, Midjourney, etc).

6. STRENGTHS & DEVELOPMENT AREAS:
- Top 2-3 Strengths: competency name, what it means at work, how to demonstrate in interviews, and a real-world scenario example.
- Top 2-3 Development Areas: competency name, what the gap looks like at work, and 4-5 hyper-specific actionable steps with resource recommendations (courses, books, tools). Frame as growth opportunities.

7. INDUSTRY READINESS CONTEXT:
- 1 paragraph on how the student's profile maps to current industry hiring trends in ${userStream} for 2025-2026.

8. 30-60-90 DAY ACTION PLAN:
- Days 1-30: 3-4 foundation actions (habits, mindset shifts, daily practices).
- Days 31-60: 3-4 build actions (skill-building, projects, portfolio work).
- Days 61-90: 3-4 demonstrate actions (interview prep, networking, showcasing).

9. INTERVIEW PREPARATION GUIDE:
- 3-4 likely interview questions based on their gap areas.
- For each: the question text and a suggested answer framework (STAR method or similar).

10. PEER COMPARISON INSIGHT:
- 1 paragraph general positioning statement (without revealing other students' data). Example tone: "Students at your level typically strengthen X competency first because..."

---

### STRICT OUTPUT FORMAT
Respond ONLY with a valid JSON object. No markdown wrappers, no conversational text.

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
    "interpretationParagraph": "string",
    "recommendedTools": ["string"]
  },
  "strengthsAndDevelopment": {
    "strengths": [
      {
        "competencyName": "string",
        "whatItMeansAtWork": "string",
        "howToDemonstrateInInterview": "string",
        "realWorldScenario": "string"
      }
    ],
    "developmentAreas": [
      {
        "competencyName": "string",
        "whatItLooksLikeAtWork": "string",
        "actionableSteps": ["string", "string", "string", "string", "string"]
      }
    ]
  },
  "industryReadiness": {
    "paragraph": "string"
  },
  "actionPlan": {
    "days30": ["string", "string", "string"],
    "days60": ["string", "string", "string"],
    "days90": ["string", "string", "string"]
  },
  "interviewPrep": {
    "questions": [
      {
        "question": "string",
        "answerFramework": "string"
      }
    ]
  },
  "peerInsight": {
    "positioningStatement": "string"
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
                "max_tokens": 8192,
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
