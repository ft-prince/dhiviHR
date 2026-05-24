/**
 * Run with:  npx tsx src/lib/db/seed-templates.ts
 *
 * Creates 3 form templates and ~20 real assessment questions across all 5
 * competencies.  Safe to re-run — it skips questions that share the same
 * prompt and skips templates that already exist by name.
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { eq } from "drizzle-orm";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const { questions, formTemplates, templateQuestions } = schema;

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");
const db = drizzle(neon(url), { schema });

/* ─────────────────────────────────────────────────────────────────────────
   QUESTIONS  (weight 0 = weakest, 4 = strongest)
───────────────────────────────────────────────────────────────────────── */
const QUESTION_BANK = [
  /* ── COMMUNICATION & CONFIDENCE ──────────────────────────────────── */
  {
    competency: "communication_confidence",
    prompt: "When presenting a complex idea to a mixed audience, you typically:",
    options: [
      { id: "a", label: "Wing it — your knowledge will carry you through", weight: 0 },
      { id: "b", label: "Read from your notes or slides verbatim", weight: 1 },
      { id: "c", label: "Prepare key points and use plain language for clarity", weight: 3 },
      { id: "d", label: "Structure the talk by audience need, check for understanding throughout", weight: 4 },
    ],
  },
  {
    competency: "communication_confidence",
    prompt: "A colleague gives you critical feedback you strongly disagree with. You:",
    options: [
      { id: "a", label: "Dismiss it — they clearly don't understand the context", weight: 0 },
      { id: "b", label: "Accept it politely but change nothing", weight: 1 },
      { id: "c", label: "Ask clarifying questions and reflect before deciding", weight: 3 },
      { id: "d", label: "Engage openly, acknowledge valid points, explain your reasoning calmly", weight: 4 },
    ],
  },
  {
    competency: "communication_confidence",
    prompt: "Senior colleagues are dominating a meeting and you have a relevant idea. You:",
    options: [
      { id: "a", label: "Say nothing — it's not your place", weight: 0 },
      { id: "b", label: "Message someone privately after the meeting", weight: 1 },
      { id: "c", label: "Wait for a natural pause, then contribute concisely", weight: 3 },
      { id: "d", label: "Build on what's being discussed and introduce your idea at the right moment", weight: 4 },
    ],
  },
  {
    competency: "communication_confidence",
    prompt: "You need to deliver bad news (e.g. a project delay) to a stakeholder. You:",
    options: [
      { id: "a", label: "Avoid the conversation as long as possible", weight: 0 },
      { id: "b", label: "Send a short message and hope for the best", weight: 1 },
      { id: "c", label: "Share the news clearly with a brief explanation", weight: 3 },
      { id: "d", label: "Lead with the impact, explain the cause, and present a recovery plan", weight: 4 },
    ],
  },

  /* ── PROBLEM SOLVING ─────────────────────────────────────────────── */
  {
    competency: "problem_solving",
    prompt: "You receive a task with unclear requirements and a tight deadline. Your first move is to:",
    options: [
      { id: "a", label: "Start immediately with your best guess", weight: 0 },
      { id: "b", label: "Wait until someone gives you more details", weight: 1 },
      { id: "c", label: "List your assumptions and proceed carefully", weight: 2 },
      { id: "d", label: "Identify the one or two most critical unknowns and clarify them right away", weight: 4 },
    ],
  },
  {
    competency: "problem_solving",
    prompt: "You encounter a problem no one on your team has seen before. You:",
    options: [
      { id: "a", label: "Immediately escalate to a manager", weight: 0 },
      { id: "b", label: "Search online for a direct answer", weight: 2 },
      { id: "c", label: "Break it into smaller parts, research each, then attempt a solution", weight: 3 },
      { id: "d", label: "Define the problem precisely, form a hypothesis, test it, then document findings", weight: 4 },
    ],
  },
  {
    competency: "problem_solving",
    prompt: "Halfway through a project you realise your initial approach was flawed. You:",
    options: [
      { id: "a", label: "Push through — changing course now would cause too much disruption", weight: 0 },
      { id: "b", label: "Quietly make adjustments without telling anyone", weight: 1 },
      { id: "c", label: "Raise the issue and propose an alternative approach", weight: 3 },
      { id: "d", label: "Acknowledge the flaw clearly, quantify the impact, and present a pivot plan with trade-offs", weight: 4 },
    ],
  },
  {
    competency: "problem_solving",
    prompt: "When analysing data to support a decision, you typically:",
    options: [
      { id: "a", label: "Pick the numbers that support your preferred outcome", weight: 0 },
      { id: "b", label: "Use the most readily available data, even if incomplete", weight: 1 },
      { id: "c", label: "Cross-check data sources and flag gaps before concluding", weight: 3 },
      { id: "d", label: "Define success metrics upfront, stress-test the data, and state confidence levels explicitly", weight: 4 },
    ],
  },

  /* ── TEAMWORK & LEADERSHIP ───────────────────────────────────────── */
  {
    competency: "teamwork_leadership",
    prompt: "A team member is consistently missing deadlines and affecting everyone. You:",
    options: [
      { id: "a", label: "Do their work yourself to cover the gap", weight: 1 },
      { id: "b", label: "Complain to others on the team", weight: 0 },
      { id: "c", label: "Mention it to your manager without speaking to them first", weight: 2 },
      { id: "d", label: "Have a direct, private conversation focusing on impact and offering support", weight: 4 },
    ],
  },
  {
    competency: "teamwork_leadership",
    prompt: "Two team members are in visible conflict that's affecting work. You:",
    options: [
      { id: "a", label: "Ignore it — not your business", weight: 0 },
      { id: "b", label: "Pick a side based on who you're closer to", weight: 0 },
      { id: "c", label: "Acknowledge the tension and encourage them to talk it through", weight: 3 },
      { id: "d", label: "Facilitate a structured conversation that focuses on shared goals, not personalities", weight: 4 },
    ],
  },
  {
    competency: "teamwork_leadership",
    prompt: "Your team is asked to make a fast decision with limited information. You:",
    options: [
      { id: "a", label: "Defer entirely to whoever speaks loudest", weight: 0 },
      { id: "b", label: "Stall until more information is available", weight: 1 },
      { id: "c", label: "Gather quick input from key people and propose a direction", weight: 3 },
      { id: "d", label: "Align on the decision criteria, make the call transparently, and set a review checkpoint", weight: 4 },
    ],
  },
  {
    competency: "teamwork_leadership",
    prompt: "A new team member is struggling to integrate. You:",
    options: [
      { id: "a", label: "Leave it to HR or their manager", weight: 0 },
      { id: "b", label: "Be friendly in meetings but take no specific action", weight: 1 },
      { id: "c", label: "Check in with them and offer guidance on team norms", weight: 3 },
      { id: "d", label: "Proactively pair with them, share context, and introduce them to key stakeholders", weight: 4 },
    ],
  },

  /* ── INITIATIVE & GROWTH ─────────────────────────────────────────── */
  {
    competency: "initiative_growth",
    prompt: "Between tasks with no assignments queued, you typically:",
    options: [
      { id: "a", label: "Wait until someone gives you work", weight: 0 },
      { id: "b", label: "Browse social media or handle personal tasks", weight: 0 },
      { id: "c", label: "Tidy up existing work or improve documentation", weight: 2 },
      { id: "d", label: "Identify a gap or improvement opportunity and take action without being asked", weight: 4 },
    ],
  },
  {
    competency: "initiative_growth",
    prompt: "You receive critical feedback from a supervisor. Your reaction is to:",
    options: [
      { id: "a", label: "Feel defensive and dismiss it", weight: 0 },
      { id: "b", label: "Accept it in the moment but not change behaviour", weight: 1 },
      { id: "c", label: "Reflect on it and make gradual adjustments", weight: 3 },
      { id: "d", label: "Thank them, ask for specifics, create an action plan, and follow up on progress", weight: 4 },
    ],
  },
  {
    competency: "initiative_growth",
    prompt: "How do you stay current in your field?",
    options: [
      { id: "a", label: "I rely on what I learned in college / training", weight: 0 },
      { id: "b", label: "I read articles occasionally when they appear in my feed", weight: 1 },
      { id: "c", label: "I follow industry sources and apply learnings when relevant", weight: 3 },
      { id: "d", label: "I have a deliberate learning routine: courses, communities, and applying new skills in projects", weight: 4 },
    ],
  },
  {
    competency: "initiative_growth",
    prompt: "You spot a process inefficiency that isn't in your job scope. You:",
    options: [
      { id: "a", label: "It's not my problem — ignore it", weight: 0 },
      { id: "b", label: "Mention it to a colleague informally", weight: 1 },
      { id: "c", label: "Document it and pass it to the relevant team", weight: 3 },
      { id: "d", label: "Draft a brief improvement proposal and present it to the right stakeholder", weight: 4 },
    ],
  },

  /* ── INTERVIEW READINESS ─────────────────────────────────────────── */
  {
    competency: "interview_readiness",
    prompt: "When asked 'Tell me about yourself' in an interview, you:",
    options: [
      { id: "a", label: "Recount your life story chronologically", weight: 0 },
      { id: "b", label: "Read from your CV", weight: 1 },
      { id: "c", label: "Give a structured summary of your background and skills", weight: 3 },
      { id: "d", label: "Deliver a concise, role-relevant narrative that connects your past to the specific opportunity", weight: 4 },
    ],
  },
  {
    competency: "interview_readiness",
    prompt: "You're asked a behavioural question ('Describe a time you failed'). You:",
    options: [
      { id: "a", label: "Claim you haven't really failed at anything significant", weight: 0 },
      { id: "b", label: "Give a vague answer with no specifics", weight: 1 },
      { id: "c", label: "Describe a real failure and what you learned", weight: 3 },
      { id: "d", label: "Use the STAR structure: set context, explain the failure honestly, and focus on the measurable lesson", weight: 4 },
    ],
  },
  {
    competency: "interview_readiness",
    prompt: "Towards the end of an interview, you're asked 'Do you have any questions for us?' You:",
    options: [
      { id: "a", label: "Say 'No, I think everything was covered'", weight: 0 },
      { id: "b", label: "Ask about salary and holiday allowance", weight: 1 },
      { id: "c", label: "Ask about day-to-day responsibilities and team culture", weight: 3 },
      { id: "d", label: "Ask insightful questions that show you researched the company and are thinking about real contribution", weight: 4 },
    ],
  },
  {
    competency: "interview_readiness",
    prompt: "How do you prepare for an important interview?",
    options: [
      { id: "a", label: "I review my CV the night before", weight: 0 },
      { id: "b", label: "I research the company briefly and prepare generic answers", weight: 1 },
      { id: "c", label: "I research the role, company, and prepare answers to likely questions", weight: 3 },
      { id: "d", label: "I research deeply, prepare STAR stories, rehearse out loud, and prepare smart questions", weight: 4 },
    ],
  },
];

