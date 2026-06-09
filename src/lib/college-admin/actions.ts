"use server";

import {z} from "zod";
import bycrypt from "bcryptjs";
import {eq, and, sql, inArray} from "drizzle-orm";
import {revalidatePath} from "next/cache";
import {db} from "@/lib/db";
import {
    users,
    assessments,
    payments,
    bulkOrderStudents,
    accessGrants
} from "@/lib/db/schema";
import {audit} from "@/lib/audit";
import {auth} from "@/lib/auth";;
import {inngest, bulkPaidEvent} from "@/lib/inngest/client";
import {REPORT_PRICE_PAISE} from "@/lib/constants";
import {createRazorpayOrder, verifyCheckoutSignature} from "@/lib/razorpay/index";


const studentRowSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address"),
    phone: z.string().min(10, "Phone number must be at least 10 digits").max(10),
})

const bulkCreateStudentsSchema = z.object({
    streamId : z.string().uuid("Invalid stream"),
    students: z.array(studentRowSchema).min(1, "At least one student is required").max(100, "Cannot create more than 100 students at once"),
});

export async function requireCollegeAdmin(){
    const session = await auth();
    if(!session?.user?.id) throw new Error("Unauthorized");
    if(!["college_admin", "super-admin"].includes(session.user.role)) throw new Error("Unauthorized");
    return session.user.id;
}

export async function bulkCreateStudents(data: z.infer<typeof bulkCreateStudentsSchema>) {
    const me = await requireCollegeAdmin();
    const parsed = bulkCreateStudentsSchema.safeParse(data);
    if(!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message };

    const [admin] = await db
    .select({collgeId: users.collegeId, collegeName: users.collegeName})
    .from(users)
    .where(eq(users.id, me));

    if(!admin) return { ok: false as const, error: "Admin not found" };


    const rows = await Promise.all(parsed.data.students.map(async (s) => {
        const first4 = s.name.trim().toLowerCase().replace(/\s+/g,"").slice(0,4);
        const last4 = s.phone.slice(-4);
        const rawPassword = `${first4}${last4}`;
        const passwordHash = await bycrypt.hash(rawPassword, 10);
        return {
            name: s.name,
            email: s.email,
            phone: s.phone,
            streamId: parsed.data.streamId,
            passwordHash,
            role: "college_student" as const,
            collegeId: admin.collgeId,
            collegeName: admin.collegeName,
            registrationSource: "college_admin" as const,
            createdBy: me,
        }
    }))
    
    const inserted = db
    .insert(users)
    .values(rows)
    .onConflictDoNothing({target: users.email})
    .returning({id: users.id, email: users.email, name: users.name});
    
    // sendBulkWelcomeEmails(
    //     inserted.map(u => ({...u, password}))
    // )

    await audit({actorId: me, action: "bulk-create-students", target: me, meta: { count: (await inserted).length, streamId: parsed.data.streamId }});

    revalidatePath("/college-admin/students");
    return { ok: true as const, data: {inserted: (await inserted).length, skipped: rows.length - (await inserted).length} };
}




export async function createBulkOrdersAction(studentIds: string[]){
    const me = await requireCollegeAdmin();
    if (!studentIds.length) return { ok: false as const, error: "No students selected" };

    // create razorpay order
    const amount = studentIds.length * Number(REPORT_PRICE_PAISE);
    const order = await createRazorpayOrder(amount,
        `bulk_${Date.now()}`);

    const [payment] = await db.insert(payments).values({
        userId: me,
        amount,
        razorpayOrderId: order.id,
        status: "created",
        isBulk: true,
        paidBy: me,
        paymentMode: "college_admin"
    }).returning({id: payments.id, orderId: payments.razorpayOrderId});

    const created = await db
    .insert(bulkOrderStudents)
    .values(studentIds.map(id => ({
        orderId: payment.id,
        studentId: id,
    }))).returning({id: bulkOrderStudents.id});

    return { ok: true as const, orderId: order.id, amount, paymentId: payment.id, keyId: process.env.RAZORPAY_KEY_ID, testMode: order.test };
    }

export async function verifyBulkPaymentAction({
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
        paymentId,
    }: {
        razorpayOrderId: string;
        razorpayPaymentId: string;
        razorpaySignature: string;
        paymentId: string;
    }){
        const me = await requireCollegeAdmin();
        const valid = verifyCheckoutSignature({orderId: razorpayOrderId, paymentId: razorpayPaymentId, signature: razorpaySignature});
        if (!valid) return { ok: false as const, error: "Signature verification failed" };

        await db.update(payments).set({
            status: "paid",
            razorpayPaymentId,
            razorpaySignature,
        }).where(eq(payments.id, paymentId));

        const grantStudents = await db
            .select({ studentId: bulkOrderStudents.studentId })
            .from(bulkOrderStudents)
            .where(eq(bulkOrderStudents.orderId, paymentId));

        const createdGrants = await db.insert(accessGrants).values(
            grantStudents.map((s) => ({
                userId: s.studentId,
                grantedBy: me,
                paymentId: paymentId,
            })));

        const studentDetails = await db
        .select({
            id: users.id,
            email: users.email,
            name: users.name,
            collegeName: users.collegeName,
            phone: users.phone,
        }).from(users)
        .where(inArray(users.id, grantStudents.map(s => s.studentId)));

        await inngest.send(bulkPaidEvent.create({
                students: studentDetails.map((s) => ({
                    id: s.id,
                    name: s.name ?? "Student",
                    email: s.email,
                    collegeName: s.collegeName ?? "your college",
                    password: `${s.name?.trim().toLowerCase().replace(/\s+/g, "").slice(0, 4)}${s.phone?.slice(-4)}`,
                }))
            }
        )
    );
        

        await audit({actorId: me, action: "bulk-payment-verified", target: me, meta: { grantedCount: grantStudents.length, paymentId }});

        return { ok: true as const, count: grantStudents.length };
    }
