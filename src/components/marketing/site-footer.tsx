import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import { Wordmark } from "@/components/brand/logo";

const FOOTER_LINKS = [
  { href: "#how", label: "How It Works" },
  { href: "#competencies", label: "What We Measure" },
  { href: "#bands", label: "Readiness Levels" },
  { href: "#colleges", label: "For Colleges" },
  { href: "/login", label: "Login" },
  { href: "/signup", label: "Get Started" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="container-narrow py-16">
        <div className="flex flex-col md:flex-row justify-between gap-12">
          <div className="max-w-xs">
            <Wordmark />
            <p className="mt-4 text-sm text-ink-muted leading-relaxed">
              Precision employability assessment built for students and institutions that take placement seriously.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <a
                href="mailto:dhivihr@gmail.com"
                className="flex items-center gap-2.5 text-sm text-ink-muted hover:text-ink transition-colors"
              >
                <span className="h-7 w-7 rounded-full bg-brand-50 border border-brand-100 grid place-items-center">
                  <Mail className="h-3.5 w-3.5 text-brand-600" />
                </span>
                dhivihr@gmail.com
              </a>
              <a
                href="tel:+919780973238"
                className="flex items-center gap-2.5 text-sm text-ink-muted hover:text-ink transition-colors"
              >
                <span className="h-7 w-7 rounded-full bg-brand-50 border border-brand-100 grid place-items-center">
                  <Phone className="h-3.5 w-3.5 text-brand-600" />
                </span>
                +91-9780973238
              </a>
            </div>
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-ink-soft mb-4">Navigation</div>
            <ul className="space-y-3">
              {FOOTER_LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-ink-muted hover:text-ink transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="container-narrow flex flex-col md:flex-row items-center justify-between py-5 gap-3">
          <p className="text-xs text-ink-soft">
            © {new Date().getFullYear()} DHIVI HR. All rights reserved.
          </p>
          <p className="text-xs text-ink-soft">
            Built for institutions that take placement seriously.
          </p>
        </div>
      </div>
    </footer>
  );
}
