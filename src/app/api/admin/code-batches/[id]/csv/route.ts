import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { accessCodes, accessCodeBatches, colleges } from "@/lib/db/schema";

export const runtime = "nodejs";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id || !["client_admin", "super_admin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await ctx.params;
  const batch = await db
    .select({ batch: accessCodeBatches, college: colleges })
    .from(accessCodeBatches)
    .leftJoin(colleges, eq(colleges.id, accessCodeBatches.collegeId))
    .where(eq(accessCodeBatches.id, id))
    .limit(1);
  if (!batch[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const codes = await db
    .select({ code: accessCodes.code, redeemedAt: accessCodes.redeemedAt })
    .from(accessCodes)
    .where(eq(accessCodes.batchId, id));

  const header = "code,status,redeemed_at\n";
  const rows = codes
    .map((c) => `${c.code},${c.redeemedAt ? "redeemed" : "unused"},${c.redeemedAt?.toISOString() ?? ""}`)
    .join("\n");
  const csv = header + rows + "\n";

  const college = batch[0].college?.slug ?? "college";
  const label = (batch[0].batch.label ?? "batch").replace(/[^a-z0-9-]+/gi, "-");
  const fname = `${college}-${label}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${fname}"`,
      "cache-control": "private, no-store",
    },
  });
}
