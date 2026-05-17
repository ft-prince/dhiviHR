import { db } from "@/lib/db";
import { auditLogs } from "@/lib/db/schema";

export async function audit(params: {
  actorId?: string | null;
  action: string;
  target?: string;
  meta?: Record<string, unknown>;
}) {
  try {
    await db.insert(auditLogs).values({
      actorId: params.actorId ?? null,
      action: params.action,
      target: params.target,
      meta: params.meta ?? null,
    });
  } catch (err) {
    // Audit logging never breaks the caller — surface to server logs only.
    console.error("[audit] failed", err);
  }
}
