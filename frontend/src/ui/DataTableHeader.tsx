import { Button } from "./Button";

interface DataTableHeaderProps {
  title: string;
  count?: number;
  onAdd: () => void;
  addLabel?: string;
}

export function DataTableHeader({
  title,
  count,
  onAdd,
  addLabel = "+ Novo",
}: DataTableHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-sm tracking-widest uppercase text-[#666]">{title}</h1>
      <Button onClick={onAdd}>{addLabel}</Button>
    </div>
  );
}
