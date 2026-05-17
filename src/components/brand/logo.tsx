import { cn } from "@/lib/utils";

/**
 * DHIVI HR brand mark — green circle with abstract figure (person reaching up over curve).
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={cn("h-9 w-9", className)} aria-hidden>
      <circle cx="50" cy="50" r="50" fill="currentColor" />
      <g fill="#fff">
        <circle cx="36" cy="36" r="6" />
        <path
          d="M22 60 Q 50 30, 78 60"
          fill="none"
          stroke="#fff"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <circle cx="70" cy="58" r="6" />
      </g>
    </svg>
  );
}

export function LogoBadge({ size = 96, withWordmark = true }: { size?: number; withWordmark?: boolean }) {
  return (
    <div
      className="rounded-full bg-brand-500 grid place-items-center text-white shadow-glow"
      style={{ width: size, height: size }}
    >
      <div className="flex flex-col items-center gap-1">
        <svg viewBox="0 0 100 50" width={size * 0.5} height={size * 0.28} aria-hidden>
          <circle cx="28" cy="14" r="8" fill="#fff" />
          <circle cx="72" cy="34" r="8" fill="#fff" />
          <path d="M12 42 Q 50 -6, 88 42" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" />
        </svg>
        {withWordmark && (
          <span className="font-display font-bold text-[0.65em] tracking-[0.15em]" style={{ fontSize: size * 0.13 }}>
            DHIVI HR
          </span>
        )}
      </div>
    </div>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <LogoMark className="h-9 w-9 text-brand-500" />
      <span className="font-display font-extrabold text-xl tracking-wide text-ink">
        DHIVI <span className="text-brand-600">HR</span>
      </span>
    </div>
  );
}
