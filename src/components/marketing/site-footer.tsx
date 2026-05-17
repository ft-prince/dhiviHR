import { Mail, Phone } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="mt-24">
      <div className="container-narrow py-12 text-center">
        <h2 className="display-headline text-3xl md:text-5xl">
          Let&apos;s Build Your<br />Organization&apos;s Next Growth Chapter.
        </h2>
      </div>
      <div className="bg-brand-500 text-white">
        <div className="container-narrow flex flex-col md:flex-row items-center justify-center gap-6 md:gap-16 py-5 text-sm font-medium">
          <a href="mailto:dhivihr@gmail.com" className="flex items-center gap-2 hover:underline">
            <span className="h-7 w-7 rounded-full bg-white/15 grid place-items-center">
              <Mail className="h-3.5 w-3.5" />
            </span>
            dhivihr@gmail.com
          </a>
          <a href="tel:+919780973238" className="flex items-center gap-2 hover:underline">
            <span className="h-7 w-7 rounded-full bg-white/15 grid place-items-center">
              <Phone className="h-3.5 w-3.5" />
            </span>
            +91-9780973238, +91-8847343154
          </a>
        </div>
      </div>
      <div className="bg-brand-700 text-brand-100 text-center text-xs py-3">
        © {new Date().getFullYear()} DHIVI HR. All rights reserved.
      </div>
    </footer>
  );
}
