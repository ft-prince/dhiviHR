"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import  StudentsForm from "@/components/college-admin/students-form";

export function StudentsCreatePanel({ streams }: { streams: { id: string; name: string }[] }) {
  const [open, setOpen] = useState(false);

  if(!open) {
    return (
      <Button onClick={() => setOpen(true)}>
        Bulk Add Students
      </Button>
    );
  }

  return(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
        <div className="w-full max-w-2xl rounded-2xl border border-border bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="font-display font-bold text-xl text-ink mb-4">Add Students</h2>
            <StudentsForm streams={streams} onDone={() => setOpen(false)} />
        </div>
    </div>
  )
}