import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Pencil, Trash2, Power, Eye, EyeOff, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { usersApi } from "../api/users";
import { z } from "zod";
import { userSchema, renovarSchema, type UserFormData } from "../schemas";
import type { User } from "../types";
import { PageSkeleton } from "../ui/PageSkeleton";

type Modal =
  | { type: "create" }
  | { type: "edit"; user: User }
  | { type: "renovar"; user: User }
  | null;

export function UsersPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(0);
  const [modal, setModal] = useState<Modal>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<Set<number>>(
    new Set(),
  );

  // --- Query ---
  const { data, isLoading } = useQuery({
    queryKey: ["users", page],
    queryFn: () => usersApi.list(page),
  });

  // --- Toggle senha visível ---
  function togglePassword(id: number) {
    setVisiblePasswords((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  // --- Forms ---
  const userForm = useForm<
    z.input<typeof userSchema>,
    unknown,
    z.output<typeof userSchema>
  >({
    resolver: zodResolver(userSchema),
    defaultValues: { maxConnections: "1", validadeDias: "30" },
  });

  const renovarForm = useForm<
    z.input<typeof renovarSchema>,
    unknown,
    z.output<typeof renovarSchema>
  >({
    resolver: zodResolver(renovarSchema),
    defaultValues: { dias: "30" },
  });

  function openCreate() {
    userForm.reset({ maxConnections: "1", validadeDias: "30" });
    setModal({ type: "create" });
  }

  function openEdit(user: User) {
    userForm.reset({
      maxConnections: String(user.maxConnections),
      validadeDias: "30",
    });
    setModal({ type: "edit", user });
  }

  function openRenovar(user: User) {
    renovarForm.reset({ dias: "30" });
    setModal({ type: "renovar", user });
  }

  // --- Mutations ---
  const invalidate = () => qc.invalidateQueries({ queryKey: ["users"] });

  const createMutation = useMutation({
    mutationFn: (data: UserFormData) => usersApi.create(data),
    onSuccess: () => {
      toast.success("Usuário criado");
      setModal(null);
      invalidate();
    },
    onError: () => toast.error("Erro ao criar usuário"),
  });

  const editMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UserFormData }) =>
      usersApi.update(id, data),
    onSuccess: () => {
      toast.success("Usuário atualizado");
      setModal(null);
      invalidate();
    },
    onError: () => toast.error("Erro ao atualizar usuário"),
  });

  const renovarMutation = useMutation({
    mutationFn: ({ id, dias }: { id: number; dias: number }) =>
      usersApi.renovar(id, dias),
    onSuccess: () => {
      toast.success("Validade renovada");
      setModal(null);
      invalidate();
    },
    onError: () => toast.error("Erro ao renovar validade"),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      usersApi.toggleStatus(id, active),
    onSuccess: () => {
      toast.success("Status atualizado");
      invalidate();
    },
    onError: () => toast.error("Erro ao atualizar status"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => usersApi.remove(id),
    onSuccess: () => {
      toast.success("Usuário removido");
      invalidate();
    },
    onError: () => toast.error("Erro ao remover usuário"),
  });

  const columns = [
    "Usuário",
    "Senha",
    "Conexões",
    "Validade",
    "Status",
    "Ações",
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-sm tracking-widest uppercase text-[#666]">
          Usuários
        </h1>
        <button
          onClick={openCreate}
          className="text-[10px] tracking-widest uppercase border border-[#1f1f1f] px-3 py-1.5 rounded hover:border-[#333] transition-colors"
        >
          + Novo
        </button>
      </div>

      {/* Tabela */}
      <div className="border border-[#1f1f1f] rounded overflow-hidden">
        {isLoading ? (
          <PageSkeleton columns={columns} />
        ) : (
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
              {data?.content.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-[#141414] hover:bg-[#0f0f0f] transition-colors"
                >
                  <td className="py-3 px-4 text-[#ccc] font-mono">
                    {user.username}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[#555]">
                        {visiblePasswords.has(user.id)
                          ? user.password
                          : "••••••••"}
                      </span>
                      <button
                        onClick={() => togglePassword(user.id)}
                        className="text-[#333] hover:text-[#888] transition-colors"
                      >
                        {visiblePasswords.has(user.id) ? (
                          <EyeOff size={12} />
                        ) : (
                          <Eye size={12} />
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-[#555]">
                    {user.maxConnections}
                  </td>
                  <td className="py-3 px-4 text-[#555]">
                    {format(new Date(user.expiresAt), "dd/MM/yyyy", {
                      locale: ptBR,
                    })}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`text-[10px] tracking-widest uppercase ${user.active ? "text-emerald-500" : "text-[#444]"}`}
                    >
                      {user.active ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-3">
                      <button
                        onClick={() => openEdit(user)}
                        className="text-[#444] hover:text-[#ccc] transition-colors"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => openRenovar(user)}
                        className="text-[#444] hover:text-blue-400 transition-colors"
                      >
                        <RefreshCw size={13} />
                      </button>
                      <button
                        onClick={() =>
                          toggleMutation.mutate({
                            id: user.id,
                            active: !user.active,
                          })
                        }
                        className="text-[#444] hover:text-emerald-500 transition-colors"
                      >
                        <Power size={13} />
                      </button>
                      <button
                        onClick={() => deleteMutation.mutate(user.id)}
                        className="text-[#444] hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Paginação */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="text-[10px] tracking-widest uppercase text-[#444] hover:text-[#ccc] disabled:opacity-30 transition-colors"
          >
            Anterior
          </button>
          <span className="text-[10px] text-[#333]">
            {page + 1} / {data.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(data.totalPages - 1, p + 1))}
            disabled={page === data.totalPages - 1}
            className="text-[10px] tracking-widest uppercase text-[#444] hover:text-[#ccc] disabled:opacity-30 transition-colors"
          >
            Próxima
          </button>
        </div>
      )}

      {/* Modal criar/editar */}
      {modal && (modal.type === "create" || modal.type === "edit") && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[#0d0d0d] border border-[#1f1f1f] rounded p-6 w-full max-w-sm space-y-4">
            <h2 className="text-xs tracking-widest uppercase text-[#666]">
              {modal.type === "create" ? "Novo usuário" : "Editar usuário"}
            </h2>
            <form
              onSubmit={userForm.handleSubmit((d) =>
                modal.type === "edit"
                  ? editMutation.mutate({ id: modal.user.id, data: d })
                  : createMutation.mutate(d),
              )}
              className="space-y-4"
            >
              <div className="space-y-1">
                <label className="text-[10px] tracking-widest uppercase text-[#444]">
                  Conexões simultâneas
                </label>
                <input
                  type="number"
                  {...userForm.register("maxConnections")}
                  className="w-full bg-[#141414] border border-[#1f1f1f] rounded px-3 py-2 text-xs text-[#ccc] outline-none focus:border-[#333]"
                />
                {userForm.formState.errors.maxConnections && (
                  <p className="text-[10px] text-red-500">
                    {userForm.formState.errors.maxConnections.message}
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-[10px] tracking-widest uppercase text-[#444]">
                  Validade (dias)
                </label>
                <input
                  type="number"
                  {...userForm.register("validadeDias")}
                  className="w-full bg-[#141414] border border-[#1f1f1f] rounded px-3 py-2 text-xs text-[#ccc] outline-none focus:border-[#333]"
                />
                {userForm.formState.errors.validadeDias && (
                  <p className="text-[10px] text-red-500">
                    {userForm.formState.errors.validadeDias.message}
                  </p>
                )}
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setModal(null)}
                  className="text-[10px] tracking-widest uppercase text-[#444] hover:text-[#ccc] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || editMutation.isPending}
                  className="text-[10px] tracking-widest uppercase border border-[#1f1f1f] px-3 py-1.5 rounded hover:border-[#333] transition-colors disabled:opacity-40"
                >
                  {createMutation.isPending || editMutation.isPending
                    ? "Salvando..."
                    : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal renovar */}
      {modal?.type === "renovar" && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[#0d0d0d] border border-[#1f1f1f] rounded p-6 w-full max-w-sm space-y-4">
            <h2 className="text-xs tracking-widest uppercase text-[#666]">
              Renovar validade
            </h2>
            <p className="text-[10px] text-[#444]">{modal.user.username}</p>
            <form
              onSubmit={renovarForm.handleSubmit((d) =>
                renovarMutation.mutate({ id: modal.user.id, dias: d.dias }),
              )}
              className="space-y-4"
            >
              <div className="space-y-1">
                <label className="text-[10px] tracking-widest uppercase text-[#444]">
                  Dias
                </label>
                <input
                  type="number"
                  {...renovarForm.register("dias")}
                  className="w-full bg-[#141414] border border-[#1f1f1f] rounded px-3 py-2 text-xs text-[#ccc] outline-none focus:border-[#333]"
                />
                {renovarForm.formState.errors.dias && (
                  <p className="text-[10px] text-red-500">
                    {renovarForm.formState.errors.dias.message}
                  </p>
                )}
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setModal(null)}
                  className="text-[10px] tracking-widest uppercase text-[#444] hover:text-[#ccc] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={renovarMutation.isPending}
                  className="text-[10px] tracking-widest uppercase border border-[#1f1f1f] px-3 py-1.5 rounded hover:border-[#333] transition-colors disabled:opacity-40"
                >
                  {renovarMutation.isPending ? "Renovando..." : "Renovar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
