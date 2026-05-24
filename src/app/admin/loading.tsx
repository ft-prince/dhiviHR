export default function AdminLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Page header skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-56 rounded-xl bg-brand-50" />
        <div className="h-4 w-96 rounded-lg bg-brand-50" />
      </div>
      {/* KPI card row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-white p-5 space-y-3">
            <div className="h-3 w-24 rounded bg-brand-50" />
            <div className="h-8 w-20 rounded-lg bg-brand-50" />
            <div className="h-3 w-32 rounded bg-brand-50" />
          </div>
        ))}
      </div>
      {/* Table skeleton */}
      <div className="rounded-2xl border border-border bg-white overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-border last:border-0">
            <div className="h-4 w-40 rounded bg-brand-50 flex-1" />
            <div className="h-4 w-20 rounded bg-brand-50" />
            <div className="h-4 w-16 rounded bg-brand-50" />
          </div>
        ))}
      </div>
    </div>
  );
}
