
import "server-only";  
import { neon, Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "./schema";

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL is not set");
}

if (typeof window === "undefined") {
  neonConfig.webSocketConstructor = ws;
}

const pool = new Pool({connectionString: url});

const sql = neon(url);
export const db = drizzle(pool, { schema });
export { schema };
