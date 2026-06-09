import { inngest, bulkPaidEvent } from "./client";
import { Resend } from "resend";
import nodemailer from "nodemailer";
import { render } from "@react-email/render";
import { StudentWelcomeEmail } from "@/lib/emails/student-welcome";

const resend = new Resend(process.env.RESEND_API_KEY!);

export interface BulkEmailStudent {
  id: string;
  name: string;
  email: string;
  password: string;
  collegeName: string;
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth:{
    user: process.env.EMAIL_HOST_USER,
    pass: process.env.EMAIL_HOST_PASSWORD,
  }
});

export const sendBulkWelcomeEmails = inngest.createFunction(
  {
    id: "send-bulk-welcome-emails",
    retries: 3,
    triggers: [bulkPaidEvent], // ✅ trigger in first arg
  },
  async ({ event, step }) => { // ✅ 2 args, fully typed from bulkPaidEvent
    const { students } = event.data;

    const results = await Promise.allSettled(
      students.map((student) =>  // ✅ student is now typed as BulkEmailStudent
        step.run(`send-email-${student.id}`, async () => {
           const html = await render(StudentWelcomeEmail({
            name: student.name,
            email: student.email,
            password: student.password,
            collegeName: student.collegeName,
          }));

          await transporter.sendMail({
            from: `"DHIVI HR" <${process.env.GMAIL_USER}>`,
            to: student.email,
            subject: "Your DHIVI HR account is ready",
            html,
          });
          // await resend.emails.send({
          //   from: "<anything>@eaferaweo.resend.app",
          //   to: student.email,
          //   subject: "Your DHIVI HR account is ready",
          //   react: StudentWelcomeEmail({
          //     name: student.name,
          //     email: student.email,
          //     password: student.password,
          //     collegeName: student.collegeName,
          //   }),
          
          return { id: student.id, sent: true };
        })
      )
    );

    const sent = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;
    return { sent, failed, total: students.length };
  }
);