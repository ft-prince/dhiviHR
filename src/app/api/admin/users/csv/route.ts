import { NextRequest, NextResponse } from "next/server";
import { ilike, or, and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, colleges } from "@/lib/db/schema";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !["client_admin", "super_admin"].includes(session.user.role)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const sp = req.nextUrl.searchParams;
  const q = sp.get("q")?.trim() ?? "";
  const role = sp.get("role") ?? "";
  const collegeFilter = sp.get("college") ?? "";

  const filters = [];
  if (q) filters.push(or(ilike(users.name, `%${q}%`), ilike(users.email, `%${q}%`))!);
  if (role) filters.push(eq(users.role, role as never));
  if (collegeFilter) filters.push(eq(users.collegeId, collegeFilter));
  const where = filters.length ? and(...filters) : undefined;

  const [rows, collegeList] = await Promise.all([
    db
      .select({ id: users.id, name: users.name, email: users.email, role: users.role, phone: users.phone, collegeId: users.collegeId, createdAt: users.createdAt })
      .from(users)
      .where(where)
      .orderBy(users.email)
      .limit(10000),
    db.select({ id: colleges.id, name: colleges.name }).from(colleges),
  ]);

  const collegeMap = new Map(collegeList.map((c) => [c.id, c.name]));

  const header = ["ID", "Name", "Email", "Role", "Phone", "College", "Joined"];
  const lines = [
    header.join(","),
    ...rows.map((r) =>
      [
        r.id,
        `"${(r.name ?? "").replace(/"/g, '""')}"`,
        r.email,
        r.role,
        r.phone ?? "",
        `"${(r.collegeId ? (collegeMap.get(r.collegeId) ?? r.collegeId) : "").replace(/"/g, '""')}"`,
        new Date(r.createdAt).toISOString().slice(0, 10),
      ].join(","),
    ),
  ];

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="users-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
