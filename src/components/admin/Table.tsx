import type { ReactNode } from "react";

type TableProps = {
  columns: string[];
  children: ReactNode;
  empty?: boolean;
  emptyText?: string;
};

export function Table({ columns, children, empty = false, emptyText = "No records found." }: TableProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((column) => (
                <th key={column} className="px-4 py-3 text-left font-semibold text-slate-600">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">{empty ? null : children}</tbody>
        </table>
      </div>
      {empty && <div className="p-6 text-center text-sm text-slate-500">{emptyText}</div>}
    </div>
  );
}
