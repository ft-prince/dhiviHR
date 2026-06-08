"use client";

import React, { useEffect, useRef, useState } from "react";
import { X, Check, Loader2, CheckCircle2 } from "lucide-react";
import {
  searchCollegesAction,
  submitEnquiryAction,
  type CollegeOption,
} from "@/lib/enquiry/actions";

const GREEN = "#22C55E";

const INTERESTS: { value: "crafte" | "expert_talks" | "other"; label: string }[] = [
  { value: "crafte", label: "CRAFTe (Corporate Readiness Assessments & Future Talent evaluation)" },
  { value: "expert_talks", label: "Expert-Led Career Readiness Sessions" },
  { value: "other", label: "Other" },
];

interface LetsConnectModalProps {
  open: boolean;
  onClose: () => void;
}

interface FormState {
  name: string;
  designation: string;
  collegeId: string;
  collegeName: string;
  location: string;
  email: string;
  mobile: string;
  interests: ("crafte" | "expert_talks" | "other")[];
  message: string;
}

const EMPTY: FormState = {
  name: "", designation: "", collegeId: "", collegeName: "",
  location: "", email: "", mobile: "", interests: [], message: "",
};

export function LetsConnectModal({ open, onClose }: LetsConnectModalProps) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  // College autocomplete
  const [results, setResults] = useState<CollegeOption[]>([]);
  const [showResults, setShowResults] = useState(false);

  // Reset whenever the modal is opened fresh
  useEffect(() => {
    if (open) {
      setForm(EMPTY);
      setError(null);
      setDone(false);
      setResults([]);
      setShowResults(false);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  // Debounced college search
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  function onCollegeChange(value: string) {
    setForm((f) => ({ ...f, collegeName: value, collegeId: "" }));
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const rows = await searchCollegesAction(value);
        setResults(rows);
        setShowResults(rows.length > 0);
      } catch {
        // Autocomplete is a convenience; typing a college name by hand still works.
        setResults([]);
        setShowResults(false);
      }
    }, 250);
  }

  function pickCollege(c: CollegeOption) {
    setForm((f) => ({
      ...f,
      collegeId: c.id,
      collegeName: c.name,
      location: c.location ?? f.location,
    }));
    setShowResults(false);
  }

  function toggleInterest(value: "crafte" | "expert_talks" | "other") {
    setForm((f) => ({
      ...f,
      interests: f.interests.includes(value)
        ? f.interests.filter((v) => v !== value)
        : [...f.interests, value],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const res = await submitEnquiryAction({
      name: form.name,
      designation: form.designation,
      collegeId: form.collegeId,
      collegeName: form.collegeName,
      location: form.location,
      email: form.email,
      mobile: form.mobile,
      interests: form.interests,
      message: form.message,
    });
    setSubmitting(false);
    if (res.ok) setDone(true);
    else setError(res.error);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={onClose} />

      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Let's Connect"
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl"
        style={{ animation: "lc-pop 260ms cubic-bezier(0.32,0.72,0,1)" }}
      >
        <style>{`@keyframes lc-pop{from{opacity:0;transform:translateY(12px) scale(.98)}to{opacity:1;transform:none}}`}</style>

        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors"
        >
          <X size={18} />
        </button>

        {done ? (
          /* ── Thank-you state ─────────────────────────────────── */
          <div className="px-7 py-14 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: "#F0FDF4" }}>
              <CheckCircle2 size={32} style={{ color: GREEN }} />
            </div>
            <h2 className="text-[22px] font-semibold text-gray-900 mb-3">Thank you for connecting with us!</h2>
            <p className="text-[14px] text-gray-500 leading-relaxed max-w-sm mx-auto mb-8">
              Our team will get back to you shortly to understand your requirements and discuss the next steps.
            </p>
            <button
              onClick={onClose}
              className="inline-flex items-center gap-2 text-[14px] font-medium text-white rounded-full px-6 py-3 transition-opacity hover:opacity-90"
              style={{ background: GREEN }}
            >
              Done
            </button>
          </div>
        ) : (
          /* ── Form state ──────────────────────────────────────── */
          <div className="px-7 pt-9 pb-8">
            <h2 className="text-[24px] font-semibold text-gray-900 tracking-tight mb-1.5">Let&apos;s Connect</h2>
            <p className="text-[14px] text-gray-500 leading-relaxed mb-7">
              Tell us a little about your institution and we&apos;ll help you explore the right solution for your students.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Field label="Your Name" required>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className={inputCls}
                  placeholder="Full name"
                  required
                />
              </Field>

              <Field label="Designation">
                <input
                  type="text"
                  value={form.designation}
                  onChange={(e) => setForm((f) => ({ ...f, designation: e.target.value }))}
                  className={inputCls}
                  placeholder="e.g. Placement Officer"
                />
              </Field>

              {/* College with autocomplete */}
              <Field label="College / Institution Name" required>
                <div className="relative">
                  <input
                    type="text"
                    value={form.collegeName}
                    onChange={(e) => onCollegeChange(e.target.value)}
                    onFocus={() => results.length && setShowResults(true)}
                    onBlur={() => setTimeout(() => setShowResults(false), 150)}
                    className={inputCls}
                    placeholder="Start typing to search…"
                    autoComplete="off"
                    required
                  />
                  {showResults && results.length > 0 && (
                    <ul className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden max-h-52 overflow-y-auto">
                      {results.map((c) => (
                        <li key={c.id}>
                          <button
                            type="button"
                            onMouseDown={(e) => { e.preventDefault(); pickCollege(c); }}
                            className="w-full text-left px-4 py-2.5 text-[13px] text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-between gap-3"
                          >
                            <span className="truncate">{c.name}</span>
                            {c.location && <span className="text-[11px] text-gray-400 shrink-0">{c.location}</span>}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </Field>

              <Field label="Location">
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                  className={inputCls}
                  placeholder="City / State"
                />
              </Field>

              <Field label="Official Email Address" required>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className={inputCls}
                  placeholder="you@institution.edu"
                  required
                />
              </Field>

              <Field label="Mobile Number" required>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={form.mobile}
                  onChange={(e) => setForm((f) => ({ ...f, mobile: e.target.value.replace(/\D/g, "").slice(0, 10) }))}
                  className={inputCls}
                  placeholder="10-digit mobile number"
                  required
                />
              </Field>

              {/* Interested In — multi-select */}
              <div>
                <label className="block text-[12px] font-medium text-gray-700 mb-2">
                  Interested In <span style={{ color: GREEN }}>*</span>
                </label>
                <div className="space-y-2">
                  {INTERESTS.map((opt) => {
                    const checked = form.interests.includes(opt.value);
                    return (
                      <button
                        type="button"
                        key={opt.value}
                        onClick={() => toggleInterest(opt.value)}
                        className="w-full flex items-start gap-3 text-left rounded-xl border px-4 py-3 transition-colors"
                        style={{ borderColor: checked ? GREEN : "#E5E7EB", background: checked ? "#F0FDF4" : "#fff" }}
                      >
                        <span
                          className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 border"
                          style={{ background: checked ? GREEN : "#fff", borderColor: checked ? GREEN : "#D1D5DB" }}
                        >
                          {checked && <Check size={13} className="text-white" />}
                        </span>
                        <span className="text-[13px] text-gray-700 leading-snug">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Other — open text box */}
              {form.interests.includes("other") && (
                <Field label="What would you like to discuss?">
                  <textarea
                    value={form.message}
                    onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                    className={`${inputCls} resize-none`}
                    rows={3}
                    placeholder="Tell us a little more…"
                  />
                </Field>
              )}

              {error && <p className="text-[13px] text-red-600">{error}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 text-[14px] font-medium text-white rounded-full px-6 py-3.5 transition-opacity hover:opacity-90 disabled:opacity-60"
                style={{ background: GREEN }}
              >
                {submitting && <Loader2 size={16} className="animate-spin" />}
                {submitting ? "Sending…" : "Request a Callback"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-[14px] text-gray-900 placeholder:text-gray-400 outline-none transition-colors focus:border-green-400 focus:ring-2 focus:ring-green-100";

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[12px] font-medium text-gray-700 mb-1.5">
        {label} {required && <span style={{ color: GREEN }}>*</span>}
      </label>
      {children}
    </div>
  );
}
