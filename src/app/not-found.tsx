import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/brand/logo";

export default function NotFound() {
  return (
    <main className="min-h-screen grid place-items-center bg-brand-50/40 p-6 text-center">
      <div>
        <Wordmark className="justify-center" />
        <div className="mt-8 display-headline text-7xl text-brand-600">404</div>
        <h1 className="mt-2 display-headline text-2xl">Page Not Found</h1>
        <p className="mt-2 text-ink-muted max-w-sm mx-auto">
          That link doesn&apos;t exist or has moved. Let&apos;s get you back on track.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/"><Button>Back home</Button></Link>
          <Link href="/dashboard"><Button variant="outline">My dashboard</Button></Link>
        </div>
      </div>
    </main>
  );
}
