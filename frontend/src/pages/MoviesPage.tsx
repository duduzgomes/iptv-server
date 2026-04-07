import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2, Power, RefreshCw, Upload } from "lucide-react";
import { moviesApi } from "../api/movies";
import { tmdbApi, type TmdbMovie } from "../api/tmdb";
import { categoriesApi } from "../api/categories";
import { PageSkeleton } from "../ui/PageSkeleton";
import { uploadApi } from "../api/upload";
import type { Movie } from "../types";

const vodStatusLabel: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Pendente", color: "text-[#444]" },
  UPLOADING: { label: "Enviando", color: "text-blue-400" },
  PROCESSING: { label: "Processando", color: "text-yellow-500" },
  READY: { label: "Pronto", color: "text-emerald-500" },
  ERROR: { label: "Erro", color: "text-red-500" },
};

type Step = "search" | "confirm";

export function MoviesPage() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);

  // Etapa do modal
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

  // --- Query filmes ---
  const { data, isLoading } = useQuery({
    queryKey: ["movies"],
    queryFn: () => moviesApi.list(),
  });

  // --- Query categorias VOD ---
  const { data: categories } = useQuery({
    queryKey: ["categories", "VOD"],
    queryFn: () => categoriesApi.list("VOD"),
  });

  // --- Debounce busca TMDB ---
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
    } catch (err) {
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
    if (uploadState === "uploading") return; // bloqueia fechar durante upload
    setUploadMovie(null);
  }

  // --- Mutations ---
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
      invalidate();
    },
    onError: () => toast.error("Erro ao remover filme"),
  });

  const columns = ["Filme", "Categoria", "VOD", "Status", "Ações"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-sm tracking-widest uppercase text-[#666]">
          Filmes
        </h1>
        <button
          onClick={openModal}
          className="text-[10px] tracking-widest uppercase border border-[#1f1f1f] px-3 py-1.5 rounded hover:border-[#333] transition-colors"
        >
          + Novo
        </button>
      </div>

      {/* Tabela */}
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
              {data?.map((movie) => {
                const vod = vodStatusLabel[movie.vodStatus];
                return (
                  <tr
                    key={movie.id}
                    className="border-b border-[#141414] hover:bg-[#0f0f0f] transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {movie.posterUrl ? (
                          <img
                            src={movie.posterUrl}
                            alt={movie.title}
                            className="w-8 h-12 object-cover rounded opacity-80"
                          />
                        ) : (
                          <div className="w-8 h-12 bg-[#141414] rounded" />
                        )}
                        <div>
                          <p className="text-[#ccc]">{movie.title}</p>
                          <p className="text-[#444] text-[10px]">
                            {movie.year}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[#555]">
                      {movie.category.name}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] tracking-widest uppercase ${vod.color}`}
                      >
                        {vod.label}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] tracking-widest uppercase ${movie.active ? "text-emerald-500" : "text-[#444]"}`}
                      >
                        {movie.active ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-3">
                        <button
                          onClick={() => sincronizarMutation.mutate(movie.id)}
                          className="text-[#444] hover:text-blue-400 transition-colors"
                          title="Sincronizar TMDB"
                        >
                          <RefreshCw size={13} />
                        </button>
                        <button
                          onClick={() => toggleMutation.mutate(movie.id)}
                          className="text-[#444] hover:text-emerald-500 transition-colors"
                          title="Ativar/Desativar"
                        >
                          <Power size={13} />
                        </button>
                        <button
                          onClick={() => openUpload(movie)}
                          className="text-[#444] hover:text-yellow-500 transition-colors"
                          title="Upload"
                        >
                          <Upload size={13} />
                        </button>
                        <button
                          onClick={() => deleteMutation.mutate(movie.id)}
                          className="text-[#444] hover:text-red-500 transition-colors"
                          title="Remover"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {uploadMovie && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[#0d0d0d] border border-[#1f1f1f] rounded p-6 w-full max-w-sm space-y-4">
            <h2 className="text-xs tracking-widest uppercase text-[#666]">
              Upload
            </h2>
            <p className="text-[10px] text-[#444]">{uploadMovie.title}</p>

            {/* Idle — seleção de arquivo */}
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
                  className="w-full border border-dashed border-[#1f1f1f] rounded px-3 py-6 text-[10px] text-[#444] hover:border-[#333] hover:text-[#666] transition-colors text-center"
                >
                  {uploadFile
                    ? uploadFile.name
                    : "Clique para selecionar o arquivo"}
                </button>
                {uploadFile && (
                  <p className="text-[10px] text-[#333] text-center">
                    {(uploadFile.size / 1024 / 1024).toFixed(1)} MB ·{" "}
                    {uploadApi.calcularChunks(uploadFile)} chunks
                  </p>
                )}
                <div className="flex gap-3 justify-end pt-2">
                  <button
                    onClick={closeUpload}
                    className="text-[10px] tracking-widest uppercase text-[#444] hover:text-[#ccc] transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleUpload}
                    disabled={!uploadFile}
                    className="text-[10px] tracking-widest uppercase border border-[#1f1f1f] px-3 py-1.5 rounded hover:border-[#333] transition-colors disabled:opacity-40"
                  >
                    Iniciar upload
                  </button>
                </div>
              </>
            )}

            {/* Uploading — progresso */}
            {uploadState === "uploading" && (
              <div className="space-y-3">
                <div className="w-full bg-[#141414] rounded-full h-1">
                  <div
                    className="bg-yellow-500 h-1 rounded-full transition-all duration-300"
                    style={{
                      width: `${(uploadProgress.current / uploadProgress.total) * 100}%`,
                    }}
                  />
                </div>
                <p className="text-[10px] text-[#444] text-center">
                  Chunk {uploadProgress.current} de {uploadProgress.total}
                </p>
              </div>
            )}

            {/* Done */}
            {uploadState === "done" && (
              <div className="space-y-4">
                <p className="text-[10px] text-emerald-500 text-center tracking-widest uppercase">
                  Upload concluído
                </p>
                <div className="flex justify-end">
                  <button
                    onClick={closeUpload}
                    className="text-[10px] tracking-widest uppercase text-[#444] hover:text-[#ccc] transition-colors"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            )}

            {/* Error */}
            {uploadState === "error" && (
              <div className="space-y-4">
                <p className="text-[10px] text-red-500 text-center tracking-widest uppercase">
                  Erro no upload
                </p>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={closeUpload}
                    className="text-[10px] tracking-widest uppercase text-[#444] hover:text-[#ccc] transition-colors"
                  >
                    Fechar
                  </button>
                  <button
                    onClick={handleUpload}
                    className="text-[10px] tracking-widest uppercase border border-[#1f1f1f] px-3 py-1.5 rounded hover:border-[#333] transition-colors"
                  >
                    Tentar novamente
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[#0d0d0d] border border-[#1f1f1f] rounded p-6 w-full max-w-lg space-y-4">
            {/* Etapa 1 — busca TMDB */}
            {step === "search" && (
              <>
                <h2 className="text-xs tracking-widest uppercase text-[#666]">
                  Buscar filme
                </h2>
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Digite o nome do filme..."
                  className="w-full bg-[#141414] border border-[#1f1f1f] rounded px-3 py-2 text-xs text-[#ccc] outline-none focus:border-[#333] placeholder:text-[#333]"
                />

                <div className="max-h-72 overflow-y-auto space-y-1">
                  {searching && (
                    <p className="text-[10px] text-[#444] text-center py-4">
                      Buscando...
                    </p>
                  )}
                  {!searching &&
                    tmdbResults.map((movie) => (
                      <button
                        key={movie.id}
                        onClick={() => selectMovie(movie)}
                        className="flex items-center gap-3 w-full px-3 py-2 rounded hover:bg-[#141414] transition-colors text-left"
                      >
                        {movie.poster_path ? (
                          <img
                            src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`}
                            alt={movie.title}
                            className="w-8 h-12 object-cover rounded opacity-80 shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-12 bg-[#141414] rounded shrink-0" />
                        )}
                        <div>
                          <p className="text-xs text-[#ccc]">{movie.title}</p>
                          <p className="text-[10px] text-[#444]">
                            {movie.release_date?.slice(0, 4)} · ID {movie.id}
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
                  <button
                    onClick={() => setModalOpen(false)}
                    className="text-[10px] tracking-widest uppercase text-[#444] hover:text-[#ccc] transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </>
            )}

            {/* Etapa 2 — confirmar + categoria */}
            {step === "confirm" && selected && (
              <>
                <h2 className="text-xs tracking-widest uppercase text-[#666]">
                  Confirmar cadastro
                </h2>

                <div className="flex items-center gap-4 p-3 bg-[#141414] rounded">
                  {selected.poster_path ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w92${selected.poster_path}`}
                      alt={selected.title}
                      className="w-10 h-14 object-cover rounded opacity-80 shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-14 bg-[#1a1a1a] rounded shrink-0" />
                  )}
                  <div>
                    <p className="text-xs text-[#ccc]">{selected.title}</p>
                    <p className="text-[10px] text-[#444]">
                      {selected.release_date?.slice(0, 4)}
                    </p>
                    <p className="text-[10px] text-[#333] mt-1">
                      TMDB ID: {selected.id}
                    </p>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] tracking-widest uppercase text-[#444]">
                    Categoria
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full bg-[#141414] border border-[#1f1f1f] rounded px-3 py-2 text-xs text-[#ccc] outline-none focus:border-[#333]"
                  >
                    <option value="">Selecione...</option>
                    {categories?.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 justify-between pt-2">
                  <button
                    onClick={() => setStep("search")}
                    className="text-[10px] tracking-widest uppercase text-[#444] hover:text-[#ccc] transition-colors"
                  >
                    ← Voltar
                  </button>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setModalOpen(false)}
                      className="text-[10px] tracking-widest uppercase text-[#444] hover:text-[#ccc] transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => createMutation.mutate()}
                      disabled={!categoryId || createMutation.isPending}
                      className="text-[10px] tracking-widest uppercase border border-[#1f1f1f] px-3 py-1.5 rounded hover:border-[#333] transition-colors disabled:opacity-40"
                    >
                      {createMutation.isPending
                        ? "Cadastrando..."
                        : "Cadastrar"}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
