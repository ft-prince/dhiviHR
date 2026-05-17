import { LogoBadge } from "@/components/brand/logo";

const PHOTOS = [
  "https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=640&q=80",
  "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=640&q=80",
  "https://images.unsplash.com/photo-1531545514256-b1400bc00f31?auto=format&fit=crop&w=640&q=80",
  "https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&w=640&q=80",
];

/**
 * 4-circle cloverleaf hero visual — three photo circles + one brand badge,
 * matching the catalogue cover layout.
 */
export function Cloverleaf({ logoPosition = "tr" }: { logoPosition?: "tl" | "tr" | "bl" | "br" }) {
  const positions: Array<"tl" | "tr" | "bl" | "br"> = ["tl", "tr", "bl", "br"];
  return (
    <div className="relative mx-auto grid grid-cols-2 gap-3 w-full max-w-md aspect-square">
      {positions.map((p, i) => {
        const isLogo = p === logoPosition;
        return (
          <div
            key={p}
            className="relative animate-blob-float"
            style={{ animationDelay: `${i * 0.4}s` }}
          >
            <div className="aspect-square rounded-full overflow-hidden ring-[10px] ring-brand-500/90 shadow-card grid place-items-center bg-brand-500">
              {isLogo ? (
                <LogoBadge size={150} />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={PHOTOS[i]}
                  alt=""
                  className="h-full w-full object-cover"
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
