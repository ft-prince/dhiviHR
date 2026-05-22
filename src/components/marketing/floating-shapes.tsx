/**
 * Decorative floating SVG shapes — subtle geometric elements that drift
 * gently in the background. Pure CSS animations, no JS.
 */
export function FloatingShapes() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {/* Top-left ring */}
      <svg
        className="absolute -top-8 -left-8 h-32 w-32 animate-float-1 opacity-50"
        viewBox="0 0 100 100"
        fill="none"
      >
        <circle cx="50" cy="50" r="40" stroke="#A6F4C5" strokeWidth="1.5" strokeDasharray="4 6" />
      </svg>

      {/* Top-right concentric arcs */}
      <svg
        className="absolute top-20 right-12 h-40 w-40 animate-float-2 opacity-40"
        viewBox="0 0 100 100"
        fill="none"
      >
        <circle cx="50" cy="50" r="48" stroke="#D1FADF" strokeWidth="1" />
        <circle cx="50" cy="50" r="36" stroke="#A6F4C5" strokeWidth="1" />
        <circle cx="50" cy="50" r="24" stroke="#6CE9A6" strokeWidth="1" />
      </svg>

      {/* Bottom-left plus mark */}
      <svg
        className="absolute bottom-32 left-1/4 h-6 w-6 animate-float-3 opacity-60"
        viewBox="0 0 24 24"
        fill="none"
      >
        <path d="M12 4 V20 M4 12 H20" stroke="#22C55E" strokeWidth="1.5" strokeLinecap="round" />
      </svg>

      {/* Middle-right dot grid */}
      <svg
        className="absolute top-1/2 right-1/4 h-20 w-20 animate-float-1 opacity-50"
        viewBox="0 0 100 100"
        fill="#6CE9A6"
        style={{ animationDelay: "1.5s" }}
      >
        {[10, 30, 50, 70, 90].map((y) =>
          [10, 30, 50, 70, 90].map((x) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="1.5" />
          ))
        )}
      </svg>

      {/* Bottom-right small triangle */}
      <svg
        className="absolute bottom-16 right-20 h-8 w-8 animate-float-2 opacity-70"
        viewBox="0 0 24 24"
        fill="none"
        style={{ animationDelay: "2s" }}
      >
        <path d="M12 3 L21 20 H3 Z" stroke="#22C55E" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