/* ─────────────────────────────────────────────────────────────────────────
   TEMPLATE DEFINITIONS
───────────────────────────────────────────────────────────────────────── */
type CompetencySlug =
  | "communication_confidence"
  | "problem_solving"
  | "teamwork_leadership"
  | "initiative_growth"
  | "interview_readiness";

interface TemplateDef {
  name: string;
  description: string;
  isDefault: boolean;
  competencies: CompetencySlug[];
}

const TEMPLATES: TemplateDef[] = [
  {
    name: "Standard Employability Assessment",
    description:
      "Balanced 20-question assessment covering all five core employability competencies equally. Suitable for most campus and public-facing programmes.",
    isDefault: true,
    competencies: [
      "communication_confidence",
      "problem_solving",
      "teamwork_leadership",
      "initiative_growth",
      "interview_readiness",
    ],
  },
  {
    name: "Tech & Engineering Campus",
    description:
      "Optimised for STEM students. Heavier weighting on problem-solving and initiative, with full coverage of communication and interview readiness.",
    isDefault: false,
    competencies: [
      "problem_solving",
      "initiative_growth",
      "communication_confidence",
      "interview_readiness",
      "teamwork_leadership",
    ],
  },
  {
    name: "Business & MBA Readiness",
    description:
      "Designed for management, MBA, and business students. Emphasises leadership, communication, and stakeholder-facing interview skills.",
    isDefault: false,
    competencies: [
      "teamwork_leadership",
      "communication_confidence",
      "interview_readiness",
      "initiative_growth",
      "problem_solving",
    ],
  },
];

