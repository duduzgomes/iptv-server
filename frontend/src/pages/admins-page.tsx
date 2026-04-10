import { DataTable } from "../ui/data-table";

export function AdminsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-sm tracking-widest uppercase text-[#666]">
          Administradores
        </h1>
        <button className="text-[10px] tracking-widest uppercase border border-[#1f1f1f] px-3 py-1.5 rounded hover:border-[#333] transition-colors">
          + Novo
        </button>
      </div>
      <DataTable
        columns={["Usuário", "Email", "Role", "Status", "Ações"]}
        isLoading
      >
        <tbody />
      </DataTable>
    </div>
  );
}
