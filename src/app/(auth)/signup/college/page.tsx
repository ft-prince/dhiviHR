import Link from "next/link";
import { Wordmark } from "@/components/brand/logo";
import { CollegeSignupForm } from "@/components/auth/college-signup-form";

export default async function CollegeSignupPage() {
  return (
    <main className="min-h-screen grid place-items-center bg-brand-50 p-6">
      <div className="w-full max-w-md rounded-2xl border border-brand-100 bg-white p-8 shadow-card">
        <Wordmark className="mb-6" />
        <h1 className="display-headline text-3xl">Register College</h1>
        {/* <p className="mt-1 mb-6 text-sm text-ink-muted">Enter the unique code issued by your college.</p> */}
        <CollegeSignupForm />
        <div className="mt-6 text-sm text-ink-muted text-center space-y-1">
          <div>Public signup? <Link href="/signup" className="text-brand-600 font-medium hover:underline">Create account</Link></div>
          <div>Already registered? <Link href="/login" className="text-brand-600 font-medium hover:underline">Log in</Link></div>
        </div>
      </div>
    </main>
  );
}
