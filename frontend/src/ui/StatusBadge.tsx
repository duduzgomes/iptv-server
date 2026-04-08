const defaultColorMap: Record<string, string> = {
  // genérico ativo/inativo
  ACTIVE: "text-emerald-500",
  INACTIVE: "text-[#444]",
  // VOD status
  PENDING: "text-[#444]",
  UPLOADING: "text-blue-400",
  PROCESSING: "text-yellow-500",
  READY: "text-emerald-500",
  ERROR: "text-red-500",
};

interface StatusBadgeProps {
  status: string;
  label?: string;
  colorMap?: Record<string, string>;
}

export function StatusBadge({ status, label, colorMap }: StatusBadgeProps) {
  const map = colorMap ?? defaultColorMap;
  const color = map[status] ?? "text-[#444]";
  return (
    <span className={`text-[10px] tracking-widest uppercase ${color}`}>
      {label ?? status}
    </span>
  );
}
