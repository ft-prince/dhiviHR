"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface DeleteButtonProps {
  label?: string;
  confirmText?: string;
  onDelete: () => Promise<{ ok: boolean; error?: string }>;
  disabled?: boolean;
  size?: "sm" | "default";
}

export function DeleteButton({
  label = "Delete",
  confirmText = "Are you sure? This cannot be undone.",
  onDelete,
  disabled,
  size = "sm",
}: DeleteButtonProps) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setError(null);
    start(async () => {
      const result = await onDelete();
      if (result.ok) {
        setConfirming(false);
        router.refresh();
      } else {
        setError(result.error ?? "Delete failed");
        setConfirming(false);
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      {error && <span className="text-xs text-destructive">{error}</span>}
      {confirming && (
        <Button size={size} variant="ghost" onClick={() => setConfirming(false)} disabled={pending}>
          Cancel
        </Button>
      )}
      <Button
        size={size}
        variant="ghost"
        onClick={handleClick}
        disabled={disabled || pending}
        className={
          confirming
            ? "bg-red-600 text-white hover:bg-red-700"
            : "text-red-600 hover:bg-red-50 hover:text-red-700"
        }
      >
        {pending ? "Deleting…" : confirming ? `Confirm ${label}` : label}
      </Button>
    </div>
  );
}
