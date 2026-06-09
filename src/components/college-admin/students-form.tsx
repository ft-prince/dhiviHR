"use client";

import { useRef, useState, useTransition } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { Button } from "../ui/button";
import { bulkCreateStudents } from "@/lib/college-admin/actions";

type StudentRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  errors: Partial<Record<"name" | "email" | "phone", string>>;
};

function emptyRow(): StudentRow {
  return { id: crypto.randomUUID(), name: "", email: "", phone: "", errors: {} };
}

function validateRow(row: StudentRow): StudentRow["errors"] {
  const errors: StudentRow["errors"] = {};
  if (!row.name.trim()) errors.name = "Required";
  if (!row.email.trim()) errors.email = "Required";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) errors.email = "Invalid email";
  if (!row.phone.trim()) errors.phone = "Required";
  else if (!/^\d{10}$/.test(row.phone)) errors.phone = "Must be 10 digits";
  return errors;
}

export default function StudentsForm({
  streams,
  onDone,
}: {
  streams: { id: string; name: string }[];
  onDone: () => void;
}) {
  const [streamId, setStreamId] = useState("");
  const [rows, setRows] = useState<StudentRow[]>([emptyRow()]);
  const [csvOpen, setCsvOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<{ inserted: number; skipped: number } | null>(null);
  const [pending, start] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  function updateRow(id: string, field: keyof Omit<StudentRow, "id" | "errors">, value: string) {
  setRows(prev => {
    const updated = prev.map(r => {
      if (r.id !== id) return r;
      const errors = { ...r.errors };
      delete errors[field]; // clear this field's error as user types
      return { ...r, [field]: value, errors };
    });
    const last = updated[updated.length - 1];
    if (field === "name" && id === last.id && value.length === 1) {
      return [...updated, emptyRow()];
    }
    return updated;
  });
}

  function blurRow(id: string, field: keyof Omit<StudentRow, "id" | "errors">) {
  setRows(prev => prev.map(r => {
    if (r.id !== id) return r;
    const fieldError = validateRow(r)[field];
    const errors = { ...r.errors };
    if (fieldError) errors[field] = fieldError;
    else delete errors[field];
    return { ...r, errors };
  }));
}

  function removeRow(id: string) {
    setRows(prev => prev.length === 1 ? prev : prev.filter(r => r.id !== id));
  }

  function parseAndAppend(file: File) {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext === "csv") {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
          const newRows: StudentRow[] = (result.data as any[]).map(r => ({
            id: crypto.randomUUID(),
            name: r["Name"] ?? r["name"] ?? "",
            email: r["Email"] ?? r["email"] ?? "",
            phone: r["WhatsApp Number"] ?? r["Phone"] ?? r["phone"] ?? "",
            errors: {},
          }));
          setRows(prev => {
            // remove trailing empty row before appending
            const cleaned = prev.filter(r => r.name || r.email || r.phone);
            return [...cleaned, ...newRows, emptyRow()];
          });
          setCsvOpen(false);
        },
      });
    }else if (ext === "xlsx" || ext === "xls") {
        const reader = new FileReader();
        reader.onload = (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet) as any[];
        appendParsedRows(rows);
        setCsvOpen(false);
        };
        reader.readAsArrayBuffer(file);
    }
    
  }

  function appendParsedRows(data: any[]) {
  const newRows: StudentRow[] = data.map(r => ({
    id: crypto.randomUUID(),
    name: r["Name"] ?? r["name"] ?? "",
    email: r["Email"] ?? r["email"] ?? "",
    phone: String(r["WhatsApp Number"] ?? r["Phone"] ?? r["phone"] ?? ""),
    errors: {},
  }));
  setRows(prev => {
    const cleaned = prev.filter(r => r.name || r.email || r.phone);
    return [...cleaned, ...newRows, emptyRow()];
  });
}


  function handleFileDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) parseAndAppend(file);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) parseAndAppend(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    if (!streamId) {
      setSubmitError("Please select a stream");
      return;
    }

    // validate all rows, skip trailing empty row
    const filled = rows.filter(r => r.name || r.email || r.phone);
    if (filled.length === 0) {
      setSubmitError("Add at least one student");
      return;
    }

    const validated = filled.map(r => ({ ...r, errors: validateRow(r) }));
    const hasErrors = validated.some(r => Object.keys(r.errors).length > 0);

    if (hasErrors) {
      setRows(prev => {
        const validatedMap = Object.fromEntries(validated.map(r => [r.id, r]));
        return prev.map(r => validatedMap[r.id] ?? r);
      });
      setSubmitError("Fix errors before continuing");
      return;
    }

    start(async () => {
      const res = await bulkCreateStudents({
        streamId,
        students: validated.map(({ name, email, phone }) => ({ name, email, phone })),
      });
      if (res.ok) {
        setResult({ inserted: res.data.inserted, skipped: res.data.skipped });
        setRows([emptyRow()]);
        setStreamId("");
      } else {
        setSubmitError(res.error ?? "Something went wrong");
      }
    });
  }

  const filledRows = rows.filter(r => r.name || r.email || r.phone);
  const hasErrors = filledRows.some(r => Object.keys(r.errors).length > 0);

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* top bar */}
        <div className="flex items-center justify-between">
          <select
            value={streamId}
            onChange={e => setStreamId(e.target.value)}
            required
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="" disabled>Select a stream</option>
            {streams.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <Button type="button" variant="outline" onClick={() => setCsvOpen(true)}
            className="">
            Upload CSV / Excel
          </Button>
        </div>

        {filledRows.length > 0 && (
        <span className="text-sm text-muted-foreground px-3 py-3">
            {filledRows.length} student{filledRows.length !== 1 ? "s" : ""} added
        </span>
        )}

        {/* table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b">
                <th className="pb-2 font-medium w-8"></th>
                <th className="pb-2 font-medium pr-3">Name</th>
                <th className="pb-2 font-medium pr-3">Email</th>
                <th className="pb-2 font-medium pr-3">WhatsApp Number</th>
                <th className="pb-2 w-8"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const hasRowError = Object.keys(row.errors).length > 0;
                return (
                  <tr
                    key={row.id}
                    className={hasRowError ? "border-l-2 border-destructive" : ""}
                  >
                    <td className="pr-2 text-muted-foreground text-xs pt-2">
                      {i + 1}
                    </td>
                    <td className="pr-3 pt-2">
                      <div>
                        <input
                          value={row.name}
                          onChange={e => updateRow(row.id, "name", e.target.value)}
                          onBlur={() => blurRow(row.id, "name")}
                          placeholder="Full name"
                          className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring"
                        />
                        {row.errors.name && (
                          <p className="text-xs text-destructive mt-0.5">{row.errors.name}</p>
                        )}
                      </div>
                    </td>
                    <td className="pr-3 pt-2">
                      <div>
                        <input
                          value={row.email}
                          onChange={e => updateRow(row.id, "email", e.target.value)}
                          onBlur={() => blurRow(row.id, "email")}
                          type="email"
                          placeholder="Email address"
                          className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring"
                        />
                        {row.errors.email && (
                          <p className="text-xs text-destructive mt-0.5">{row.errors.email}</p>
                        )}
                      </div>
                    </td>
                    <td className="pr-3 pt-2">
                      <div>
                        <input
                          value={row.phone}
                          onChange={e => updateRow(row.id, "phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                          onBlur={() => blurRow(row.id, "phone")}
                          placeholder="10 digit number"
                          inputMode="numeric"
                          className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring"
                        />
                        {row.errors.phone && (
                          <p className="text-xs text-destructive mt-0.5">{row.errors.phone}</p>
                        )}
                      </div>
                    </td>
                    <td className="pt-2">
                      <button
                        type="button"
                        onClick={() => removeRow(row.id)}
                        className="text-muted-foreground hover:text-destructive text-xs px-1"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* errors and result */}
        {submitError && <p className="text-sm text-destructive">{submitError}</p>}
        {result && (
          <p className="text-sm text-green-600">
            Done — {result.inserted} created, {result.skipped} skipped (already existed)
          </p>
        )}
        

        {/* actions */}
        <div className="flex gap-3">
          <Button type="submit" disabled={pending || hasErrors}>
            {pending
              ? "Creating…"
              : `Bulk Create${filledRows.length > 0 ? ` ${filledRows.length} Student${filledRows.length !== 1 ? "s" : ""}` : ""}`}
          </Button>
          <Button type="button" variant="outline" onClick={onDone}>
            Cancel
          </Button>
        </div>
      </form>

      {/* CSV upload modal */}
      {csvOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-background rounded-lg border border-input p-6 w-full max-w-md space-y-4 shadow-lg">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Upload CSV or Excel</h3>
              <button onClick={() => setCsvOpen(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>

            <p className="text-sm text-muted-foreground">
              Your file must have these exact column headers:
            </p>
            <div className="rounded-md bg-muted px-4 py-2 text-sm font-mono">
              Name, Email, WhatsApp Number
            </div>
            <p className="text-xs text-muted-foreground">
              All three columns are required for every row. Rows with missing data will be marked for review.
            </p>

            {/* drag and drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleFileDrop}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                dragging ? "border-primary bg-primary/5" : "border-input hover:border-primary/50"
              }`}
            >
              <p className="text-sm text-muted-foreground">
                Drag and drop your file here, or click to browse
              </p>
              <p className="text-xs text-muted-foreground mt-1">.csv and.xlsx supported</p>
            </div>

            <input
              ref={fileRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={handleFileInput}
            />
          </div>
        </div>
      )}
    </>
  );
}