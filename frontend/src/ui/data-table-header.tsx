import { Button } from "./button";

interface DataTableHeaderProps {
  title: string;
  count?: number;
  onAdd: () => void;
  addLabel?: string;
}

export function DataTableHeader({
  title,
  onAdd,
  addLabel,
}: DataTableHeaderProps) {
  return (
    <div
      data-slot="data-table-header"
      className="flex items-center justify-between"
    >
      <h1 className="text-sm tracking-widest uppercase text-text-muted">
        {title}
      </h1>
      <Button onClick={onAdd} size="lg">
        {addLabel}
      </Button>
    </div>
  );
}
