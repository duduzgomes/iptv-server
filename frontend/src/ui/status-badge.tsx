import { tv } from "tailwind-variants";
import { twMerge } from "tailwind-merge";

export const statusBadgeVariants = tv({
  base: "text-[10px] tracking-widest uppercase",
  variants: {
    status: {
      ACTIVE: "text-success",
      INACTIVE: "text-text-subtle",
      PENDING: "text-text-subtle",
      UPLOADING: "text-blue-400",
      PROCESSING: "text-warning",
      READY: "text-success",
      ERROR: "text-error",
    },
  },
});

const defaultColorMap: Record<string, string> = {
  ACTIVE: "text-success",
  INACTIVE: "text-text-subtle",
  PENDING: "text-text-subtle",
  UPLOADING: "text-blue-400",
  PROCESSING: "text-warning",
  READY: "text-success",
  ERROR: "text-error",
};

interface StatusBadgeProps {
  status: string;
  label?: string;
  colorMap?: Record<string, string>;
}

export function StatusBadge({ status, label, colorMap }: StatusBadgeProps) {
  const map = colorMap ?? defaultColorMap;
  const color = map[status] ?? "text-text-subtle";
  return (
    <span
      data-slot="status-badge"
      data-status={status}
      className={twMerge("text-xs tracking-widest uppercase", color)}
    >
      {label ?? status}
    </span>
  );
}
