import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, Wifi } from "lucide-react";
import {
  getChannels,
  createChannel,
  updateChannel,
  toggleChannelStatus,
  deleteChannel,
} from "../api/channels";

import { channelSchema, type ChannelFormData } from "../schemas";
import type { Channel } from "../types";
import { categoriesApi } from "../api/categories";

export default function ChannelsPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [selected, setSelected] = useState<Channel | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Channel | null>(null);

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
      setConfirmDelete(null);
    },
    onError: () => toast.error("Erro ao remover canal"),
  });

  const openCreate = () => {
    reset({});
    setModal("create");
  };
  const openEdit = (c: Channel) => {
    setSelected(c);
    setValue("name", c.name);
    setValue("logoUrl", c.logoUrl ?? "");
    setValue("sourceUrl", c.sourceUrl);
    setValue("streamKey", c.streamKey);
    setValue("epgChannelId", c.epgChannelId ?? "");
    setValue("categoryId", c.category.id);
    setModal("edit");
  };
  const closeModal = () => {
    setModal(null);
    setSelected(null);
    reset({});
  };

  const onSubmit = (data: ChannelFormData) => {
    if (modal === "create") return createMut.mutate(data);
    if (modal === "edit" && selected) {
      const { categoryId, streamKey, ...rest } = data;
      return updateMut.mutate({ id: selected.id, data: rest });
    }
  };

  const isSubmitting = createMut.isPending || updateMut.isPending;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Wifi className="text-blue-500" size={22} />
          <h1 className="text-xl font-semibold text-white">Canais ao Vivo</h1>
          <span className="text-xs bg-white/10 text-white/60 px-2 py-0.5 rounded-full">
            {channels.length}
          </span>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-2 rounded-lg transition"
        >
          <Plus size={16} /> Novo Canal
        </button>
      </div>

      {/* Tabela */}
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-white/50 text-left">
              <th className="px-4 py-3 font-medium">#</th>
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">Categoria</th>
              <th className="px-4 py-3 font-medium">Stream Key</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-white/5">
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-white/10 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : channels.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-10 text-center text-white/40"
                >
                  Nenhum canal cadastrado
                </td>
              </tr>
            ) : (
              channels.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-white/5 hover:bg-white/5 transition"
                >
                  <td className="px-4 py-3 text-white/40">{c.num}</td>
                  <td className="px-4 py-3 flex items-center gap-2">
                    {c.logoUrl && (
                      <img
                        src={c.logoUrl}
                        alt=""
                        className="w-6 h-6 object-contain rounded"
                      />
                    )}
                    <span className="text-white font-medium">{c.name}</span>
                  </td>
                  <td className="px-4 py-3 text-white/60">{c.category.name}</td>
                  <td className="px-4 py-3 text-white/40 font-mono text-xs">
                    {c.streamKey}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() =>
                        toggleMut.mutate({ id: c.id, active: !c.active })
                      }
                      className={`px-2 py-1 rounded-full text-xs font-medium transition ${
                        c.active
                          ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                          : "bg-white/10 text-white/40 hover:bg-white/20"
                      }`}
                    >
                      {c.active ? "Ativo" : "Inativo"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEdit(c)}
                        className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setConfirmDelete(c)}
                        className="p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal criar/editar */}
      {modal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl w-full max-w-md p-6 space-y-5">
            <h2 className="text-white font-semibold text-lg">
              {modal === "create" ? "Novo Canal" : "Editar Canal"}
            </h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Categoria — só na criação */}
              {modal === "create" && (
                <div className="space-y-1">
                  <label className="text-white/60 text-xs">Categoria</label>
                  <select
                    {...register("categoryId", { valueAsNumber: true })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Selecione</option>
                    {categories.map((cat: any) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  {errors.categoryId && (
                    <p className="text-red-400 text-xs">
                      {errors.categoryId.message}
                    </p>
                  )}
                </div>
              )}

              {[
                { name: "name", label: "Nome", placeholder: "Ex: Globo HD" },
                {
                  name: "sourceUrl",
                  label: "URL de Origem",
                  placeholder: "rtmp://...",
                },
                {
                  name: "streamKey",
                  label: "Stream Key",
                  placeholder: "globo-hd",
                  disabled: modal === "edit",
                },
                {
                  name: "logoUrl",
                  label: "Logo URL",
                  placeholder: "https://...",
                },
                {
                  name: "epgChannelId",
                  label: "EPG Channel ID",
                  placeholder: "opcional",
                },
              ].map(({ name, label, placeholder, disabled }) => (
                <div key={name} className="space-y-1">
                  <label className="text-white/60 text-xs">{label}</label>
                  <input
                    {...register(name as keyof ChannelFormData)}
                    placeholder={placeholder}
                    disabled={disabled}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-blue-500 disabled:opacity-40"
                  />
                  {errors[name as keyof ChannelFormData] && (
                    <p className="text-red-400 text-xs">
                      {errors[name as keyof ChannelFormData]?.message}
                    </p>
                  )}
                </div>
              ))}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-2 rounded-lg border border-white/10 text-white/60 text-sm hover:bg-white/5 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm transition disabled:opacity-50"
                >
                  {isSubmitting ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm delete */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl w-full max-w-sm p-6 space-y-4">
            <h2 className="text-white font-semibold">Remover canal?</h2>
            <p className="text-white/50 text-sm">
              O canal <span className="text-white">{confirmDelete.name}</span>{" "}
              será removido permanentemente.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2 rounded-lg border border-white/10 text-white/60 text-sm hover:bg-white/5 transition"
              >
                Cancelar
              </button>
              <button
                onClick={() => deleteMut.mutate(confirmDelete.id)}
                disabled={deleteMut.isPending}
                className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm transition disabled:opacity-50"
              >
                {deleteMut.isPending ? "Removendo..." : "Remover"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