/* ─────────────────────────────────────────────────────────────────────────
   SEED
───────────────────────────────────────────────────────────────────────── */
async function seed() {
  console.log("Seeding questions…");

  // Insert questions, skip duplicates by prompt
  const insertedQuestions: Array<{ id: string; competency: string }> = [];
  for (let i = 0; i < QUESTION_BANK.length; i++) {
    const q = QUESTION_BANK[i];
    const existing = await db
      .select({ id: questions.id, competency: questions.competency })
      .from(questions)
      .where(eq(questions.prompt, q.prompt))
      .limit(1);

    if (existing[0]) {
      console.log(`  skip (exists): ${q.prompt.slice(0, 60)}…`);
      insertedQuestions.push(existing[0]);
    } else {
      const [row] = await db
        .insert(questions)
        .values({
          competency: q.competency,
          prompt: q.prompt,
          options: q.options,
          active: true,
          orderIndex: i,
        })
        .returning({ id: questions.id, competency: questions.competency });
      insertedQuestions.push(row);
      console.log(`  inserted: ${q.prompt.slice(0, 60)}…`);
    }
  }

  console.log("\nSeeding templates…");

  for (const tmpl of TEMPLATES) {
    const existing = await db
      .select({ id: formTemplates.id })
      .from(formTemplates)
      .where(eq(formTemplates.name, tmpl.name))
      .limit(1);

    let templateId: string;
    if (existing[0]) {
      templateId = existing[0].id;
      console.log(`  skip (exists): ${tmpl.name}`);
    } else {
      const [row] = await db
        .insert(formTemplates)
        .values({ name: tmpl.name, description: tmpl.description, isDefault: tmpl.isDefault })
        .returning({ id: formTemplates.id });
      templateId = row.id;
      console.log(`  inserted: ${tmpl.name}`);
    }

    // Link questions in the competency order defined for this template
    let orderIdx = 0;
    for (const competencySlug of tmpl.competencies) {
      const qs = insertedQuestions.filter((q) => q.competency === competencySlug);
      for (const q of qs) {
        // Ignore duplicate (template, question) pairs
        try {
          await db.insert(templateQuestions).values({
            templateId,
            questionId: q.id,
            orderIndex: orderIdx++,
            active: true,
          });
        } catch {
          // unique constraint violation — already linked
        }
      }
    }
    console.log(`  linked ${orderIdx} questions to "${tmpl.name}"`);
  }

  console.log("\nDone.");
  process.exit(0);
}

seed().catch((err) => { console.error(err); process.exit(1); });
