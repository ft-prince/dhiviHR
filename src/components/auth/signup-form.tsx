"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { signupAction, studentSignupAction } from "@/lib/auth/actions";


export function SignupForm({ variant = "public", streams = [], }: { variant?: "public" | "student", streams: { id: string; name: string }[] }) {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);
  if (!isMounted) return null;
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    start(async () => {
      const action = variant === "student" ? studentSignupAction : signupAction;
      const res = await action(fd);
      if (res.ok) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {variant === "student" && (
        <div>
          <Label htmlFor="accessCode">College Access Code</Label>
          <Input
            id="accessCode"
            name="accessCode"
            required
            placeholder="DH-XXXXXX"
            className="uppercase tracking-widest"
          />
        </div>
      )}
      <div>
        <Label htmlFor="name">Full Name</Label>
        <Input id="name" name="name" required minLength={2} />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required />
      </div>
      <div>
        <Label htmlFor="stream">Stream</Label>
        <select
          id="stream"
          name="stream"
          required
          defaultValue=""
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
            <option value="" disabled>Select a stream...</option>
            {streams.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
      </div>
      <div>
        <Label htmlFor="phone">Phone (optional)</Label>
        <Input id="phone" name="phone" type="tel" />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <PasswordInput id="password" name="password" required minLength={8} />
      </div>
      {error && <div className="text-sm text-destructive">{error}</div>}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Creating…" : variant === "student" ? "Redeem & Sign Up" : "Create Account"}
      </Button>
    </form>
  );
}
