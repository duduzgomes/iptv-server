import type { ComponentProps, ReactNode } from "react";
import { twMerge } from "tailwind-merge";
import { PageSkeleton } from "./page-skeleton";

interface DataTableProps {
  columns: string[];
  isLoading?: boolean;
  children: ReactNode;
}

export function TableBody({ className, ...props }: ComponentProps<"tbody">) {
  return (
    <tbody data-slot="table-body" className={twMerge(className)} {...props} />
  );
}

export function TableRow({ className, ...props }: ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={twMerge(
        "border-b border-border-subtle hover:bg-surface transition-colors",
        className,
      )}
      {...props}
    />
  );
}

export function TableCell({ className, ...props }: ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={twMerge("px-4 py-3 align-middle", className)}
      {...props}
    />
  );
}

export function DataTable({ columns, isLoading, children }: DataTableProps) {
  if (isLoading) return <PageSkeleton columns={columns} />;

  return (
    <div className="bg-surface border border-border-subtle rounded-md overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border-subtle text-text-muted">
            {columns.map((col) => (
              <th
                key={col}
                className="px-4 py-3 font-medium text-left align-middle"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        {children}
      </table>
    </div>
  );
}
