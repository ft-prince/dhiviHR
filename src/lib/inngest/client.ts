import { Inngest, eventType, staticSchema } from "inngest";
import type { BulkEmailStudent } from "./functions";

export const bulkPaidEvent = eventType("students/bulk-paid", {
  schema: staticSchema<{ students: BulkEmailStudent[] }>(), 
});

export const inngest = new Inngest({
  id: "dhivi-hr",
  isDev: process.env.NODE_ENV === "development",
  checkpointing: { maxRuntime: "50s" },
});