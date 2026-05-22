import type { ReactNode } from "react";

interface MarqueeProps {
  children: ReactNode;
  speed?: number;
  className?: string;
  reverse?: boolean;
}

export function Marquee({ children, speed = 40, className = "", reverse = false }: MarqueeProps) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div
        className="flex w-max gap-12"
        style={{
          animation: `marquee-${reverse ? "right" : "left"} ${speed}s linear infinite`,
        }}
      >
        <div className="flex shrink-0 gap-12 items-center">{children}</div>
        <div className="flex shrink-0 gap-12 items-center" aria-hidden>{children}</div>
      </div>
      {/* Edge fades */}
      <div
        className="absolute inset-y-0 left-0 w-24 pointer-events-none"
        style={{ background: "linear-gradient(to right, white, transparent)" }}
        aria-hidden
      />
      <div
        className="absolute inset-y-0 right-0 w-24 pointer-events-none"
        style={{ background: "linear-gradient(to left, white, transparent)" }}
        aria-hidden
      />
    </div>
  );
}
