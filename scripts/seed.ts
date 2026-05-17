import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import bcrypt from "bcryptjs";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";
import * as schema from "../src/lib/db/schema";
import { customAlphabet } from "nanoid";

const sqlClient = neon(process.env.DATABASE_URL!);
const db = drizzle(sqlClient, { schema });
const { users, questions, colleges, accessCodeBatches, accessCodes } = schema;

const code = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 8);

type Option = { id: string; label: string; weight: number };
type SeedQ = { competency: string; prompt: string; options: Option[]; orderIndex: number };

const QUESTIONS: SeedQ[] = [
  // Communication & Confidence
  { competency: "communication_confidence", orderIndex: 1, prompt: "In a group discussion, you usually:", options: [
    { id: "a", label: "Wait silently and rarely contribute", weight: 0 },
    { id: "b", label: "Speak briefly when directly asked", weight: 2 },
    { id: "c", label: "Share opinions clearly and invite others", weight: 4 },
    { id: "d", label: "Talk a lot but go off-track", weight: 1 },
  ]},
  { competency: "communication_confidence", orderIndex: 2, prompt: "When presenting to strangers, you feel:", options: [
    { id: "a", label: "Frozen, voice shaky", weight: 0 },
    { id: "b", label: "Nervous but get through it", weight: 2 },
    { id: "c", label: "Composed and structured", weight: 4 },
    { id: "d", label: "Confident but unprepared", weight: 1 },
  ]},
  { competency: "communication_confidence", orderIndex: 3, prompt: "Pick your typical written communication:", options: [
    { id: "a", label: "Short with typos", weight: 1 },
    { id: "b", label: "Clear and proofread", weight: 4 },
    { id: "c", label: "Long and detailed", weight: 2 },
    { id: "d", label: "I avoid writing", weight: 0 },
  ]},
  { competency: "communication_confidence", orderIndex: 4, prompt: "Asked to introduce yourself at a networking event:", options: [
    { id: "a", label: "I'd skip it", weight: 0 },
    { id: "b", label: "Stick to my name and college", weight: 2 },
    { id: "c", label: "Name + interest + a hook", weight: 4 },
    { id: "d", label: "Memorized but stiff", weight: 1 },
  ]},
  { competency: "communication_confidence", orderIndex: 5, prompt: "How comfortable are you with English in interviews?", options: [
    { id: "a", label: "Very uncomfortable", weight: 0 },
    { id: "b", label: "Manage with effort", weight: 1 },
    { id: "c", label: "Comfortable", weight: 3 },
    { id: "d", label: "Very comfortable, conversational", weight: 4 },
  ]},

  // Problem Solving
  { competency: "problem_solving", orderIndex: 1, prompt: "Faced with a problem you don't know:", options: [
    { id: "a", label: "Wait for instructions", weight: 0 },
    { id: "b", label: "Try one approach", weight: 2 },
    { id: "c", label: "Break it down then attempt", weight: 4 },
    { id: "d", label: "Guess quickly", weight: 1 },
  ]},
  { competency: "problem_solving", orderIndex: 2, prompt: "A team disagrees on direction. You:", options: [
    { id: "a", label: "Stay silent", weight: 0 },
    { id: "b", label: "Pick a side", weight: 1 },
    { id: "c", label: "Map options & tradeoffs", weight: 4 },
    { id: "d", label: "Suggest a compromise quickly", weight: 2 },
  ]},
  { competency: "problem_solving", orderIndex: 3, prompt: "Your first move on a new project:", options: [
    { id: "a", label: "Start coding/building", weight: 1 },
    { id: "b", label: "Wait for the lead", weight: 0 },
    { id: "c", label: "Clarify goals & success criteria", weight: 4 },
    { id: "d", label: "Plan a 50-page doc", weight: 2 },
  ]},
  { competency: "problem_solving", orderIndex: 4, prompt: "Hit a roadblock you can't solve in 30 min:", options: [
    { id: "a", label: "Keep trying same way", weight: 0 },
    { id: "b", label: "Move to other tasks", weight: 1 },
    { id: "c", label: "Ask for help with what you tried", weight: 4 },
    { id: "d", label: "Search randomly online", weight: 2 },
  ]},
  { competency: "problem_solving", orderIndex: 5, prompt: "You prefer problems that are:", options: [
    { id: "a", label: "Fully scoped", weight: 1 },
    { id: "b", label: "Open-ended and ambiguous", weight: 4 },
    { id: "c", label: "Repetitive and routine", weight: 0 },
    { id: "d", label: "Mixed", weight: 3 },
  ]},

  // Teamwork & Leadership
  { competency: "teamwork_leadership", orderIndex: 1, prompt: "In a group project you usually become:", options: [
    { id: "a", label: "The quiet contributor", weight: 2 },
    { id: "b", label: "The coordinator", weight: 4 },
    { id: "c", label: "The free rider", weight: 0 },
    { id: "d", label: "The critic", weight: 1 },
  ]},
  { competency: "teamwork_leadership", orderIndex: 2, prompt: "A teammate underperforms. You:", options: [
    { id: "a", label: "Complain to others", weight: 0 },
    { id: "b", label: "Cover their work silently", weight: 1 },
    { id: "c", label: "Talk to them respectfully", weight: 4 },
    { id: "d", label: "Escalate immediately", weight: 2 },
  ]},
  { competency: "teamwork_leadership", orderIndex: 3, prompt: "When given a leadership role you:", options: [
    { id: "a", label: "Avoid decisions", weight: 0 },
    { id: "b", label: "Direct everyone", weight: 1 },
    { id: "c", label: "Align team on goals & owners", weight: 4 },
    { id: "d", label: "Do all the work yourself", weight: 2 },
  ]},
  { competency: "teamwork_leadership", orderIndex: 4, prompt: "Conflicting opinions in your team:", options: [
    { id: "a", label: "Cause stress", weight: 0 },
    { id: "b", label: "Are normal — surface them", weight: 4 },
    { id: "c", label: "Should be smoothed over", weight: 2 },
    { id: "d", label: "Mean a bad team", weight: 1 },
  ]},
  { competency: "teamwork_leadership", orderIndex: 5, prompt: "You give credit:", options: [
    { id: "a", label: "Rarely", weight: 0 },
    { id: "b", label: "When asked", weight: 1 },
    { id: "c", label: "Specifically and publicly", weight: 4 },
    { id: "d", label: "Vaguely to keep peace", weight: 2 },
  ]},

  // Initiative & Growth Mindset
  { competency: "initiative_growth", orderIndex: 1, prompt: "Learning a new tool/topic:", options: [
    { id: "a", label: "Wait until forced", weight: 0 },
    { id: "b", label: "Watch one video", weight: 2 },
    { id: "c", label: "Build something with it", weight: 4 },
    { id: "d", label: "Quit when stuck", weight: 1 },
  ]},
  { competency: "initiative_growth", orderIndex: 2, prompt: "On feedback you tend to:", options: [
    { id: "a", label: "Take it personally", weight: 0 },
    { id: "b", label: "Listen politely & forget", weight: 1 },
    { id: "c", label: "Note & apply selectively", weight: 4 },
    { id: "d", label: "Argue back", weight: 0 },
  ]},
  { competency: "initiative_growth", orderIndex: 3, prompt: "How often do you start projects outside coursework?", options: [
    { id: "a", label: "Never", weight: 0 },
    { id: "b", label: "Rarely", weight: 1 },
    { id: "c", label: "A few times a year", weight: 3 },
    { id: "d", label: "Monthly", weight: 4 },
  ]},
  { competency: "initiative_growth", orderIndex: 4, prompt: "Failing at something means:", options: [
    { id: "a", label: "I'm not good at it", weight: 0 },
    { id: "b", label: "It's the system's fault", weight: 0 },
    { id: "c", label: "Data — I'll iterate", weight: 4 },
    { id: "d", label: "Move on, try something else", weight: 2 },
  ]},
  { competency: "initiative_growth", orderIndex: 5, prompt: "Tracking your own growth:", options: [
    { id: "a", label: "I don't", weight: 0 },
    { id: "b", label: "In my head", weight: 1 },
    { id: "c", label: "Notes/journal", weight: 3 },
    { id: "d", label: "Goals + measurable reviews", weight: 4 },
  ]},

  // Interview Readiness
  { competency: "interview_readiness", orderIndex: 1, prompt: "How well can you tell your story in 60 seconds?", options: [
    { id: "a", label: "Not at all", weight: 0 },
    { id: "b", label: "Roughly", weight: 2 },
    { id: "c", label: "Yes — practiced", weight: 4 },
    { id: "d", label: "I improvise", weight: 1 },
  ]},
  { competency: "interview_readiness", orderIndex: 2, prompt: "Behavioral questions (STAR):", options: [
    { id: "a", label: "What's STAR?", weight: 0 },
    { id: "b", label: "Heard of it", weight: 1 },
    { id: "c", label: "Use it for major examples", weight: 4 },
    { id: "d", label: "I wing it", weight: 1 },
  ]},
  { competency: "interview_readiness", orderIndex: 3, prompt: "When asked 'why this company?':", options: [
    { id: "a", label: "I blank", weight: 0 },
    { id: "b", label: "Generic answer", weight: 1 },
    { id: "c", label: "Specific to their product & mission", weight: 4 },
    { id: "d", label: "Money/location", weight: 0 },
  ]},
  { competency: "interview_readiness", orderIndex: 4, prompt: "Salary negotiation:", options: [
    { id: "a", label: "Take whatever offered", weight: 0 },
    { id: "b", label: "Ask once and stop", weight: 2 },
    { id: "c", label: "Anchor with market data", weight: 4 },
    { id: "d", label: "Demand high number", weight: 1 },
  ]},
  { competency: "interview_readiness", orderIndex: 5, prompt: "LinkedIn / resume status:", options: [
    { id: "a", label: "Don't have one", weight: 0 },
    { id: "b", label: "Bare profile", weight: 1 },
    { id: "c", label: "Updated, keyword-optimized", weight: 4 },
    { id: "d", label: "Outdated", weight: 1 },
  ]},
];

