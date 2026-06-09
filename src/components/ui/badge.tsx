export default function PaymentStatusBadge({ status }: { status: string }) {
  const statusMap: Record<string, { label: string; color: string }> = {
    Paid: { label: "PAID", color: "text-green-600" },
    Unpaid: { label: "UNPAID", color: "text-red-600" },
    Pending: { label: "PENDING", color: "text-amber-600" },
  };

  return(
    <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium ${statusMap[status]?.color || "bg-gray-100 text-gray-800"}`}>
      {statusMap[status]?.label || status}
    </span>
  );
}