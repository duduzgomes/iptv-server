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
import { Modal } from "../ui/Modal";
import { Field, FormInput } from "../ui/FormField";
import { Button } from "../ui/Button";
import { StatusBadge } from "../ui/StatusBadge";
import { DataTableHeader } from "../ui/DataTableHeader";

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

  const { data, isLoading } = useQuery({
    queryKey: ["users", page],
    queryFn: () => usersApi.list(page),
  });

  function togglePassword(id: number) {
    setVisiblePasswords((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

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
      <DataTableHeader title="Usuários" onAdd={openCreate} />

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
                    <StatusBadge
                      status={user.active ? "ACTIVE" : "INACTIVE"}
                      label={user.active ? "Ativo" : "Inativo"}
                    />
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

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-end gap-3">
          <Button
            variant="ghost"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            Anterior
          </Button>
          <span className="text-[10px] text-[#333]">
            {page + 1} / {data.totalPages}
          </span>
          <Button
            variant="ghost"
            onClick={() => setPage((p) => Math.min(data.totalPages - 1, p + 1))}
            disabled={page === data.totalPages - 1}
          >
            Próxima
          </Button>
        </div>
      )}

      {/* Modal criar/editar */}
      <Modal
        open={!!(modal && (modal.type === "create" || modal.type === "edit"))}
        onClose={() => setModal(null)}
        title={modal?.type === "create" ? "Novo usuário" : "Editar usuário"}
      >
        <form
          onSubmit={userForm.handleSubmit((d) =>
            modal?.type === "edit"
              ? editMutation.mutate({
                  id: (modal as { type: "edit"; user: User }).user.id,
                  data: d,
                })
              : createMutation.mutate(d),
          )}
          className="space-y-4"
        >
          <Field
            label="Conexões simultâneas"
            error={userForm.formState.errors.maxConnections?.message}
          >
            <FormInput type="number" {...userForm.register("maxConnections")} />
          </Field>
          <Field
            label="Validade (dias)"
            error={userForm.formState.errors.validadeDias?.message}
          >
            <FormInput type="number" {...userForm.register("validadeDias")} />
          </Field>
          <div className="flex gap-3 justify-end pt-2">
            <Button
              variant="ghost"
              type="button"
              onClick={() => setModal(null)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || editMutation.isPending}
            >
              {createMutation.isPending || editMutation.isPending
                ? "Salvando..."
                : "Salvar"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal renovar */}
      <Modal
        open={modal?.type === "renovar"}
        onClose={() => setModal(null)}
        title="Renovar validade"
      >
        {modal?.type === "renovar" && (
          <>
            <p className="text-[10px] text-[#444]">{modal.user.username}</p>
            <form
              onSubmit={renovarForm.handleSubmit((d) =>
                renovarMutation.mutate({ id: modal.user.id, dias: d.dias }),
              )}
              className="space-y-4"
            >
              <Field
                label="Dias"
                error={renovarForm.formState.errors.dias?.message}
              >
                <FormInput type="number" {...renovarForm.register("dias")} />
              </Field>
              <div className="flex gap-3 justify-end pt-2">
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() => setModal(null)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={renovarMutation.isPending}>
                  {renovarMutation.isPending ? "Renovando..." : "Renovar"}
                </Button>
              </div>
            </form>
          </>
        )}
      </Modal>
    </div>
  );
}
