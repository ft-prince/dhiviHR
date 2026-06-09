"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import BulkPaymentForm from "./bulk-payment-form";

export function BulkPaymentPanel({students} : {students: {id: string; name: string; email: string, paymentStatus: string}[]}) {
    const [open, setOpen] = useState(false);

    if(!open){
        return(
            <Button onClick={() => setOpen(true)}>
                Pay for all
            </Button>
        )
    }
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
            <div className="w-full max-w-2xl rounded-2xl border border-border bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="font-display font-bold text-xl text-ink mb-4">Bulk Pay</h2>
            <BulkPaymentForm students={students} onDone={() => setOpen(false)} />
            </div>
        </div>
    );
}