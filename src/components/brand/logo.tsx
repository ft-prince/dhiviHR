import { cn } from "@/lib/utils";

/**
 * CRAFTe brand mark — green circle with abstract figure (person reaching up over curve).
 */

  export function LogoMark({ className }: { className?: string }) {
  return (
    <div
      className={cn("h-9 w-9 rounded-full overflow-hidden flex-shrink-0", className)}
    >
      <img
        src="/logo.jpg"
        alt="CRAFTe logo mark"
        className="w-full h-full object-cover scale-150"
      />
    </div>
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
        CRAFTe
      </span>
    </div>
  );
}
