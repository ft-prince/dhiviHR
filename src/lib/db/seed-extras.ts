/**
 * Run with:  npx tsx src/lib/db/seed-extras.ts
 *
 * Idempotent — safe to re-run.
 * 1. Seeds 6 additional competencies to the DB (for dropdown options).
 * 2. Seeds evaluation rules into each of the 3 standard templates.
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { eq } from "drizzle-orm";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const { competencies, formTemplates } = schema;
const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");
const db = drizzle(neon(url), { schema });

/* ── Extra competencies ─────────────────────────────────────────────── */
const EXTRA_COMPETENCIES = [
  { slug: "critical_thinking",       label: "Critical Thinking",                   description: "Ability to analyse, evaluate and form reasoned judgements.", weight: 20, orderIndex: 5 },
  { slug: "emotional_intelligence",  label: "Emotional Intelligence",               description: "Self-awareness, empathy and managing interpersonal dynamics.", weight: 20, orderIndex: 6 },
  { slug: "digital_literacy",        label: "Digital Literacy & Tech Savviness",    description: "Comfort with digital tools, data and emerging technology.", weight: 20, orderIndex: 7 },
  { slug: "adaptability",            label: "Adaptability & Resilience",             description: "Staying effective and calm through change, setbacks and ambiguity.", weight: 20, orderIndex: 8 },
  { slug: "time_management",         label: "Time Management & Prioritisation",      description: "Planning, sequencing and delivering work on time under pressure.", weight: 20, orderIndex: 9 },
  { slug: "professional_presence",   label: "Professional Presence & Work Ethics",   description: "Reliability, accountability, and conduct expected in the workplace.", weight: 20, orderIndex: 10 },
];

