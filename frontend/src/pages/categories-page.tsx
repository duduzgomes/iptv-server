import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Pencil, Trash2, Power } from "lucide-react";
import { RowActions } from "../ui/row-actions";
import { categoriesApi } from "../api/categories";
import { categorySchema, type CategoryFormData } from "../schemas";
import type { Category } from "../types";
import { DataTable, TableBody, TableRow, TableCell } from "../ui/data-table";
import { Button } from "../ui/button";
import { DataTableHeader } from "../ui/data-table-header";
import { Field, FormInput } from "../ui/form-field";
import { FormSelect } from "../ui/form-select";
import { Modal } from "../ui/modal";
import { StatusBadge } from "../ui/status-badge";

export function CategoriesPage() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);

  const { data: categories, isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoriesApi.list(),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
  });

  function openCreate() {
    setEditing(null);
    reset({ name: "", contentType: "LIVE" });
    setModalOpen(true);
  }

  function openEdit(cat: Category) {
    setEditing(cat);
    reset({ name: cat.name, contentType: cat.contentType });
    setModalOpen(true);
  }

  const invalidate = () => qc.invalidateQueries({ queryKey: ["categories"] });

  const saveMutation = useMutation({
    mutationFn: (data: CategoryFormData) =>
      editing
        ? categoriesApi.update(editing.id, { name: data.name })
        : categoriesApi.create(data),
    onSuccess: () => {
      toast.success(editing ? "Categoria atualizada" : "Categoria criada");
      setModalOpen(false);
      invalidate();
    },
    onError: () => toast.error("Erro ao salvar categoria"),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: number) => categoriesApi.toggleStatus(id),
    onSuccess: () => {
      toast.success("Status atualizado");
      invalidate();
    },
    onError: () => toast.error("Erro ao atualizar status"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => categoriesApi.remove(id),
    onSuccess: () => {
      toast.success("Categoria removida");
      invalidate();
    },
    onError: () => toast.error("Erro ao remover categoria"),
  });

  const typeLabel: Record<string, string> = {
    LIVE: "Ao vivo",
    VOD: "Filme",
    SERIES: "Série",
  };

  return (
    <div className="space-y-6">
      <DataTableHeader
        title="Categorias"
        onAdd={openCreate}
        addLabel="Adicionar"
      />

      <DataTable
        columns={["Nome", "Tipo", "Status", "Ações"]}
        isLoading={isLoading}
      >
        <TableBody>
          {categories?.map((cat) => (
            <TableRow key={cat.id}>
              <TableCell className="text-text">{cat.name}</TableCell>
              <TableCell className="text-text-subtle">
                {typeLabel[cat.contentType]}
              </TableCell>
              <TableCell>
                <StatusBadge
                  status={cat.active ? "ACTIVE" : "INACTIVE"}
                  label={cat.active ? "Ativo" : "Inativo"}
                />
              </TableCell>
              <TableCell>
                <RowActions
                  actions={[
                    {
                      label: "Editar",
                      icon: <Pencil />,
                      onClick: () => openEdit(cat),
                    },
                    {
                      label: cat.active ? "Desativar" : "Ativar",
                      icon: <Power />,
                      onClick: () => toggleMutation.mutate(cat.id),
                    },
                    {
                      label: "Remover",
                      icon: <Trash2 />,
                      onClick: () => deleteMutation.mutate(cat.id),
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
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Editar categoria" : "Nova categoria"}
      >
        <form
          onSubmit={handleSubmit((d) => saveMutation.mutate(d))}
          className="space-y-4"
        >
          <Field label="Nome" error={errors.name?.message}>
            <FormInput {...register("name")} />
          </Field>

          {!editing && (
            <Field label="Tipo" error={errors.contentType?.message}>
              <FormSelect {...register("contentType")}>
                <option value="LIVE">Ao vivo</option>
                <option value="VOD">Filme</option>
                <option value="SERIES">Série</option>
              </FormSelect>
            </Field>
          )}

          <div className="flex gap-3 justify-end pt-2">
            <Button
              variant="ghost"
              size="lg"
              type="button"
              onClick={() => setModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" size="lg" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
