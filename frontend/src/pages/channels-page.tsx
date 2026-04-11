import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Pencil, Trash2, Power } from "lucide-react";
import { RowActions } from "../ui/row-actions";
import {
  getChannels,
  createChannel,
  updateChannel,
  toggleChannelStatus,
  deleteChannel,
} from "../api/channels";
import { categoriesApi } from "../api/categories";
import { channelSchema, type ChannelFormData } from "../schemas";
import type { Channel } from "../types";
import { DataTable, TableBody, TableRow, TableCell } from "../ui/data-table";
import { DataTableHeader } from "../ui/data-table-header";
import { Button } from "../ui/button";
import { Field, FormInput } from "../ui/form-field";
import { FormSelect } from "../ui/form-select";
import { Modal, ModalFooter } from "../ui/modal";
import { StatusBadge } from "../ui/status-badge";
import { ConfirmDialog } from "../ui/confirm-dialog";

export function ChannelsPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [selected, setSelected] = useState<Channel | null>(null);
  const [deleteChannel_, setDeleteChannel] = useState<Channel | null>(null);

  const { data: channels = [], isLoading } = useQuery({
    queryKey: ["channels"],
    queryFn: getChannels,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories", "LIVE"],
    queryFn: () => categoriesApi.list("LIVE"),
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ChannelFormData>({
    resolver: zodResolver(channelSchema),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["channels"] });

  const createMut = useMutation({
    mutationFn: createChannel,
    onSuccess: () => {
      toast.success("Canal criado");
      invalidate();
      closeModal();
    },
    onError: () => toast.error("Erro ao criar canal"),
  });

  const updateMut = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: Omit<ChannelFormData, "categoryId" | "streamKey">;
    }) => updateChannel(id, data),
    onSuccess: () => {
      toast.success("Canal atualizado");
      invalidate();
      closeModal();
    },
    onError: () => toast.error("Erro ao atualizar canal"),
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      toggleChannelStatus(id, active),
    onSuccess: () => {
      toast.success("Status atualizado");
      invalidate();
    },
    onError: () => toast.error("Erro ao atualizar status"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteChannel(id),
    onSuccess: () => {
      toast.success("Canal removido");
      invalidate();
      setDeleteChannel(null);
    },
    onError: () => toast.error("Erro ao remover canal"),
  });

  function openCreate() {
    reset({});
    setModal("create");
  }

  function openEdit(c: Channel) {
    setSelected(c);
    setValue("name", c.name);
    setValue("logoUrl", c.logoUrl ?? "");
    setValue("sourceUrl", c.sourceUrl);
    setValue("streamKey", c.streamKey);
    setValue("epgChannelId", c.epgChannelId ?? "");
    setValue("categoryId", c.category.id);
    setModal("edit");
  }

  function closeModal() {
    setModal(null);
    setSelected(null);
    reset({});
  }

  function onSubmit(data: ChannelFormData) {
    if (modal === "create") return createMut.mutate(data);
    if (modal === "edit" && selected) {
      const { categoryId: _, streamKey: __, ...rest } = data;
      return updateMut.mutate({ id: selected.id, data: rest });
    }
  }

  const isSubmitting = createMut.isPending || updateMut.isPending;
  const columns = ["#", "Nome", "Categoria", "Stream Key", "Status", "Ações"];

  return (
    <div className="space-y-6">
      <DataTableHeader title="Canais" onAdd={openCreate} addLabel="Adicionar" />

      <DataTable columns={columns} isLoading={isLoading}>
        <TableBody>
          {channels.map((c) => (
            <TableRow key={c.id}>
              <TableCell className="text-text-subtle">{c.num}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {c.logoUrl && (
                    <img
                      src={c.logoUrl}
                      alt=""
                      className="w-6 h-6 object-contain rounded shrink-0"
                    />
                  )}
                  <span className="text-text">{c.name}</span>
                </div>
              </TableCell>
              <TableCell className="text-text-subtle">
                {c.category.name}
              </TableCell>
              <TableCell className="font-mono text-xs text-text-subtle">
                {c.streamKey}
              </TableCell>
              <TableCell>
                <StatusBadge
                  status={c.active ? "ACTIVE" : "INACTIVE"}
                  label={c.active ? "Ativo" : "Inativo"}
                />
              </TableCell>
              <TableCell>
                <RowActions
                  actions={[
                    {
                      label: "Editar",
                      icon: <Pencil />,
                      onClick: () => openEdit(c),
                    },
                    {
                      label: c.active ? "Desativar" : "Ativar",
                      icon: <Power />,
                      onClick: () =>
                        toggleMut.mutate({ id: c.id, active: !c.active }),
                    },
                    {
                      label: "Remover",
                      icon: <Trash2 />,
                      onClick: () => setDeleteChannel(c),
                      danger: true,
                    },
                  ]}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </DataTable>

      <Modal
        open={!!modal}
        onClose={closeModal}
        title={modal === "create" ? "Novo canal" : "Editar canal"}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {modal === "create" && (
            <Field label="Categoria" error={errors.categoryId?.message}>
              <FormSelect {...register("categoryId", { valueAsNumber: true })}>
                <option value="">Selecione...</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </FormSelect>
            </Field>
          )}

          <Field label="Nome" error={errors.name?.message}>
            <FormInput {...register("name")} placeholder="Ex: Globo HD" />
          </Field>

          <Field label="URL de Origem" error={errors.sourceUrl?.message}>
            <FormInput {...register("sourceUrl")} placeholder="rtmp://..." />
          </Field>

          <Field label="Stream Key" error={errors.streamKey?.message}>
            <FormInput
              {...register("streamKey")}
              placeholder="globo-hd"
              disabled={modal === "edit"}
            />
          </Field>

          <Field label="Logo URL" error={errors.logoUrl?.message}>
            <FormInput {...register("logoUrl")} placeholder="https://..." />
          </Field>

          <Field label="EPG Channel ID" error={errors.epgChannelId?.message}>
            <FormInput
              {...register("epgChannelId")}
              placeholder="opcional"
            />
          </Field>

          <ModalFooter>
            <Button variant="ghost" type="button" onClick={closeModal}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Salvar"}
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteChannel_}
        title="Remover canal"
        message={`O canal "${deleteChannel_?.name}" será removido permanentemente.`}
        confirmLabel="Remover"
        loading={deleteMut.isPending}
        onConfirm={() => deleteMut.mutate(deleteChannel_!.id)}
        onCancel={() => setDeleteChannel(null)}
      />
    </div>
  );
}
