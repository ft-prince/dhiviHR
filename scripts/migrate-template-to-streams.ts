/**
 * Data backfill: move templateId from colleges to streams.
 *
 * For each college that has a template_id, find streams used by that college's
 * students and set streams.college_id + streams.template_id accordingly.
 *
 * Run: npx tsx scripts/migrate-template-to-streams.ts
 */

import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");

const sql = neon(url);

async function main() {
  console.log("Starting template-to-streams migration...\n");

  const colleges = await sql`
    SELECT id, name, template_id FROM colleges WHERE template_id IS NOT NULL
  `;

  console.log(`Found ${colleges.length} college(s) with templates.\n`);

  for (const college of colleges) {
    const streamsUsed = await sql`
      SELECT DISTINCT stream_id FROM users
      WHERE college_id = ${college.id} AND stream_id IS NOT NULL
    `;

    if (streamsUsed.length === 0) {
      console.log(`  ${college.name}: no students with streams — skipping`);
      continue;
    }

    for (const row of streamsUsed) {
      const [stream] = await sql`
        SELECT id, name, college_id FROM streams WHERE id = ${row.stream_id}
      `;
      if (!stream) continue;

      if (stream.college_id && stream.college_id !== college.id) {
        console.log(`  WARNING: Stream "${stream.name}" already assigned to another college. Needs manual review.`);
        continue;
      }

      await sql`
        UPDATE streams SET college_id = ${college.id}, template_id = ${college.template_id}
        WHERE id = ${row.stream_id}
      `;

      console.log(`  ${college.name} → stream "${stream.name}" updated (template_id: ${college.template_id})`);
    }
  }

  console.log("\nDone.");
}

main().catch(console.error);
