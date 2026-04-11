import { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ChevronDown, Plus, Upload } from "lucide-react";
import { toast } from "sonner";
import { seriesApi } from "../api/series";
import { uploadApi } from "../api/upload";
import { Button } from "../ui/button";
import { Modal, ModalFooter } from "../ui/modal";
import { AddEpisodesModal } from "../components/add-episodes-modal";
import type { SeriesInfoDTO } from "../types";
import { formatDuration } from "../helpers/format-duration";

export function SeriesDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const seriesId = Number(id);

  const { data, isLoading } = useQuery<SeriesInfoDTO>({
    queryKey: ["series-detail", seriesId],
    queryFn: () => seriesApi.get(seriesId),
    enabled: !!seriesId,
  });

  const seasons = data
    ? Object.keys(data.temporadas).sort((a, b) => Number(a) - Number(b))
    : [];

  const [selectedSeason, setSelectedSeason] = useState<string | null>(null);
  const [seasonMenuOpen, setSeasonMenuOpen] = useState(false);
  const [addEpisodesOpen, setAddEpisodesOpen] = useState(false);

  type UploadState = "idle" | "uploading" | "done" | "error";
  const [uploadEpisode, setUploadEpisode] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [uploadProgress, setUploadProgress] = useState({
    current: 0,
    total: 0,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeSeason = selectedSeason ?? seasons[0] ?? null;
  const episodes =
    activeSeason && data ? (data.temporadas[activeSeason] ?? []) : [];

  function openUpload(ep: { id: string; title: string }) {
    setUploadEpisode(ep);
    setUploadFile(null);
    setUploadState("idle");
    setUploadProgress({ current: 0, total: 0 });
  }

  function closeUpload() {
    if (uploadState === "uploading") return;
    setUploadEpisode(null);
  }

  async function handleUpload() {
    if (!uploadFile || !uploadEpisode) return;
    const totalChunks = uploadApi.calcularChunks(uploadFile);
    setUploadState("uploading");
    setUploadProgress({ current: 0, total: totalChunks });
    try {
      const { uploadId, urls } = await uploadApi.iniciarEpisodio(
        Number(uploadEpisode.id),
        totalChunks,
      );
      const etags: string[] = [];
      for (let i = 0; i < totalChunks; i++) {
        const chunk = uploadApi.getChunk(uploadFile, i);
        const etag = await uploadApi.enviarChunk(urls[i], chunk);
        etags.push(etag);
        setUploadProgress({ current: i + 1, total: totalChunks });
      }
      await uploadApi.concluirEpisodio(
        Number(uploadEpisode.id),
        uploadId,
        etags,
      );
      setUploadState("done");
      toast.success("Upload concluído — processando transcodificação");
    } catch {
      setUploadState("error");
      toast.error("Erro durante o upload");
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-text-muted animate-pulse">Carregando...</p>
      </div>
    );
  }

  if (!data) return null;

  const { info } = data;
  const releaseYear = info.release_date?.slice(0, 4) ?? "—";

  const backdrop = info.backdrop_path?.[0]
    ? `https://image.tmdb.org/t/p/w1280${info.backdrop_path[0]}`
    : null;

  return (
    <div className="space-y-4">
      {/* Hero — backdrop cobre até o seletor de temporada */}
      <div className="relative -mx-8 px-8 pt-8 pb-8 ">
        {/* Imagem de fundo */}
        {backdrop && (
          <>
            <div className="absolute inset-0 bg-linear-to-b from-bg/10 via-bg/50 to-bg pointer-events-none" />
            <img
              src={backdrop}
              alt=""
              aria-hidden
              className="absolute inset-0 w-full h-full object-cover object-top pointer-events-none select-none opacity-25"
            />
            {/* fade superior — vindo do header */}
            <div className="absolute inset-0 bg-linear-to-b from-bg via-transparent to-transparent pointer-events-none" />
            {/* fade lateral */}
            <div className="absolute inset-0 bg-linear-to-r from-bg via-transparent to-bg pointer-events-none" />
            {/* fade inferior — dissolve até o bg na altura do label */}
            <div className="absolute inset-0 bg-linear-to-b from-transparent via-bg/50 to-bg pointer-events-none" />
          </>
        )}

        {/* Voltar */}
        <button
          onClick={() => navigate("/series")}
          className="relative flex items-center gap-2 text-base mb-6 text-text-muted hover:text-text transition-colors"
        >
          <ArrowLeft size={32} />
          Voltar
        </button>

        {/* Título */}
        <div className="relative flex items-center justify-between space-y-4 gap-4">
          <h1 className="text-2xl font-bold text-text-strong">{info.name}</h1>
          <Button
            variant="default"
            size="lg"
            onClick={() => setAddEpisodesOpen(true)}
          >
            <Plus />
            Cadastrar episódios
          </Button>
        </div>

        {/* Poster + informações */}
        <div className="relative flex gap-10">
          {/* Poster */}
          {info.cover ? (
            <img
              src={info.cover}
              alt={info.name}
              className="w-52 object-cover border border-border rounded-md shrink-0"
            />
          ) : (
            <div className="w-52 bg-surface rounded-xl shrink-0" />
          )}

          {/* Informações */}
          <div className="flex flex-col gap-4 pt-1 flex-1">
            <div className="flex flex-wrap gap-x-16 gap-y-3">
              <div>
                <p className="text-sm font-semibold text-text">
                  Data de Lançamento
                </p>
                <p className="text-sm text-text-muted">{releaseYear}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-text">Gênero</p>
                <p className="text-sm text-text-muted">{info.genre ?? "—"}</p>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-text">Diretor</p>
              <p className="text-sm text-text-muted">{info.director ?? "—"}</p>
            </div>

            {info.cast && (
              <div>
                <p className="text-sm font-semibold text-text">Elenco</p>
                <p className="text-sm text-text-muted">{info.cast}</p>
              </div>
            )}

            {info.plot && (
              <div className="max-w-2xl">
                <p className="text-sm font-semibold text-text">Sinopse</p>
                <p className="text-sm text-text-muted leading-relaxed">
                  {info.plot}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Seletor de temporada */}
      <div className="relative inline-block">
        <button
          onClick={() => setSeasonMenuOpen((v) => !v)}
          className="flex items-center gap-4 text-xl font-bold text-text-strong hover:text-text transition-colors"
        >
          Temporada {activeSeason ?? "1"}
          <ChevronDown className="size-5 text-text-muted" />
        </button>

        {seasonMenuOpen && seasons.length > 0 && (
          <div className="absolute top-full left-0 mt-1 bg-surface border border-border rounded shadow-lg z-10 min-w-40">
            {seasons.map((s) => (
              <button
                key={s}
                onClick={() => {
                  setSelectedSeason(s);
                  setSeasonMenuOpen(false);
                }}
                className={`w-full text-left px-4 py-2 text-sm transition-colors hover:bg-surface-raised ${
                  s === activeSeason ? "text-primary font-medium" : "text-text"
                }`}
              >
                Temporada {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lista de episódios */}
      <div className="space-y-2">
        {episodes.length === 0 ? (
          <p className="text-sm text-text-muted">
            Nenhum episódio encontrado para esta temporada.
          </p>
        ) : (
          episodes.map((ep) => (
            <div key={ep.id} className="flex items-start p-2 gap-2">
              {/* Thumbnail */}
              {ep.info?.movie_image ? (
                <img
                  src={ep.info.movie_image}
                  alt={ep.title}
                  className="w-56 object-cover border border-border rounded shrink-0"
                />
              ) : (
                <div className="w-52 bg-surface rounded shrink-0" />
              )}

              {/* Infos do episódio */}
              <div className="flex flex-col gap-1.5  self-stretch justify-between p-2 flex-1 min-w-0">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-base font-bold text-text-strong truncate">
                    {ep.title}
                  </p>
                  <p className="text-sm text-text-muted shrink-0">
                    {formatDuration(ep.info?.duration)}
                  </p>
                </div>

                {ep.info?.plot && (
                  <p className="text-sm text-text-muted leading-relaxed line-clamp-3">
                    {ep.info.plot}
                  </p>
                )}

                <Button
                  variant="primary"
                  size="md"
                  className="w-fit"
                  onClick={() => openUpload({ id: ep.id, title: ep.title })}
                >
                  <Upload />
                  Upload
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de cadastro de episódios */}
      <AddEpisodesModal
        open={addEpisodesOpen}
        onClose={() => setAddEpisodesOpen(false)}
        seriesId={seriesId}
      />

      {/* Modal de upload */}
      <Modal
        open={!!uploadEpisode}
        onClose={closeUpload}
        title="Upload"
        size="sm"
      >
        <p className="text-xs text-text-subtle">{uploadEpisode?.title}</p>

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
    </div>
  );
}
