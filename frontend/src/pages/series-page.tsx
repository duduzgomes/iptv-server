import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Trash2,
  Power,
  RefreshCw,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { seriesApi } from "../api/series";
import { tmdbApi, type TmdbSeries } from "../api/tmdb";
import { categoriesApi } from "../api/categories";
import { PageSkeleton } from "../ui/page-skeleton";
import type { Series, SeriesInfoDTO } from "../types";
import { Modal } from "../ui/modal";
import { ConfirmDialog } from "../ui/confirm-dialog";
import { FormInput, FormSelect, Field } from "../ui/form-field";
import { Button } from "../ui/button";
import { StatusBadge } from "../ui/status-badge";
import { DataTableHeader } from "../ui/data-table-header";

type Step = "search" | "confirm";

export function SeriesPage() {
  const qc = useQueryClient();

  const [modalOpen, setModalOpen] = useState(false);
  const [step, setStep] = useState<Step>("search");
  const [query, setQuery] = useState("");
  const [tmdbResults, setTmdbResults] = useState<TmdbSeries[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedSeries, setSelectedSeries] = useState<TmdbSeries | null>(null);
  const [categoryId, setCategoryId] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [expanded, setExpanded] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Series | null>(null);

  const { data: seriesList = [], isLoading } = useQuery<Series[]>({
    queryKey: ["series"],
    queryFn: seriesApi.list,
  });

  const { data: detail, isLoading: loadingDetail } = useQuery<SeriesInfoDTO>({
    queryKey: ["series-detail", expanded],
    queryFn: () => seriesApi.get(expanded!),
    enabled: expanded !== null,
  });

  const { data: categories } = useQuery({
    queryKey: ["categories", "SERIES"],
    queryFn: () => categoriesApi.list("SERIES"),
  });

  useEffect(() => {
    if (!query.trim()) {
      setTmdbResults([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      const results = await tmdbApi.searchSeries(query);
      setTmdbResults(results);
      setSearching(false);
    }, 500);
  }, [query]);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["series"] });

  function openModal() {
    setStep("search");
    setQuery("");
    setTmdbResults([]);
    setSelectedSeries(null);
    setCategoryId("");
    setModalOpen(true);
  }

  const createMut = useMutation({
    mutationFn: () =>
      seriesApi.create({
        categoryId: Number(categoryId),
        tmdbId: selectedSeries!.id,
      }),
    onSuccess: () => {
      toast.success("Série cadastrada");
      invalidate();
      setModalOpen(false);
    },
    onError: () => toast.error("Erro ao cadastrar série"),
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      seriesApi.toggleStatus(id, active),
    onSuccess: () => {
      toast.success("Status atualizado");
      invalidate();
    },
    onError: () => toast.error("Erro ao atualizar status"),
  });

  const syncMut = useMutation({
    mutationFn: (id: number) => seriesApi.sync(id),
    onSuccess: () => {
      toast.success("Sincronizado com TMDB");
      invalidate();
    },
    onError: () => toast.error("Erro ao sincronizar"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => seriesApi.delete(id),
    onSuccess: () => {
      toast.success("Série removida");
      invalidate();
      setConfirmDelete(null);
    },
    onError: () => toast.error("Erro ao remover série"),
  });

  const columns = ["Série", "Categoria", "Status", "Ações"];

  return (
    <div className="space-y-6">
      <DataTableHeader title="Séries" onAdd={openModal} addLabel="+ Nova" />

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
              {seriesList.map((s: Series) => (
                <>
                  <tr
                    key={s.id}
                    className="border-b border-[#141414] hover:bg-[#0f0f0f] transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() =>
                            setExpanded((prev) => (prev === s.id ? null : s.id))
                          }
                          className="text-[#333] hover:text-[#666] transition-colors shrink-0"
                        >
                          {expanded === s.id ? (
                            <ChevronDown size={12} />
                          ) : (
                            <ChevronRight size={12} />
                          )}
                        </button>
                        {s.posterUrl ? (
                          <img
                            src={s.posterUrl}
                            alt={s.title}
                            className="w-8 h-12 object-cover rounded opacity-80 shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-12 bg-[#141414] rounded shrink-0" />
                        )}
                        <div>
                          <p className="text-[#ccc]">{s.title}</p>
                          <p className="text-[#444] text-[10px]">
                            {s.genre ?? "—"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[#555]">{s.category.name}</td>
                    <td className="py-3 px-4">
                      <StatusBadge
                        status={s.active ? "ACTIVE" : "INACTIVE"}
                        label={s.active ? "Ativa" : "Inativa"}
                      />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-3">
                        <button
                          onClick={() => syncMut.mutate(s.id)}
                          className="text-[#444] hover:text-blue-400 transition-colors"
                          title="Sincronizar TMDB"
                        >
                          <RefreshCw size={13} />
                        </button>
                        <button
                          onClick={() =>
                            toggleMut.mutate({ id: s.id, active: !s.active })
                          }
                          className="text-[#444] hover:text-emerald-500 transition-colors"
                          title="Ativar/Desativar"
                        >
                          <Power size={13} />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(s)}
                          className="text-[#444] hover:text-red-500 transition-colors"
                          title="Remover"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>

                  {expanded === s.id && (
                    <tr
                      key={`${s.id}-detail`}
                      className="border-b border-[#141414] bg-[#080808]"
                    >
                      <td colSpan={4} className="px-12 py-4">
                        {loadingDetail ? (
                          <p className="text-[10px] text-[#444] animate-pulse">
                            Carregando temporadas...
                          </p>
                        ) : !detail ||
                          Object.keys(detail.episodes).length === 0 ? (
                          <p className="text-[10px] text-[#444]">
                            Nenhuma temporada encontrada
                          </p>
                        ) : (
                          <div className="space-y-4">
                            {Object.entries(detail.episodes).map(
                              ([seasonNumber, eps]) => (
                                <div key={seasonNumber}>
                                  <p className="text-[10px] tracking-widest uppercase text-[#444] mb-2">
                                    Temporada {seasonNumber}
                                  </p>
                                  <div className="space-y-1">
                                    {eps.map((ep) => (
                                      <div
                                        key={ep.id}
                                        className="flex items-center gap-4 py-1"
                                      >
                                        <span className="text-[#333] w-5 text-right text-[10px]">
                                          {ep.episode_num}
                                        </span>
                                        <span className="text-[#888] text-[10px] flex-1 truncate">
                                          {ep.title}
                                        </span>
                                        {ep.info?.release_date && (
                                          <span className="text-[#333] text-[10px]">
                                            {ep.info.release_date}
                                          </span>
                                        )}
                                        <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-[#222]" />
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ),
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal busca TMDB */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} size="lg">
        {step === "search" && (
          <>
            <h2 className="text-xs tracking-widest uppercase text-[#666]">
              Buscar série
            </h2>
            <FormInput
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Digite o nome da série..."
            />
            <div className="max-h-72 overflow-y-auto space-y-1">
              {searching && (
                <p className="text-[10px] text-[#444] text-center py-4">
                  Buscando...
                </p>
              )}
              {!searching &&
                tmdbResults.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setSelectedSeries(s);
                      setStep("confirm");
                    }}
                    className="flex items-center gap-3 w-full px-3 py-2 rounded hover:bg-[#141414] transition-colors text-left"
                  >
                    {s.poster_path ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w92${s.poster_path}`}
                        alt={s.name}
                        className="w-8 h-12 object-cover rounded opacity-80 shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-12 bg-[#141414] rounded shrink-0" />
                    )}
                    <div>
                      <p className="text-xs text-[#ccc]">{s.name}</p>
                      <p className="text-[10px] text-[#444]">
                        {s.first_air_date?.slice(0, 4)} · ID {s.id}
                      </p>
                    </div>
                  </button>
                ))}
              {!searching && query && tmdbResults.length === 0 && (
                <p className="text-[10px] text-[#444] text-center py-4">
                  Nenhum resultado
                </p>
              )}
            </div>
            <div className="flex justify-end pt-2">
              <Button variant="ghost" onClick={() => setModalOpen(false)}>
                Cancelar
              </Button>
            </div>
          </>
        )}

        {step === "confirm" && selectedSeries && (
          <>
            <h2 className="text-xs tracking-widest uppercase text-[#666]">
              Confirmar cadastro
            </h2>
            <div className="flex items-center gap-4 p-3 bg-[#141414] rounded">
              {selectedSeries.poster_path ? (
                <img
                  src={`https://image.tmdb.org/t/p/w92${selectedSeries.poster_path}`}
                  alt={selectedSeries.name}
                  className="w-10 h-14 object-cover rounded opacity-80 shrink-0"
                />
              ) : (
                <div className="w-10 h-14 bg-[#1a1a1a] rounded shrink-0" />
              )}
              <div>
                <p className="text-xs text-[#ccc]">{selectedSeries.name}</p>
                <p className="text-[10px] text-[#444]">
                  {selectedSeries.first_air_date?.slice(0, 4)}
                </p>
                <p className="text-[10px] text-[#333] mt-1">
                  TMDB ID: {selectedSeries.id}
                </p>
              </div>
            </div>
            <Field label="Categoria">
              <FormSelect
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="">Selecione...</option>
                {categories?.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </FormSelect>
            </Field>
            <div className="flex gap-3 justify-between pt-2">
              <Button variant="ghost" onClick={() => setStep("search")}>
                ← Voltar
              </Button>
              <div className="flex gap-3">
                <Button variant="ghost" onClick={() => setModalOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={() => createMut.mutate()}
                  disabled={!categoryId || createMut.isPending}
                >
                  {createMut.isPending ? "Cadastrando..." : "Cadastrar"}
                </Button>
              </div>
            </div>
          </>
        )}
      </Modal>

      <ConfirmDialog
        open={!!confirmDelete}
        title="Remover série?"
        message={`${confirmDelete?.title ?? ""} e todos os seus episódios serão removidos permanentemente.`}
        confirmLabel={deleteMut.isPending ? "Removendo..." : "Remover"}
        onConfirm={() => confirmDelete && deleteMut.mutate(confirmDelete.id)}
        onCancel={() => setConfirmDelete(null)}
        loading={deleteMut.isPending}
      />
    </div>
  );
}
