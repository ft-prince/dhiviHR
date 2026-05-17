import Link from "next/link";
import { Wordmark } from "@/components/brand/logo";
import { LoginForm } from "@/components/auth/login-form";
import { Suspense } from "react";

export default function LoginPage() {
  return (
    <main className="min-h-screen grid place-items-center bg-brand-50 p-6">
      <div className="w-full max-w-md rounded-2xl border border-brand-100 bg-white p-8 shadow-card">
        <Wordmark className="mb-6" />
        <h1 className="display-headline text-3xl">Welcome Back</h1>
        <p className="mt-1 mb-6 text-sm text-ink-muted">Log in to continue your readiness journey.</p>
        <Suspense>
          <LoginForm />
        </Suspense>
        <div className="mt-6 text-sm text-ink-muted text-center space-y-1">
          <div>
            New here? <Link href="/signup" className="text-brand-600 font-medium hover:underline">Create account</Link>
          </div>
          <div>
            Have a college code? <Link href="/signup/student" className="text-brand-600 font-medium hover:underline">Student signup</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
