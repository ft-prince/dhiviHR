import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  const rows = await sql`
    select email, role, password_hash from users
    where email in ('admin@dhivihr.com','super@dhivihr.com')
  `;
  for (const r of rows as Array<{ email: string; role: string; password_hash: string }>) {
    const ok = await bcrypt.compare("ChangeMe123!", r.password_hash);
    console.log(`${r.email} role=${r.role} hash_ok=${ok}`);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
