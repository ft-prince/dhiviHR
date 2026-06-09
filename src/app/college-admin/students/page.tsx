import { PageHeader } from "@/components/admin/page-header";
import { StudentsCreatePanel } from "@/components/college-admin/students-create-panel";
import { BulkPaymentPanel } from "@/components/college-admin/bulk-payment-panel";
import { db } from "@/lib/db";
import { sql, ne, eq, or, ilike, and, isNotNull, isNull } from "drizzle-orm";
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
     
     const filters = [eq(users.createdBy, me)];
     if (q) filters.push(or(ilike(users.name, `%${q}%`), ilike(users.email, `%${q}%`))!);
     if (streamFilter) filters.push(eq(users.streamId, streamFilter));
     if (paymentStatus === "paid") {filters.push(isNotNull(accessGrants.id));}
     else if (paymentStatus === "unpaid") {filters.push(isNull(accessGrants.id));}
     const where = filters.length > 0 ? and(...filters) : undefined;

    const allStudents = await db
      .selectDistinctOn([users.id],{id: users.id, name: users.name, email: users.email, streamName: streams.name, phone: users.phone, paymentStatus: sql<string>`CASE WHEN ${accessGrants.id} IS NOT NULL THEN 'paid' ELSE 'unpaid' END`}).from(users)
      .leftJoin(accessGrants, eq(users.id, accessGrants.userId))
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