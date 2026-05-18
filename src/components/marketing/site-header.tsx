"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/brand/logo";

const LINKS = [
  { href: "#how", label: "How it works" },
  { href: "#levels", label: "Readiness Levels" },
  { href: "#tracks", label: "Workshop Tracks" },
  { href: "#colleges", label: "For Colleges" },
];

function dashboardHref(role?: string) {
  if (role === "super_admin") return "/super";
  if (role === "client_admin") return "/admin";
  return "/dashboard";
}

interface SiteHeaderProps {
  user?: { name?: string | null; role?: string } | null;
}

export function SiteHeader({ user }: SiteHeaderProps) {
  const [open, setOpen] = useState(false);
  const isLoggedIn = !!user;
  const href = dashboardHref(user?.role);

  return (
    <header className="border-b border-border bg-white/85 backdrop-blur sticky top-0 z-40">
      <div className="container-narrow flex h-16 items-center justify-between gap-3">
        <Link href="/" className="flex items-center" onClick={() => setOpen(false)}>
          <Wordmark />
        </Link>
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-ink-muted">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-brand-600 transition-colors">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="hidden md:flex items-center gap-2">
          {isLoggedIn ? (
            <Link href={href}>
              <Button size="sm">Dashboard</Button>
            </Link>
          ) : (
            <>
              <Link href="/login"><Button variant="ghost" size="sm">Login</Button></Link>
              <Link href="/signup"><Button size="sm">Start Now</Button></Link>
            </>
          )}
        </div>
        <button
          onClick={() => setOpen((v) => !v)}
          className="md:hidden h-10 w-10 grid place-items-center rounded-md hover:bg-brand-50"
          aria-label="Toggle navigation"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && (
        <div className="md:hidden border-t border-border bg-white">
          <div className="container-narrow py-4 flex flex-col gap-3">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="text-sm font-medium text-ink-muted py-2" onClick={() => setOpen(false)}>
                {l.label}
              </Link>
            ))}
            <div className="flex gap-2 pt-2">
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
                    <Button className="w-full">Start Now</Button>
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
