import { PageSkeleton } from "../ui/PageSkeleton";

export function UsersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-sm tracking-widest uppercase text-[#666]">
          Usuários
        </h1>
        <button className="text-[10px] tracking-widest uppercase border border-[#1f1f1f] px-3 py-1.5 rounded hover:border-[#333] transition-colors">
          + Novo
        </button>
      </div>
      <div className="border border-[#1f1f1f] rounded overflow-hidden">
        <PageSkeleton
          columns={[
            "Usuário",
            "Senha",
            "Conexões",
            "Validade",
            "Status",
            "Ações",
          ]}
        />
      </div>
    </div>
  );
}
