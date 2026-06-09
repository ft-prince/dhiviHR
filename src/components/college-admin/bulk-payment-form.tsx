import { Button } from "../ui/button";
//import {studentsBulkPayAction} from "@/lib/college-admin/actions";

export default function BulkPaymentForm({students, onDone} : {students: {id: string; name: string; email: string, paymentStatus: string}[], onDone: () => void}) {
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        onDone();
        const formData = new FormData(e.currentTarget);
        try{
            //await studentsBulkPayAction(formData);
        } catch (error) {
            console.error("Error occurred while processing bulk payment:", error);  
        }
    };

    return(
        <form onSubmit={handleSubmit} className="space-y-4">
            {students.map(s => (
                <div key={s.id}>
                    <input type="checkbox" id={s.id} name={s.name} value={s.id} disabled={s.paymentStatus === "Paid"} />
                    <label htmlFor={s.id} className="ml-2">{s.name} ({s.email}) - {s.paymentStatus}</label>
                </div>
            ))}

        <Button type="submit" className="mt-4">Pay</Button>
        </form>
    )

}