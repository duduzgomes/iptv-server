import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Pencil, Trash2, Power, Eye, EyeOff } from "lucide-react";
import { RowActions } from "../ui/row-actions";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { usersApi } from "../api/users";
import { z } from "zod";
import { userSchema, type UserFormData } from "../schemas";
import type { User } from "../types";
import { DataTable, TableBody, TableRow, TableCell } from "../ui/data-table";
import { Field, FormInput } from "../ui/form-field";
import { Button } from "../ui/button";
import { StatusBadge } from "../ui/status-badge";
import { DataTableHeader } from "../ui/data-table-header";
import { Modal, ModalFooter } from "../ui/modal";
import { ConfirmDialog } from "../ui/confirm-dialog";

type ModalState = { type: "create" } | { type: "edit"; user: User } | null;

export function UsersPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(0);
  const [modal, setModal] = useState<ModalState>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
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
      setDeleteId(null);
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
      <DataTableHeader
        title="Usuários"
        onAdd={openCreate}
        addLabel="Adicionar"
      />

      <DataTable columns={columns} isLoading={isLoading}>
        <TableBody>
          {data?.content.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="text-text">{user.username}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2 ">
                  <span className="text-text-subtle w-24 truncate inline-block">
                    {visiblePasswords.has(user.id) ? user.password : "••••••••"}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={
                      visiblePasswords.has(user.id)
                        ? "Ocultar senha"
                        : "Mostrar senha"
                    }
                    onClick={() => togglePassword(user.id)}
                  >
                    {visiblePasswords.has(user.id) ? <EyeOff /> : <Eye />}
                  </Button>
                </div>
              </TableCell>
              <TableCell className="text-text-subtle ">
                {user.maxConnections}
              </TableCell>
              <TableCell className="text-text-subtle">
                {format(new Date(user.expiresAt), "dd/MM/yyyy", {
                  locale: ptBR,
                })}
              </TableCell>
              <TableCell>
                <StatusBadge
                  status={user.active ? "ACTIVE" : "INACTIVE"}
                  label={user.active ? "Ativo" : "Inativo"}
                />
              </TableCell>
              <TableCell>
                <RowActions
                  actions={[
                    {
                      label: "Editar",
                      icon: <Pencil />,
                      onClick: () => openEdit(user),
                    },
                    {
                      label: user.active ? "Desativar" : "Ativar",
                      icon: <Power />,
                      onClick: () =>
                        toggleMutation.mutate({
                          id: user.id,
                          active: !user.active,
                        }),
                    },
                    {
                      label: "Remover",
                      icon: <Trash2 />,
                      onClick: () => setDeleteId(user.id),
                      danger: true,
                    },
                  ]}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </DataTable>

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-end gap-3">
          <Button
            variant="ghost"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            Anterior
          </Button>
          <span className="text-xs text-text-ghost">
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
          <ModalFooter>
            <Button
              variant="ghost"
              size="lg"
              type="button"
              onClick={() => setModal(null)}
            >
              Cancelar
            </Button>
            <Button
              size="lg"
              type="submit"
              disabled={createMutation.isPending || editMutation.isPending}
            >
              {createMutation.isPending || editMutation.isPending
                ? "Salvando..."
                : "Salvar"}
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Confirmação de exclusão */}
      <ConfirmDialog
        open={deleteId !== null}
        title="Remover usuário"
        message="Esta ação não pode ser desfeita. O usuário será removido permanentemente."
        confirmLabel="Remover"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteId !== null && deleteMutation.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
