"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu, X, LogOut, Home,
  LayoutDashboard, IndianRupee, Activity, ShieldCheck,
  Server, BarChart3, Users, Building2, Ticket, ListChecks, FileText, Layers, BookOpen,
} from "lucide-react";
import { Wordmark } from "@/components/brand/logo";
import { cn } from "@/lib/utils";
import { logoutAction } from "@/lib/auth/actions";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const ADMIN_NAV: NavItem[] = [
  { href: "/college-admin",           label: "Dashboard",  icon: LayoutDashboard },
  { href: "/college-admin/students",  label: "Students",   icon: Users },
];

/* ── Sidebar nav link ─────────────────────────────────────────── */
function NavLink({ item, active, onClick }: { item: NavItem; active: boolean; onClick: () => void }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
        active
          ? "bg-brand-500 text-white shadow-glow"
          : "text-ink-muted hover:bg-brand-50 hover:text-ink",
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{item.label}</span>
      {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white/60 shrink-0" />}
    </Link>
  );
}

/* ── Main shell ───────────────────────────────────────────────── */
export function CollegeAdminShell({
  children,
  user,
  adminDetail,
//   scope,
}: {
  children: React.ReactNode;
  user: { name?: string | null; email?: string | null; role: string };
  adminDetail: { collegeName: string | null; state: string | null; city: string | null; pocDesignation: string | null };
//   scope: "Admin" | "Super Admin";
}) {
  const nav = ADMIN_NAV;
  const path = usePathname();
  const [open, setOpen] = useState(false);

  function isActive(item: NavItem) {
    return path === item.href || (item.href !== nav[0].href && path.startsWith(item.href));
  }

  const activeLabel = nav.find(isActive)?.label ?? "Dashboard";

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Mobile top bar ─────────────────────────────────────── */}
      <header className="md:hidden sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-white px-4 gap-3">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Wordmark />
        </Link>
        {/* Current page label */}
        <span className="flex-1 text-sm font-semibold text-ink truncate text-center">{activeLabel}</span>
        <button
          onClick={() => setOpen((v) => !v)}
          className="h-9 w-9 grid place-items-center rounded-lg bg-brand-50 text-brand-600 hover:bg-brand-100 transition-colors shrink-0"
          aria-label="Toggle navigation"
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </header>

      <div className="md:grid md:grid-cols-[260px_1fr] md:min-h-screen">

        {/* ── Sidebar ──────────────────────────────────────────── */}
        <aside
          className={cn(
            "fixed inset-0 z-20 flex flex-col bg-white border-r border-border",
            "md:sticky md:top-0 md:h-screen md:flex",
            open ? "flex" : "hidden",
          )}
        >
          {/* Logo — desktop only */}
          <div className="hidden md:flex h-16 items-center px-5 border-b border-border gap-2.5 shrink-0">
            <Link href="/" className="flex items-center gap-2">
              <Wordmark />
            </Link>
          </div>

          {/* Mobile sidebar header */}
          <div className="md:hidden flex items-center justify-between px-4 h-14 border-b border-border shrink-0">
            <span className="font-semibold text-sm text-ink">Navigation</span>
            <button
              onClick={() => setOpen(false)}
              className="h-8 w-8 grid place-items-center rounded-md hover:bg-brand-50"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* User info */}
          <div className="px-5 pt-4 pb-3 border-b border-border shrink-0">
          <div className="flex flex-col gap-2">
            {/* Scope badge */}
            <div className="flex flex-row gap-4">
                {/*Badge*/}
                <div>
                    <div className="h-8 w-8 rounded-full bg-brand-500 flex items-center justify-center shrink-0">
                      <span className="text-white text-[11px] font-bold uppercase">
                        {(user.name ?? "A").charAt(0)}
                      </span>
                    </div>
                </div>
                {/*Name and designation*/}
                <div>
                  <div className="text-sm font-semibold text-ink truncate">
                  {user.name ?? "College Admin"}
                  {adminDetail?.pocDesignation && (
                    <span className="text-ink-soft font-normal ml-1">
                      ({adminDetail.pocDesignation})
                    </span>
                  )}
                  </div>
                  <div className="text-[11px] text-ink-soft truncate">{user.email}</div>
                </div>
            </div>
            {/* College data */}
            <div className="px-2 items-center justify-center">
                {adminDetail?.collegeName && (
              <div className="text-[15px] text-ink truncate flex flex-row items-center gap-1">
                <span className="font-semibold">  {adminDetail.collegeName}</span>
                {(adminDetail.city || adminDetail.state) && (
                  <span className="text-[12px] text-ink items-center justify-center">
                    · {adminDetail.city}
                  </span>
                )}
              </div>
            )}
            </div>
          </div>
        </div>

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
            {/* Back to site */}
            <Link
              href="/"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-muted hover:bg-slate-50 hover:text-ink transition-colors mb-2"
            >
              <Home className="h-4 w-4 shrink-0" />
              <span>Back to Site</span>
            </Link>
            <div className="px-3 pb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-ink-soft/60">Menu</span>
            </div>
            {nav.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                active={isActive(item)}
                onClick={() => setOpen(false)}
              />
            ))}
          </nav>

          {/* Logout */}
          <form action={logoutAction} className="border-t border-border p-3 shrink-0">
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-muted hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              Log out
            </button>
          </form>
        </aside>

        {/* ── Main content ─────────────────────────────────────── */}
        <main className="min-w-0 px-4 sm:px-6 md:px-8 lg:px-10 py-5 sm:py-7 md:py-10">
          {children}
        </main>
      </div>

      {/* Mobile backdrop */}
      {open && (
        <button
          aria-label="Close menu"
          onClick={() => setOpen(false)}
          className="md:hidden fixed inset-0 z-10 bg-black/40 backdrop-blur-sm"
        />
      )}
    </div>
  );
}