async function main() {
  console.log("Seeding…");

  const adminEmail = "admin@dhivihr.com";
  const superEmail = "super@dhivihr.com";
  const hash = await bcrypt.hash("ChangeMe123!", 10);

  await db.execute(sql`TRUNCATE access_codes, access_code_batches, colleges, questions, responses, scores, assessments, payments, audit_logs RESTART IDENTITY CASCADE`);
  await db.execute(sql`DELETE FROM users WHERE email IN (${adminEmail}, ${superEmail})`);

  await db.insert(users).values([
    { name: "DhiviHR Admin", email: adminEmail, passwordHash: hash, role: "client_admin" },
    { name: "Platform Owner", email: superEmail, passwordHash: hash, role: "super_admin" },
  ]).onConflictDoNothing();

  // Seed questions
  const inserted = await db.insert(questions).values(
    QUESTIONS.map((q) => ({
      competency: q.competency as never,
      prompt: q.prompt,
      options: q.options,
      orderIndex: q.orderIndex,
      active: true,
    })),
  ).returning({ id: questions.id });
  console.log(`  ✓ ${inserted.length} questions`);

  // Seed a demo college + access code batch
  const [college] = await db.insert(colleges).values({
    name: "Demo Institute of Technology",
    slug: "demo-tech",
    contactEmail: "tpo@demo-tech.edu",
  }).returning();

  const [batch] = await db.insert(accessCodeBatches).values({
    collegeId: college.id,
    label: "Pilot Cohort 2026",
    size: 5,
  }).returning();

  const codes = Array.from({ length: 5 }, () => `DH-${code()}`);
  await db.insert(accessCodes).values(
    codes.map((c) => ({ batchId: batch.id, collegeId: college.id, code: c })),
  );

  console.log(`  ✓ college ${college.name}`);
  console.log(`  ✓ codes: ${codes.join(", ")}`);
  console.log(`  ✓ admin login: ${adminEmail} / ChangeMe123!`);
  console.log(`  ✓ super login: ${superEmail} / ChangeMe123!`);
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
