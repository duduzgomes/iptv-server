import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

interface PageSkeletonProps {
  columns: string[];
}

export function PageSkeleton({ columns }: PageSkeletonProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-[#1f1f1f]">
            {columns.map((col) => (
              <th
                key={col}
                className="text-left py-3 px-4 text-[#444] tracking-widest uppercase font-normal"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 6 }).map((_, i) => (
            <tr key={i} className="border-b border-[#141414]">
              {columns.map((col) => (
                <td key={col} className="py-3 px-4">
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
