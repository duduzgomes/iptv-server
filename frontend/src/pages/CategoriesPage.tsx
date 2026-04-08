import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Pencil, Trash2, Power, FormInput } from "lucide-react";
import { categoriesApi } from "../api/categories";
import { categorySchema, type CategoryFormData } from "../schemas";
import type { Category } from "../types";
import { PageSkeleton } from "../ui/PageSkeleton";
import { Button } from "../ui/Button";
import { DataTableHeader } from "../ui/DataTableHeader";
import { Field, FormSelect } from "../ui/FormField";
import { Modal } from "../ui/Modal";
import { StatusBadge } from "../ui/StatusBadge";

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
      <DataTableHeader title="Categorias" onAdd={openCreate} />

      <div className="border border-[#1f1f1f] rounded overflow-hidden">
        {isLoading ? (
          <PageSkeleton columns={["Nome", "Tipo", "Status", "Ações"]} />
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#1f1f1f]">
                {["Nome", "Tipo", "Status", "Ações"].map((col) => (
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
              {categories?.map((cat) => (
                <tr
                  key={cat.id}
                  className="border-b border-[#141414] hover:bg-[#0f0f0f] transition-colors"
                >
                  <td className="py-3 px-4 text-[#ccc]">{cat.name}</td>
                  <td className="py-3 px-4 text-[#555]">
                    {typeLabel[cat.contentType]}
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge
                      status={cat.active ? "ACTIVE" : "INACTIVE"}
                      label={cat.active ? "Ativo" : "Inativo"}
                    />
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-3">
                      <button
                        onClick={() => openEdit(cat)}
                        className="text-[#444] hover:text-[#ccc] transition-colors"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => toggleMutation.mutate(cat.id)}
                        className="text-[#444] hover:text-emerald-500 transition-colors"
                      >
                        <Power size={13} />
                      </button>
                      <button
                        onClick={() => deleteMutation.mutate(cat.id)}
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
              type="button"
              onClick={() => setModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
