"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/brand/logo";

const LINKS = [
  { href: "/#features", label: "How It Works" },
  { href: "/#about",    label: "About" },
  { href: "/#colleges", label: "For Colleges" },
  { href: "mailto:dhivihr@gmail.com", label: "Contact" },
];

function dashboardHref(role?: string) {
  if (role === "super_admin") return "/super";
  if (role === "client_admin") return "/admin";
  return "/dashboard";
}

interface SiteHeaderProps {
  user?: { name?: string | null; role?: string } | null;
  /** Force the solid (dark-text) style for pages with a light background. */
  solid?: boolean;
}

export function SiteHeader({ user, solid = false }: SiteHeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const isLoggedIn = !!user;
  const href = dashboardHref(user?.role);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const showSolid = solid || scrolled;
  const navLinkColor = showSolid ? "#475569" : "rgba(255,255,255,0.6)";
  const navLinkHoverColor = showSolid ? "#0F172A" : "rgba(255,255,255,1)";

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={
        showSolid
          ? {
              borderBottom: "1px solid rgba(229,231,235,0.7)",
              background: "rgba(255,255,255,0.93)",
              backdropFilter: "blur(16px)",
              boxShadow: scrolled ? "0 1px 16px -4px rgba(15,23,42,0.08)" : "none",
            }
          : { borderBottom: "1px solid transparent", background: "transparent" }
      }
    >
      <div className="container-narrow flex h-16 items-center justify-between gap-3">
        {/* Wordmark: green mark + adaptive text */}
        <Link href="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <LogoMark className={`h-9 w-9 ${showSolid ? "text-brand-500" : "text-brand-400"}`} />
          <span
            className="font-display font-extrabold text-xl tracking-wide transition-colors duration-300"
            style={{ color: showSolid ? "#0F172A" : "rgba(255,255,255,0.92)" }}
          >
            DHIVI{" "}
            <span style={{ color: showSolid ? "#16A34A" : "#4ade80" }}>HR</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="transition-colors duration-150"
              style={{ color: navLinkColor }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = navLinkHoverColor)}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = navLinkColor)}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="hidden md:flex items-center gap-2">
          {isLoggedIn ? (
            <Link href={href}><Button size="sm">Dashboard</Button></Link>
          ) : (
            <>
              <Link href="/login">
                <Button
                  variant="ghost"
                  size="sm"
                  className={
                    showSolid ? "" : "text-white/70 hover:text-white hover:bg-white/10 border-0"
                  }
                >
                  Login
                </Button>
              </Link>
              <Link href="/signup"><Button size="sm">Get Started</Button></Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="md:hidden h-10 w-10 grid place-items-center rounded-md transition-colors"
          style={{ color: showSolid ? "#0F172A" : "rgba(255,255,255,0.8)" }}
          aria-label="Toggle navigation"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div
          className="md:hidden"
          style={{
            borderTop: "1px solid rgba(229,231,235,0.7)",
            background: "rgba(255,255,255,0.97)",
            backdropFilter: "blur(20px)",
          }}
        >
          <div className="container-narrow py-4 flex flex-col gap-1">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm font-medium text-ink-muted hover:text-ink py-2.5 transition-colors"
                onClick={() => setOpen(false)}
              >
                {l.label}
              </Link>
            ))}
            <div className="flex gap-2 pt-3 border-t border-border mt-2">
              {isLoggedIn ? (
                <Link href={href} className="flex-1" onClick={() => setOpen(false)}>
                  <Button className="w-full">Dashboard</Button>
                </Link>
              ) : (
                <>
                  <Link href="/login" className="flex-1" onClick={() => setOpen(false)}>
                    <Button variant="outline" className="w-full">Login</Button>
                  </Link>
                  <Link href="/signup" className="flex-1" onClick={() => setOpen(false)}>
                    <Button className="w-full">Get Started</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
