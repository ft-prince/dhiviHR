"use client";

import {useState, useTransition} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {Input, Label} from "@/components/ui/input";
import {createStreamAction} from "@/lib/admin/actions";

export function StreamCreateForm(){
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [ok, setOk] = useState(false);
    const [pending, start] = useTransition();

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);
        setOk(false);
        const fd = new FormData(e.currentTarget);
        start(async () => {
            const res = await createStreamAction({
                name: String(fd.get("name") ?? ""),
            });
            if (res.error) {
                setError(res.error);
            } else {
                setOk(true);
                (e.target as HTMLFormElement).reset();
                router.refresh();
            }
        });
    }

    return(
        <form onSubmit={onSubmit} className="mt-4 space-y-3">
            <div>
                <Label htmlFor="name">Stream Name</Label>
                <Input id="name" name="name" placeholder="Enter stream name" />
            </div>
            {error && <div className="text-sm text-destructive">{error}</div>}
            {ok && <div className="text-sm text-brand-700">✓ Stream created.</div>}
            <Button type="submit" className="w-full" disabled={pending}>
                {pending ? "Creating…" : "Create Stream"}
            </Button>
        </form>
    )
}