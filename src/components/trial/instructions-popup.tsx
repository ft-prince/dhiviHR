"use client";

import { useEffect, useRef, useState } from "react";
import { X, Volume2, VolumeX, Info } from "lucide-react";

const AUTO_CLOSE_MS = 9000;

const SPOKEN_INSTRUCTIONS =
  "Welcome to your CRAFTe driving test. Six quick questions, each rated from never to always. " +
  "Answer honestly — there are no wrong answers. It takes about a minute, and your readiness result appears right after.";

interface InstructionsPopupProps {
  onClose: () => void;
}

/**
 * Tasteful glowing-yellow instructions popup. Auto-closes after ~9s
 * (with a visible countdown bar) and offers optional voice narration.
 */
export function InstructionsPopup({ onClose }: InstructionsPopupProps) {
  const [closing, setClosing] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  const dismiss = useRef(onClose);
  dismiss.current = onClose;

  // Auto-close timer
  useEffect(() => {
    const t = setTimeout(() => {
      setClosing(true);
      setTimeout(() => dismiss.current(), 300);
    }, AUTO_CLOSE_MS);
    return () => clearTimeout(t);
  }, []);

  // Stop any narration when unmounting
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  function handleClose() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    setClosing(true);
    setTimeout(() => onClose(), 250);
  }

  function toggleVoice() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const u = new SpeechSynthesisUtterance(SPOKEN_INSTRUCTIONS);
    u.rate = 1;
    u.pitch = 1;
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(u);
    setSpeaking(true);
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center pt-24 sm:pt-28 px-4 pointer-events-none">
      <style>{`
        @keyframes ip-in { from { opacity:0; transform: translateY(-14px) scale(.97) } to { opacity:1; transform:none } }
        @keyframes ip-glow { 0%,100% { box-shadow: 0 0 0 1px rgba(234,179,8,.35), 0 12px 40px -8px rgba(234,179,8,.45) } 50% { box-shadow: 0 0 0 1px rgba(234,179,8,.55), 0 16px 56px -6px rgba(234,179,8,.65) } }
        @keyframes ip-bar { from { width:100% } to { width:0% } }
      `}</style>

      <div
        role="dialog"
        aria-label="Trial instructions"
        className="pointer-events-auto relative w-full max-w-md rounded-2xl overflow-hidden"
        style={{
          background: "linear-gradient(180deg,#FEFCE8 0%,#FEF9C3 100%)",
          border: "1px solid #FDE68A",
          animation: closing
            ? "ip-in 250ms ease reverse forwards"
            : "ip-in 320ms cubic-bezier(0.32,0.72,0,1), ip-glow 2.4s ease-in-out infinite 320ms",
        }}
      >
        <button
          onClick={handleClose}
          aria-label="Dismiss"
          className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-yellow-700/70 hover:bg-yellow-200/60 transition-colors"
        >
          <X size={16} />
        </button>

        <div className="p-6 sm:p-7">
          <div className="flex items-center gap-2.5 mb-3">
            <span className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "#FDE047" }}>
              <Info size={18} className="text-yellow-900" />
            </span>
            <h2 className="text-[16px] font-bold text-yellow-900">Quick heads-up before you start</h2>
          </div>

          <ul className="space-y-2 text-[13.5px] text-yellow-900/90 leading-relaxed mb-5">
            <li>• <strong>6 quick questions</strong> — about a minute total.</li>
            <li>• Rate each from <strong>Never (1)</strong> to <strong>Always (5)</strong>.</li>
            <li>• Be honest — there are no right or wrong answers.</li>
            <li>• Your readiness result appears the moment you submit.</li>
          </ul>

          <div className="flex items-center gap-3">
            <button
              onClick={handleClose}
              className="text-[13px] font-semibold text-yellow-950 rounded-full px-5 py-2 transition-colors"
              style={{ background: "#FACC15" }}
            >
              Got it
            </button>
            <button
              onClick={toggleVoice}
              className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-yellow-800 hover:text-yellow-950 transition-colors"
            >
              {speaking ? <VolumeX size={15} /> : <Volume2 size={15} />}
              {speaking ? "Stop" : "Play instructions"}
            </button>
          </div>
        </div>

        {/* Auto-close countdown bar */}
        <div className="h-1 bg-yellow-200/70">
          <div
            className="h-full"
            style={{
              background: "#EAB308",
              animation: closing ? "none" : `ip-bar ${AUTO_CLOSE_MS}ms linear forwards`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
