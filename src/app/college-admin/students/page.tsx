import { PageHeader } from "@/components/admin/page-header";
import { StudentsCreatePanel } from "@/components/college-admin/students-create-panel";
import { BulkPaymentPanel } from "@/components/college-admin/bulk-payment-panel";
import { db } from "@/lib/db";
import { sql, ne, eq, or, ilike, and, isNotNull, isNull, gt } from "drizzle-orm";
import { streams, users, payments, accessGrants } from "@/lib/db/schema";
import { requireCollegeAdmin } from "@/lib/college-admin/actions";
import { DataTableForm } from "@/components/college-admin/data-table-form";
import { DataTableType } from "@/components/college-admin/data-table-form";
import { StudentsFilterBar } from "@/components/college-admin/student-filter-bar";
import { PaymentStatus, PAYMENT_STATUS_LABELS } from "@/components/college-admin/student-filter-bar";

export default async function CollegeAdminStudentsPage({searchParams}: {searchParams: Promise<Record<string, string>>}) {
     const me = await requireCollegeAdmin();
     const sp = await searchParams;
     const q = sp.q?.trim() ?? "";
     const streamFilter = sp.streamId ??"";
     const paymentStatus = (sp.paymentStatus ?? "") as PaymentStatus | "";
     const page = Math.max(1, Number(sp.page ?? 1));

     const allStreams = await db.select({id: streams.id, name: streams.name}).from(streams);

     const grantsSubquery = db.select({
        userId: accessGrants.userId,
        totalGrants: sql<number>`COUNT(*)`.as("total_grants"),
        availableGrants: sql<number>`COUNT(*) FILTER (WHERE ${accessGrants.usedForAssessmentId} IS NULL)`.as("available_grants"),
        })
        .from(accessGrants)
        .groupBy(accessGrants.userId)
        .as("grants_summary");
     
     const filters = [eq(users.createdBy, me)];
     if (q) filters.push(or(ilike(users.name, `%${q}%`), ilike(users.email, `%${q}%`))!);
     if (streamFilter) filters.push(eq(users.streamId, streamFilter));
     if (paymentStatus === "paid") {filters.push(gt(grantsSubquery.availableGrants, 0));}
     else if (paymentStatus === "unpaid") {filters.push(or(isNull(grantsSubquery.availableGrants), eq(grantsSubquery.availableGrants, 0))!);}
      const where = filters.length > 0 ? and(...filters) : undefined;

      const allStudents = await db
      .select({id: users.id, name: users.name, email: users.email, streamName: streams.name, phone: users.phone, totalGrants: sql<number> `COALESCE(${grantsSubquery.totalGrants}, 0)`, availableGrants: sql<number> `COALESCE(${grantsSubquery.availableGrants}, 0)`}).from(users)
      .leftJoin(grantsSubquery, eq(users.id, grantsSubquery.userId))
      .leftJoin(streams, eq(users.streamId, streams.id))
      .where(where);

      return(
    <>
    <PageHeader
    title="Students"
    description="Manage your students here."
    actions={<div className="flex gap-2"> <StudentsCreatePanel streams={allStreams} /> </div>}
    />
  
    <StudentsFilterBar filters={{ q, streamId: streamFilter, paid: paymentStatus }} streams={allStreams} />
    <DataTableForm
              data={allStudents as DataTableType[]}
              emptyText = {q ? "No students match your search." : "No students added yet."}
    />

    </>
    )
}