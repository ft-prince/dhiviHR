import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  header: string;
  className?: string;
  render: (row: T) => React.ReactNode;
}

export function DataTable<T extends { id: string }>({
  rows,
  columns,
  emptyText = "No records yet",
}: {
  rows: T[];
  columns: Column<T>[];
  emptyText?: string;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-white p-12 text-center">
        <div className="text-sm text-ink-soft">{emptyText}</div>
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-border bg-white overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-brand-50/70 text-ink-muted">
            <tr>
              {columns.map((c) => (
                <th key={c.key} className={cn("text-left px-4 py-3 font-semibold whitespace-nowrap", c.className)}>
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-border hover:bg-brand-50/30">
                {columns.map((c) => (
                  <td key={c.key} className={cn("px-4 py-3 align-middle", c.className)}>
                    {c.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
