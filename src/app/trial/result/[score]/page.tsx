import { SiteHeader } from "@/components/marketing/site-header";
import { TrialReport } from "@/components/trial/trial-report";

export default async function TrialResultPage({ params }: { params: Promise<{ score: string }> }) {
  const { score } = await params;
  const total = Number(score);
  const safeTotal = Number.isFinite(total) ? total : 0;

  return (
    <>
      <SiteHeader solid />
      <main className="min-h-screen pt-20 sm:pt-24 pb-16">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          <TrialReport total={safeTotal} />
        </div>
      </main>
    </>
  );
}
