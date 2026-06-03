import Link from "next/link";
import { Wordmark } from "@/components/brand/logo";
import { db } from "@/lib/db";
import { streams } from "@/lib/db/schema";
import { SignupForm } from "@/components/auth/signup-form";

export default async function StudentSignupPage() {
  const allStreams = await db.select({id: streams.id, name: streams.name}).from(streams);
  return (
    <main className="min-h-screen grid place-items-center bg-brand-50 p-6">
      <div className="w-full max-w-md rounded-2xl border border-brand-100 bg-white p-8 shadow-card">
        <Wordmark className="mb-6" />
        <h1 className="display-headline text-3xl">Student Access</h1>
        <p className="mt-1 mb-6 text-sm text-ink-muted">Enter the unique code issued by your college.</p>
        <SignupForm variant="student" streams={allStreams} />
        <div className="mt-6 text-sm text-ink-muted text-center space-y-1">
          <div>Public signup? <Link href="/signup" className="text-brand-600 font-medium hover:underline">Create account</Link></div>
          <div>Already registered? <Link href="/login" className="text-brand-600 font-medium hover:underline">Log in</Link></div>
        </div>
      </div>
    </main>
  );
}
