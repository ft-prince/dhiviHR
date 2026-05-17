export default function Loading() {
  return (
    <div className="min-h-screen grid place-items-center bg-brand-50/40">
      <div className="flex items-center gap-3 text-ink-muted text-sm">
        <span className="h-3 w-3 rounded-full bg-brand-500 animate-pulse" />
        <span className="h-3 w-3 rounded-full bg-brand-400 animate-pulse [animation-delay:120ms]" />
        <span className="h-3 w-3 rounded-full bg-brand-300 animate-pulse [animation-delay:240ms]" />
      </div>
    </div>
  );
}
