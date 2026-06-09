"use client";
import {useState, useTransition} from "react";
import { Label, Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {bulkCreateStudents} from "@/lib/college-admin/actions";

export default function StudentAddForm({streams, onDone}: {streams: {id: string; name: string}[], onDone?: () => void}) {
    const [streamId, setStreamId] = useState("");
    const [submitError, setSubmitError] = useState<string | null>();
    const [pending, start] = useTransition();

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitError(null);

    if(!streamId) {
        setSubmitError("Please select a stream");
        return;
    }

    const formData = new FormData(e.currentTarget);

    start(async () => {
        const res = await bulkCreateStudents({
            streamId,
            students: [{
                name: formData.get("name") as string,
                email: formData.get("email") as string,
                phone: formData.get("phone") as string,
            }]
        });
        if (res.ok) {
          setStreamId("");
           (e.target as HTMLFormElement).reset();
            onDone?.();
        } else {
            setSubmitError(res.error ?? "Something went wrong");
        }
    });
}
    
    return(
        <form onSubmit={handleSubmit} className="space-y-3">
    <div className="bg-background rounded-2xl border border-border p-6 space-y-2 flex flex-col">
    
    <Label htmlFor="stream">Stream</Label>
    <select
      value={streamId}
      onChange={e => setStreamId(e.target.value)}
      required
      className="rounded-md border border-input bg-background px-3 py-2 text-sm justify-start"
    >
      <option value="">Select a stream</option>
      {streams.map(s => (
        <option key={s.id} value={s.id}>{s.name}</option>
      ))}
    </select>

    <div className="grid grid-cols-1">
      <div className="space-y-1.5">
        <Label htmlFor="name">Student Name</Label>
        <Input id="name" name="name" required minLength={2} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="phone">WhatsApp Number</Label>
        <Input id="phone" name="phone" type="tel"
          inputMode="numeric"
          onInput={e => { e.currentTarget.value = e.currentTarget.value.replace(/\D/g, "").slice(0, 10); }}
          required
        />
      </div>
    </div>

    {submitError && <p className="text-sm text-destructive">{submitError}</p>}

    <div className="w-full pt-1">
      <Button className="w-full" type="submit" disabled={pending}>{pending ? "Adding…" : "Add Student"}</Button>
    </div>

  </div>
</form>
    )


}