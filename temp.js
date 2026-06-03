import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

await sql`DELETE FROM score_competencies`;
await sql`DELETE FROM scores`;
await sql`DELETE FROM responses`;
await sql`DELETE FROM payments`;
await sql`DELETE FROM assessments`;
await sql`DELETE FROM audit_logs`;
await sql`DELETE FROM template_questions`;
await sql`DELETE FROM questions`;
await sql`DELETE FROM streams`;
await sql`DELETE FROM users WHERE role = 'student'`;

console.log('done');
process.exit();