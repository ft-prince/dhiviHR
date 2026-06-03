import "server-only";
import { neon, Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "./schema";

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL is not set");
}

// Lazy initialization function
let dbInstance: ReturnType<typeof drizzle<typeof schema>>;

export const getDb = () => {
  if (!dbInstance) {
    if (typeof window === "undefined") {
      const ws = require("ws");
      neonConfig.webSocketConstructor = ws;
    }
    
    const pool = new Pool({ connectionString: url });
    dbInstance = drizzle(pool, { schema });
  }
  return dbInstance;
};

// Export the instance as a getter or just use getDb() in your server actions
export const db = getDb();