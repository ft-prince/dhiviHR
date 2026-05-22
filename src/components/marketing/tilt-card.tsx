"use client";

import { useRef, type ReactNode } from "react";

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  maxTilt?: number;
  glare?: boolean;
}

export function TiltCard({
  children,
  className = "",
  maxTilt = 8,
  glare = true,
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = ref.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -maxTilt;
    const rotateY = ((x - centerX) / centerX) * maxTilt;
    card.style.transform = `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.015)`;

    if (glare && glareRef.current) {
      const px = (x / rect.width) * 100;
      const py = (y / rect.height) * 100;
      glareRef.current.style.background = `radial-gradient(circle at ${px}% ${py}%, rgba(34,197,94,0.12), transparent 50%)`;
      glareRef.current.style.opacity = "1";
    }
  };

  const handleMouseLeave = () => {
    if (ref.current) {
      ref.current.style.transform =
        "perspective(1200px) rotateX(0deg) rotateY(0deg) scale(1)";
    }
    if (glareRef.current) {
      glareRef.current.style.opacity = "0";
    }
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative ${className}`}
      style={{
        transition: "transform 0.25s cubic-bezier(0.16,1,0.3,1)",
        transformStyle: "preserve-3d",
        willChange: "transform",
      }}
    >
      {children}
      {glare && (
        <div
          ref={glareRef}
          aria-hidden
          className="absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-300"
          style={{ opacity: 0 }}
        />
      )}
    </div>
  );
}
