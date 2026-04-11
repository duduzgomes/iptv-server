import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

interface PageSkeletonProps {
  columns: string[];
}

export function PageSkeleton({ columns }: PageSkeletonProps) {
  return (
    <div
      data-slot="page-skeleton"
      className="bg-surface border border-border-subtle rounded-xl overflow-hidden"
    >
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border-subtle text-text-muted text-left">
            {columns.map((col) => (
              <th key={col} className="px-4 py-3 font-medium">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 6 }).map((_, i) => (
            <tr key={i} className="border-b border-border-subtle">
              {columns.map((col) => (
                <td key={col} className="px-4 py-3">
                  <Skeleton
                    baseColor="#141414"
                    highlightColor="#1f1f1f"
                    height={12}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
