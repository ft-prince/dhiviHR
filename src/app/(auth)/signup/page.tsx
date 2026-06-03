import Link from "next/link";
import { Wordmark } from "@/components/brand/logo";
import { db } from "@/lib/db";
import { streams } from "@/lib/db/schema";
import { SignupForm } from "@/components/auth/signup-form";

export default async function SignupPage() {
  const allStreams = await db.select({id: streams.id, name: streams.name}).from(streams);
  return (
    <main className="min-h-screen grid place-items-center bg-brand-50 p-6">
      <div className="w-full max-w-md rounded-2xl border border-brand-100 bg-white p-8 shadow-card">
        <Wordmark className="mb-6" />
        <h1 className="display-headline text-3xl">Create Your Account</h1>
        <p className="mt-1 mb-6 text-sm text-ink-muted">Take the assessment, unlock your report.</p>
        <SignupForm variant="public" streams={allStreams} />
        <div className="mt-6 text-sm text-ink-muted text-center space-y-1">
          <div>Already have an account? <Link href="/login" className="text-brand-600 font-medium hover:underline">Log in</Link></div>
          <div>Have a college code? <Link href="/signup/student" className="text-brand-600 font-medium hover:underline">Student signup</Link></div>
        </div>
      </div>
    </main>
  );
}
