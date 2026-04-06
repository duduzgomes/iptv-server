import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Pencil, Trash2, Power } from "lucide-react";
import { categoriesApi } from "../api/categories";
import { categorySchema, type CategoryFormData } from "../schemas";
import type { Category } from "../types";
import { PageSkeleton } from "../ui/PageSkeleton";

export function CategoriesPage() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);

  // --- Query ---
  const { data: categories, isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoriesApi.list(),
  });

  // --- Form ---
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

  // --- Mutations ---
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-sm tracking-widest uppercase text-[#666]">
          Categorias
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
                    <span
                      className={`text-[10px] tracking-widest uppercase ${cat.active ? "text-emerald-500" : "text-[#444]"}`}
                    >
                      {cat.active ? "Ativo" : "Inativo"}
                    </span>
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

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[#0d0d0d] border border-[#1f1f1f] rounded p-6 w-full max-w-sm space-y-4">
            <h2 className="text-xs tracking-widest uppercase text-[#666]">
              {editing ? "Editar categoria" : "Nova categoria"}
            </h2>

            <form
              onSubmit={handleSubmit((d) => saveMutation.mutate(d))}
              className="space-y-4"
            >
              <div className="space-y-1">
                <label className="text-[10px] tracking-widest uppercase text-[#444]">
                  Nome
                </label>
                <input
                  {...register("name")}
                  className="w-full bg-[#141414] border border-[#1f1f1f] rounded px-3 py-2 text-xs text-[#ccc] outline-none focus:border-[#333]"
                />
                {errors.name && (
                  <p className="text-[10px] text-red-500">
                    {errors.name.message}
                  </p>
                )}
              </div>

              {!editing && (
                <div className="space-y-1">
                  <label className="text-[10px] tracking-widest uppercase text-[#444]">
                    Tipo
                  </label>
                  <select
                    {...register("contentType")}
                    className="w-full bg-[#141414] border border-[#1f1f1f] rounded px-3 py-2 text-xs text-[#ccc] outline-none focus:border-[#333]"
                  >
                    <option value="LIVE">Ao vivo</option>
                    <option value="VOD">Filme</option>
                    <option value="SERIES">Série</option>
                  </select>
                  {errors.contentType && (
                    <p className="text-[10px] text-red-500">
                      {errors.contentType.message}
                    </p>
                  )}
                </div>
              )}

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="text-[10px] tracking-widest uppercase text-[#444] hover:text-[#ccc] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="text-[10px] tracking-widest uppercase border border-[#1f1f1f] px-3 py-1.5 rounded hover:border-[#333] transition-colors disabled:opacity-40"
                >
                  {saveMutation.isPending ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
