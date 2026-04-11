import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2, Power, RefreshCw, Upload } from "lucide-react";
import { RowActions } from "../ui/row-actions";
import { moviesApi } from "../api/movies";
import { tmdbApi, type TmdbMovie } from "../api/tmdb";
import { categoriesApi } from "../api/categories";
import { DataTable, TableBody, TableRow, TableCell } from "../ui/data-table";
import { uploadApi } from "../api/upload";
import type { Movie } from "../types";
import { Modal, ModalTitle, ModalFooter } from "../ui/modal";
import { FormInput, Field } from "../ui/form-field";
import { FormSelect } from "../ui/form-select";
import { Button } from "../ui/button";
import { StatusBadge } from "../ui/status-badge";
import { DataTableHeader } from "../ui/data-table-header";
import { ConfirmDialog } from "../ui/confirm-dialog";

const vodStatusLabel: Record<string, { label: string; status: string }> = {
  PENDING: { label: "Pendente", status: "PENDING" },
  UPLOADING: { label: "Enviando", status: "UPLOADING" },
  PROCESSING: { label: "Processando", status: "PROCESSING" },
  READY: { label: "Pronto", status: "READY" },
  ERROR: { label: "Erro", status: "ERROR" },
};

type Step = "search" | "confirm";

export function MoviesPage() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);

  const [step, setStep] = useState<Step>("search");
  const [query, setQuery] = useState("");
  const [tmdbResults, setTmdbResults] = useState<TmdbMovie[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<TmdbMovie | null>(null);
  const [categoryId, setCategoryId] = useState<string>("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  type UploadState = "idle" | "uploading" | "done" | "error";
  const [uploadMovie, setUploadMovie] = useState<Movie | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [uploadProgress, setUploadProgress] = useState({
    current: 0,
    total: 0,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [deleteMovieId, setDeleteMovieId] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["movies"],
    queryFn: () => moviesApi.list(),
  });

  const { data: categories } = useQuery({
    queryKey: ["categories", "VOD"],
    queryFn: () => categoriesApi.list("VOD"),
  });

  useEffect(() => {
    if (!query.trim()) {
      setTmdbResults([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      const results = await tmdbApi.search(query);
      setTmdbResults(results);
      setSearching(false);
    }, 500);
  }, [query]);

  function openModal() {
    setStep("search");
    setQuery("");
    setTmdbResults([]);
    setSelected(null);
    setCategoryId("");
    setModalOpen(true);
  }

  function selectMovie(movie: TmdbMovie) {
    setSelected(movie);
    setStep("confirm");
  }

  async function handleUpload() {
    if (!uploadFile || !uploadMovie) return;
    const totalChunks = uploadApi.calcularChunks(uploadFile);
    setUploadState("uploading");
    setUploadProgress({ current: 0, total: totalChunks });
    try {
      const { uploadId, urls } = await uploadApi.iniciar(
        uploadMovie.id,
        totalChunks,
      );
      const etags: string[] = [];
      for (let i = 0; i < totalChunks; i++) {
        const chunk = uploadApi.getChunk(uploadFile, i);
        const etag = await uploadApi.enviarChunk(urls[i], chunk);
        etags.push(etag);
        setUploadProgress({ current: i + 1, total: totalChunks });
      }
      await uploadApi.concluir(uploadMovie.id, uploadId, etags);
      setUploadState("done");
      qc.invalidateQueries({ queryKey: ["movies"] });
      toast.success("Upload concluído — processando transcodificação");
    } catch {
      setUploadState("error");
      toast.error("Erro durante o upload");
    }
  }

  function openUpload(movie: Movie) {
    setUploadMovie(movie);
    setUploadFile(null);
    setUploadState("idle");
    setUploadProgress({ current: 0, total: 0 });
  }

  function closeUpload() {
    if (uploadState === "uploading") return;
    setUploadMovie(null);
  }

  const invalidate = () => qc.invalidateQueries({ queryKey: ["movies"] });

  const createMutation = useMutation({
    mutationFn: () =>
      moviesApi.create({
        categoryId: Number(categoryId),
        tmdbId: selected!.id,
      }),
    onSuccess: () => {
      toast.success("Filme cadastrado");
      setModalOpen(false);
      invalidate();
    },
    onError: () => toast.error("Erro ao cadastrar filme"),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: number) => moviesApi.toggleStatus(id),
    onSuccess: () => {
      toast.success("Status atualizado");
      invalidate();
    },
    onError: () => toast.error("Erro ao atualizar status"),
  });

  const sincronizarMutation = useMutation({
    mutationFn: (id: number) => moviesApi.sincronizar(id),
    onSuccess: () => {
      toast.success("Sincronizado com TMDB");
      invalidate();
    },
    onError: () => toast.error("Erro ao sincronizar"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => moviesApi.remove(id),
    onSuccess: () => {
      toast.success("Filme removido");
      setDeleteMovieId(null);
      invalidate();
    },
    onError: () => toast.error("Erro ao remover filme"),
  });

  const columns = ["Filme", "Categoria", "VOD", "Status", "Ações"];

  return (
    <div className="space-y-6">
      <DataTableHeader title="Filmes" onAdd={openModal} addLabel="Adicionar" />

      <DataTable columns={columns} isLoading={isLoading}>
        <TableBody>
          {data?.map((movie) => {
            const vod = vodStatusLabel[movie.vodStatus];
            return (
              <TableRow key={movie.id}>
                <TableCell>
                  <div className="flex flex-col  gap-1">
                    <p className="text-text">{movie.title}</p>
                    <p className="text-text-muted text-xs">{movie.year}</p>
                  </div>
                </TableCell>
                <TableCell className="text-text-subtle">
                  {movie.category.name}
                </TableCell>
                <TableCell>
                  <StatusBadge status={vod.status} label={vod.label} />
                </TableCell>
                <TableCell>
                  <StatusBadge
                    status={movie.active ? "ACTIVE" : "INACTIVE"}
                    label={movie.active ? "Ativo" : "Inativo"}
                  />
                </TableCell>
                <TableCell>
                  <RowActions
                    actions={[
                      {
                        label: "Sincronizar TMDB",
                        icon: <RefreshCw />,
                        onClick: () => sincronizarMutation.mutate(movie.id),
                      },
                      {
                        label: movie.active ? "Desativar" : "Ativar",
                        icon: <Power />,
                        onClick: () => toggleMutation.mutate(movie.id),
                      },
                      {
                        label: "Upload",
                        icon: <Upload />,
                        onClick: () => openUpload(movie),
                      },
                      {
                        label: "Remover",
                        icon: <Trash2 />,
                        onClick: () => setDeleteMovieId(movie.id),
                        danger: true,
                      },
                    ]}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </DataTable>

      {/* Modal upload */}
      <Modal
        open={!!uploadMovie}
        onClose={closeUpload}
        title="Upload"
        size="sm"
      >
        <p className="text-xs text-text-subtle">{uploadMovie?.title}</p>

        {uploadState === "idle" && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full cursor-pointer border border-dashed border-border-subtle rounded px-3 py-6 text-xs text-text-subtle hover:border-border hover:text-text-muted transition-colors text-center"
            >
              {uploadFile
                ? uploadFile.name
                : "Clique para selecionar o arquivo"}
            </button>
            {uploadFile && (
              <p className="text-xs text-text-ghost text-center">
                {(uploadFile.size / 1024 / 1024).toFixed(1)} MB ·{" "}
                {uploadApi.calcularChunks(uploadFile)} chunks
              </p>
            )}
            <ModalFooter>
              <Button variant="ghost" onClick={closeUpload}>
                Cancelar
              </Button>
              <Button onClick={handleUpload} disabled={!uploadFile}>
                Iniciar upload
              </Button>
            </ModalFooter>
          </>
        )}

        {uploadState === "uploading" && (
          <div className="space-y-3">
            <div className="w-full bg-surface-input rounded-full h-1">
              <div
                className="bg-warning h-1 rounded-full transition-all duration-300"
                style={{
                  width: `${(uploadProgress.current / uploadProgress.total) * 100}%`,
                }}
              />
            </div>
            <p className="text-xs text-text-subtle text-center">
              Chunk {uploadProgress.current} de {uploadProgress.total}
            </p>
          </div>
        )}

        {uploadState === "done" && (
          <div className="space-y-4">
            <p className="text-xs text-success text-center tracking-widest uppercase">
              Upload concluído
            </p>
            <ModalFooter>
              <Button variant="ghost" onClick={closeUpload}>
                Fechar
              </Button>
            </ModalFooter>
          </div>
        )}

        {uploadState === "error" && (
          <div className="space-y-4">
            <p className="text-xs text-error text-center tracking-widest uppercase">
              Erro no upload
            </p>
            <ModalFooter>
              <Button variant="ghost" onClick={closeUpload}>
                Fechar
              </Button>
              <Button onClick={handleUpload}>Tentar novamente</Button>
            </ModalFooter>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteMovieId}
        title="Remover filme"
        message="Tem certeza que deseja remover este filme? Esta ação não pode ser desfeita."
        confirmLabel="Remover"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate(deleteMovieId!)}
        onCancel={() => setDeleteMovieId(null)}
      />

      {/* Modal busca TMDB */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} size="lg">
        {step === "search" && (
          <>
            <ModalTitle>Buscar filme</ModalTitle>
            <FormInput
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Digite o nome do filme..."
            />
            <div className="max-h-72 overflow-y-auto space-y-1">
              {searching && (
                <p className="text-xs text-text-subtle text-center py-4">
                  Buscando...
                </p>
              )}
              {!searching &&
                tmdbResults.map((movie) => (
                  <button
                    key={movie.id}
                    onClick={() => selectMovie(movie)}
                    className="flex cursor-pointer items-center gap-3 w-full px-3 py-2 rounded hover:bg-surface-input transition-colors text-left"
                  >
                    {movie.poster_path ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`}
                        alt={movie.title}
                        className="w-8 h-12 object-cover rounded opacity-80 shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-12 bg-surface-input rounded shrink-0" />
                    )}
                    <div>
                      <p className="text-xs text-text">{movie.title}</p>
                      <p className="text-xs text-text-subtle">
                        {movie.release_date?.slice(0, 4)} · ID {movie.id}
                      </p>
                    </div>
                  </button>
                ))}
              {!searching && query && tmdbResults.length === 0 && (
                <p className="text-xs text-text-subtle text-center py-4">
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

        {step === "confirm" && selected && (
          <>
            <ModalTitle>Confirmar cadastro</ModalTitle>
            <div className="flex items-center gap-4 p-3 bg-surface-input rounded">
              {selected.poster_path ? (
                <img
                  src={`https://image.tmdb.org/t/p/w92${selected.poster_path}`}
                  alt={selected.title}
                  className="w-10 h-14 object-cover rounded opacity-80 shrink-0"
                />
              ) : (
                <div className="w-10 h-14 bg-surface rounded shrink-0" />
              )}
              <div>
                <p className="text-xs text-text">{selected.title}</p>
                <p className="text-xs text-text-subtle">
                  {selected.release_date?.slice(0, 4)}
                </p>
                <p className="text-xs text-text-ghost mt-1">
                  TMDB ID: {selected.id}
                </p>
              </div>
            </div>
            <Field label="Categoria">
              <FormSelect
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="">Selecione...</option>
                {categories?.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </FormSelect>
            </Field>
            <div className="flex gap-3 justify-between pt-2">
              <Button variant="ghost" onClick={() => setStep("search")}>
                ← Voltar
              </Button>
              <ModalFooter>
                <Button variant="ghost" onClick={() => setModalOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={() => createMutation.mutate()}
                  disabled={!categoryId || createMutation.isPending}
                >
                  {createMutation.isPending ? "Cadastrando..." : "Cadastrar"}
                </Button>
              </ModalFooter>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