/* ── Evaluation rules per template ─────────────────────────────────── */
const TEMPLATE_RULES: Record<string, object[]> = {
  "Standard Employability Assessment": [
    {
      id: "rule-high-impact",
      name: "High Impact Candidate",
      logic: "ALL",
      priority: 0,
      conditions: [{ type: "total_score", op: "gte", value: 75 }],
      track: "High Impact Track",
      recommendation:
        "Outstanding results across all competency dimensions. You are well-positioned for competitive roles. Focus on showcasing your strengths through portfolio projects and industry networking.",
    },
    {
      id: "rule-industry-ready",
      name: "Industry Ready",
      logic: "ALL",
      priority: 1,
      conditions: [{ type: "total_score", op: "gte", value: 55 }, { type: "total_score", op: "lt", value: 75 }],
      track: "Industry Ready Track",
      recommendation:
        "Strong foundational employability with clear strengths. Minor gaps exist — review your lowest-scoring competency and target one focused improvement area before your next application.",
    },
    {
      id: "rule-developing",
      name: "Developing",
      logic: "ALL",
      priority: 2,
      conditions: [{ type: "total_score", op: "gte", value: 35 }, { type: "total_score", op: "lt", value: 55 }],
      track: "Developing Track",
      recommendation:
        "You are building core professional skills. Focus on the two weakest competency areas identified in your breakdown. Structured practice, mock interviews, and group-work experience will accelerate growth.",
    },
    {
      id: "rule-emerging",
      name: "Emerging",
      logic: "ALL",
      priority: 3,
      conditions: [{ type: "total_score", op: "lt", value: 35 }],
      track: "Emerging Track",
      recommendation:
        "Early stage in your employability journey. Prioritise communication confidence and problem-solving first — these two competencies unlock progress in every other area. Consider joining a debate club, case-study group, or volunteering role.",
    },
  ],

  "Tech & Engineering Campus": [
    {
      id: "tech-strong-all",
      name: "Strong All-Round Tech Candidate",
      logic: "ALL",
      priority: 0,
      conditions: [
        { type: "total_score", op: "gte", value: 70 },
        { type: "competency_score", slug: "problem_solving", op: "gte", value: 70 },
      ],
      track: "High Impact Track",
      recommendation:
        "Excellent problem-solving paired with strong overall performance. You are ready for technical roles requiring analytical thinking and leadership. Build a portfolio of projects and contribute to open-source to validate your skills publicly.",
    },
    {
      id: "tech-strong-ps",
      name: "Strong Problem Solver — Communication Gap",
      logic: "ALL",
      priority: 1,
      conditions: [
        { type: "competency_score", slug: "problem_solving", op: "gte", value: 70 },
        { type: "competency_score", slug: "communication_confidence", op: "lt", value: 50 },
      ],
      track: "Industry Ready Track",
      recommendation:
        "Your technical thinking is a real asset. However, most engineering roles require clear verbal communication with non-technical stakeholders. Work on structured explanation techniques (ELI5, the pyramid principle) and practice presenting technical concepts simply.",
    },
    {
      id: "tech-industry-ready",
      name: "Industry Ready — Technical",
      logic: "ALL",
      priority: 2,
      conditions: [{ type: "total_score", op: "gte", value: 50 }],
      track: "Industry Ready Track",
      recommendation:
        "Good overall readiness for technical roles. Strengthen your weakest area from the breakdown above. Consider a 4-week targeted sprint: one competency, one resource, one real-world application.",
    },
    {
      id: "tech-emerging",
      name: "Early Stage — Technical",
      logic: "ALL",
      priority: 3,
      conditions: [{ type: "total_score", op: "lt", value: 50 }],
      track: "Developing Track",
      recommendation:
        "Focus on problem-solving frameworks first (structured thinking, breaking problems into parts). Then move to communication. Technical skills alone are not enough — employers evaluate how you think, not just what you know.",
    },
  ],

  "Business & MBA Readiness": [
    {
      id: "mba-leader",
      name: "Leadership-Ready",
      logic: "ALL",
      priority: 0,
      conditions: [
        { type: "total_score", op: "gte", value: 72 },
        { type: "competency_score", slug: "teamwork_leadership", op: "gte", value: 70 },
      ],
      track: "High Impact Track",
      recommendation:
        "Strong leadership indicators combined with excellent overall scores. Target senior business roles, consulting, or entrepreneurial paths. Build experience managing cross-functional projects or leading student bodies.",
    },
    {
      id: "mba-communicator",
      name: "Communicator — Leadership Gap",
      logic: "ALL",
      priority: 1,
      conditions: [
        { type: "competency_score", slug: "communication_confidence", op: "gte", value: 70 },
        { type: "competency_score", slug: "teamwork_leadership", op: "lt", value: 50 },
      ],
      track: "Industry Ready Track",
      recommendation:
        "You communicate well but need to develop leadership instincts. Seek opportunities to lead projects, even informally. Practice ownership language: say 'I decided' and 'I drove', not 'we did'.",
    },
    {
      id: "mba-industry-ready",
      name: "Business — Industry Ready",
      logic: "ALL",
      priority: 2,
      conditions: [{ type: "total_score", op: "gte", value: 50 }],
      track: "Industry Ready Track",
      recommendation:
        "Solid business readiness across most dimensions. To stand out in MBA and business recruiting, focus on quantifiable impact: frame every experience with numbers, timelines, and outcomes.",
    },
    {
      id: "mba-developing",
      name: "Business — Developing",
      logic: "ALL",
      priority: 3,
      conditions: [{ type: "total_score", op: "lt", value: 50 }],
      track: "Developing Track",
      recommendation:
        "Communication confidence and teamwork are your two highest-leverage areas to improve for business roles. Join a business club, work on case competitions, and practice presenting findings to small groups. Consistent practice over 90 days will move the needle significantly.",
    },
  ],
};

/* ── Seed function ──────────────────────────────────────────────────── */
async function seed() {
  // 1. Add extra competencies
  console.log("Adding extra competencies…");
  for (const c of EXTRA_COMPETENCIES) {
    const existing = await db
      .select({ id: competencies.id })
      .from(competencies)
      .where(eq(competencies.slug, c.slug))
      .limit(1);

    if (existing[0]) {
      console.log(`  skip (exists): ${c.slug}`);
    } else {
      await db.insert(competencies).values({ ...c, active: true });
      console.log(`  inserted: ${c.slug}`);
    }
  }

  // 2. Seed evaluation rules into templates
  console.log("\nSeeding evaluation rules…");
  for (const [templateName, rules] of Object.entries(TEMPLATE_RULES)) {
    const rows = await db
      .select({ id: formTemplates.id })
      .from(formTemplates)
      .where(eq(formTemplates.name, templateName))
      .limit(1);

    if (!rows[0]) {
      console.log(`  WARN: template not found — "${templateName}"`);
      continue;
    }

    await db
      .update(formTemplates)
      .set({ rules: JSON.parse(JSON.stringify(rules)), updatedAt: new Date() })
      .where(eq(formTemplates.id, rows[0].id));

    console.log(`  rules set (${rules.length}) → "${templateName}"`);
  }

  console.log("\nDone.");
  process.exit(0);
}

seed().catch((err) => { console.error(err); process.exit(1); });
