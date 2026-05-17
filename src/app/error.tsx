"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[global error]", error);
  }, [error]);

  return (
    <main className="min-h-screen grid place-items-center bg-brand-50/40 p-6 text-center">
      <div>
        <div className="display-headline text-6xl text-brand-600">Oops</div>
        <h1 className="mt-2 display-headline text-2xl">Something went wrong</h1>
        <p className="mt-2 text-sm text-ink-muted max-w-md mx-auto">
          Our team has been notified. You can retry or head back home.
        </p>
        {error.digest && (
          <code className="mt-4 inline-block text-[10px] text-ink-soft">Ref: {error.digest}</code>
        )}
        <div className="mt-6 flex justify-center gap-3">
          <Button onClick={reset}>Try again</Button>
          <Link href="/"><Button variant="outline">Home</Button></Link>
        </div>
      </div>
    </main>
  );
}
