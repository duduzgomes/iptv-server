import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Trash2, Power, RefreshCw } from "lucide-react";
import { seriesApi } from "../api/series";
import { tmdbApi, type TmdbSeries } from "../api/tmdb";
import { categoriesApi } from "../api/categories";
import { DataTable, TableBody, TableRow, TableCell } from "../ui/data-table";
import type { Series } from "../types";
import { Modal, ModalFooter, ModalTitle } from "../ui/modal";
import { ConfirmDialog } from "../ui/confirm-dialog";
import { FormInput, Field } from "../ui/form-field";
import { FormSelect } from "../ui/form-select";
import { Button } from "../ui/button";
import { StatusBadge } from "../ui/status-badge";
import { DataTableHeader } from "../ui/data-table-header";

type Step = "search" | "confirm";

export function SeriesPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();

  const [modalOpen, setModalOpen] = useState(false);
  const [step, setStep] = useState<Step>("search");
  const [query, setQuery] = useState("");
  const [tmdbResults, setTmdbResults] = useState<TmdbSeries[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedSeries, setSelectedSeries] = useState<TmdbSeries | null>(null);
  const [categoryId, setCategoryId] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [confirmDelete, setConfirmDelete] = useState<Series | null>(null);

  const { data: seriesList = [], isLoading } = useQuery<Series[]>({
    queryKey: ["series"],
    queryFn: seriesApi.list,
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
      <DataTableHeader title="Séries" onAdd={openModal} addLabel="Adicionar" />

      <DataTable columns={columns} isLoading={isLoading}>
        <TableBody>
          {seriesList.map((s: Series) => (
            <TableRow
              key={s.id}
              className="cursor-pointer"
              onClick={() => navigate(`/series/${s.id}`)}
            >
              <TableCell>
                <div>
                  <p className="text-text">{s.title}</p>
                  <p className="text-text-muted text-xs">{s.genre ?? "—"}</p>
                </div>
              </TableCell>
              <TableCell className="text-text-subtle">
                {s.category.name}
              </TableCell>
              <TableCell>
                <StatusBadge
                  status={s.active ? "ACTIVE" : "INACTIVE"}
                  label={s.active ? "Ativa" : "Inativa"}
                />
              </TableCell>
              <TableCell>
                <div
                  className="flex gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label="Sincronizar TMDB"
                    onClick={() => syncMut.mutate(s.id)}
                    className="hover:text-info"
                  >
                    <RefreshCw />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={s.active ? "Desativar série" : "Ativar série"}
                    onClick={() =>
                      toggleMut.mutate({ id: s.id, active: !s.active })
                    }
                    className="hover:text-success"
                  >
                    <Power />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label="Remover série"
                    onClick={() => setConfirmDelete(s)}
                    className="hover:text-error"
                  >
                    <Trash2 />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </DataTable>

      {/* Modal busca TMDB */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} size="lg">
        {step === "search" && (
          <>
            <ModalTitle>Buscar série</ModalTitle>
            <FormInput
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Digite o nome da série..."
            />
            <div className="max-h-72 overflow-y-auto space-y-1">
              {searching && (
                <p className="text-sm text-text-ghost text-center py-4">
                  Buscando...
                </p>
              )}
              {!searching &&
                tmdbResults.map((s) => (
                  <Button
                    key={s.id}
                    variant="ghost"
                    onClick={() => {
                      setSelectedSeries(s);
                      setStep("confirm");
                    }}
                    className="w-full justify-start gap-3 normal-case tracking-normal h-auto py-2 px-3"
                  >
                    {s.poster_path ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w92${s.poster_path}`}
                        alt={s.name}
                        className="w-12 aspect-2/3 object-cover rounded opacity-80 shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-12 bg-surface-input rounded shrink-0" />
                    )}
                    <div className="text-left">
                      <p className="text-sm text-text">{s.name}</p>
                      <p className="text-xs text-text-ghost">
                        {s.first_air_date?.slice(0, 4)} · ID {s.id}
                      </p>
                    </div>
                  </Button>
                ))}
              {!searching && query && tmdbResults.length === 0 && (
                <p className="text-xs text-text-ghost text-center py-4">
                  Nenhum resultado
                </p>
              )}
            </div>
            <ModalFooter>
              <Button variant="ghost" onClick={() => setModalOpen(false)}>
                Cancelar
              </Button>
            </ModalFooter>
          </>
        )}

        {step === "confirm" && selectedSeries && (
          <>
            <ModalTitle>Confirmar cadastro</ModalTitle>
            <div className="flex items-center gap-4 p-3 bg-surface-input rounded">
              {selectedSeries.poster_path ? (
                <img
                  src={`https://image.tmdb.org/t/p/w92${selectedSeries.poster_path}`}
                  alt={selectedSeries.name}
                  className="w-10 h-14 object-cover rounded opacity-80 shrink-0"
                />
              ) : (
                <div className="w-10 h-14 bg-surface rounded shrink-0" />
              )}
              <div>
                <p className="text-xs text-text">{selectedSeries.name}</p>
                <p className="text-[10px] text-text-ghost">
                  {selectedSeries.first_air_date?.slice(0, 4)}
                </p>
                <p className="text-[10px] text-text-ghost mt-1">
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
            <ModalFooter className="justify-between">
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
            </ModalFooter>
          </>
        )}
      </Modal>

      <ConfirmDialog
        open={!!confirmDelete}
        title="Remover série?"
        message={`${confirmDelete?.title ?? ""} e todos os seus episódios serão removidos permanentemente.`}
        confirmLabel="Remover"
        onConfirm={() => confirmDelete && deleteMut.mutate(confirmDelete.id)}
        onCancel={() => setConfirmDelete(null)}
        loading={deleteMut.isPending}
      />
    </div>
  );
}
