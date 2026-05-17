"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu, X, LogOut,
  LayoutDashboard, IndianRupee, Activity, ShieldCheck,
  Server, BarChart3, Users, Building2, Ticket, ListChecks,
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
  { href: "/admin",           label: "Dashboard",  icon: LayoutDashboard },
  { href: "/admin/users",     label: "Users",      icon: Users           },
  { href: "/admin/colleges",  label: "Colleges",   icon: Building2       },
  { href: "/admin/codes",     label: "Codes",      icon: Ticket          },
  { href: "/admin/questions", label: "Questions",  icon: ListChecks      },
  { href: "/admin/activity",  label: "Activity",   icon: BarChart3       },
];

const SUPER_NAV: NavItem[] = [
  { href: "/super",          label: "Platform Overview", icon: LayoutDashboard },
  { href: "/super/revenue",  label: "Revenue",           icon: IndianRupee     },
  { href: "/super/growth",   label: "Growth",            icon: BarChart3       },
  { href: "/super/admins",   label: "Admin Team",        icon: ShieldCheck     },
  { href: "/super/activity", label: "Audit Log",         icon: Activity        },
  { href: "/super/system",   label: "System Health",     icon: Server          },
];

export function AdminShell({
  children,
  user,
  scope,
}: {
  children: React.ReactNode;
  user: { name?: string | null; email?: string | null; role: string };
  scope: "Client Admin" | "Super Admin";
}) {
  const nav = scope === "Super Admin" ? SUPER_NAV : ADMIN_NAV;
  const path = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-brand-50/40">
      {/* Top bar (mobile) */}
      <header className="md:hidden sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-white px-4">
        <Link href="/"><Wordmark /></Link>
        <button
          onClick={() => setOpen((v) => !v)}
          className="h-10 w-10 grid place-items-center rounded-md hover:bg-brand-50"
          aria-label="Toggle navigation"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      <div className="md:grid md:grid-cols-[260px_1fr]">
        {/* Sidebar */}
        <aside
          className={cn(
            "fixed md:sticky md:top-0 md:h-screen inset-0 z-20 bg-white border-r border-border flex-col md:flex",
            open ? "flex" : "hidden",
          )}
        >
          {/* Logo */}
          <div className="hidden md:flex h-16 items-center px-6 border-b border-border">
            <Link href="/"><Wordmark /></Link>
          </div>

          {/* User info */}
          <div className="px-6 py-4 md:py-5 border-b border-border">
            <div className="text-[10px] font-bold uppercase tracking-widest text-brand-600">
              {scope}
            </div>
            <div className="mt-1 text-sm font-semibold text-ink truncate">
              {user.name ?? "Admin"}
            </div>
            <div className="text-xs text-ink-soft truncate">{user.email}</div>
          </div>

          {/* Nav links */}
          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
            {nav.map((item) => {
              const Icon = item.icon;
              const active =
                path === item.href ||
                (item.href !== nav[0].href && path.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition",
                    active
                      ? "bg-brand-500 text-white shadow-glow"
                      : "text-ink-muted hover:bg-brand-50 hover:text-ink",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <form action={logoutAction} className="border-t border-border p-3">
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm text-ink-muted hover:bg-destructive/10 hover:text-destructive transition"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </button>
          </form>
        </aside>

        {/* Main content */}
        <main className="min-w-0 px-4 md:px-10 py-6 md:py-10">
          {children}
        </main>
      </div>

      {/* Mobile overlay */}
      {open && (
        <button
          aria-label="Close menu"
          onClick={() => setOpen(false)}
          className="md:hidden fixed inset-0 z-10 bg-ink/40"
        />
      )}
    </div>
  );
}