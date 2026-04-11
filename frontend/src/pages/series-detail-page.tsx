import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft, ChevronDown, Upload } from "lucide-react";
import { toast } from "sonner";
import { seriesApi } from "../api/series";
import { Button } from "../ui/button";
import { FormInput } from "../ui/form-field";
import { Modal, ModalFooter, ModalTitle } from "../ui/modal";
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
  const [uploadEpisodeId, setUploadEpisodeId] = useState<string | null>(null);
  const [filePath, setFilePath] = useState("");

  const activeSeason = selectedSeason ?? seasons[0] ?? null;
  const episodes =
    activeSeason && data ? (data.temporadas[activeSeason] ?? []) : [];

  const associateMut = useMutation({
    mutationFn: ({ episodeId, path }: { episodeId: string; path: string }) =>
      seriesApi.associateFile(Number(episodeId), path),
    onSuccess: () => {
      toast.success("Arquivo associado com sucesso");
      setUploadEpisodeId(null);
      setFilePath("");
    },
    onError: () => toast.error("Erro ao associar arquivo"),
  });

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

  return (
    <div className="space-y-8">
      {/* Voltar */}
      <button
        onClick={() => navigate("/series")}
        className="flex items-center gap-2 text-base text-text-muted hover:text-text transition-colors"
      >
        <ArrowLeft size={32} />
        Voltar
      </button>

      {/* Título */}
      <h1 className="text-2xl font-bold text-text-strong">{info.name}</h1>

      {/* Poster + informações */}
      <div className="flex gap-10">
        {/* Poster */}
        {info.cover ? (
          <img
            src={info.cover}
            alt={info.name}
            className="w-52 object-cover rounded-xl shrink-0"
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
      <div className="space-y-4">
        {episodes.length === 0 ? (
          <p className="text-sm text-text-muted">
            Nenhum episódio encontrado para esta temporada.
          </p>
        ) : (
          episodes.map((ep) => (
            <div key={ep.id} className="flex items-center gap-5">
              {/* Thumbnail */}
              {ep.info?.movie_image ? (
                <img
                  src={ep.info.movie_image}
                  alt={ep.title}
                  className="w-48  object-cover rounded shrink-0"
                />
              ) : (
                <div className="w-42 bg-surface rounded shrink-0" />
              )}

              {/* Infos do episódio */}
              <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-base font-bold text-text-strong truncate">
                    {ep.title}
                  </p>
                  <p className="text-sm text-text-muted shrink-0">
                    {formatDuration(ep.info?.duration)}
                  </p>
                </div>

                {ep.info?.plot && (
                  <p className="text-sm text-text leading-relaxed line-clamp-3">
                    {ep.info.plot}
                  </p>
                )}

                <Button
                  variant="primary"
                  size="md"
                  className="w-fit "
                  onClick={() => {
                    setUploadEpisodeId(ep.id);
                    setFilePath("");
                  }}
                >
                  <Upload />
                  Upload
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de upload */}
      <Modal
        open={!!uploadEpisodeId}
        onClose={() => setUploadEpisodeId(null)}
        size="lg"
      >
        <ModalTitle>Associar arquivo</ModalTitle>
        <FormInput
          autoFocus
          value={filePath}
          onChange={(e) => setFilePath(e.target.value)}
          placeholder="/caminho/para/episodio.mp4"
        />
        <ModalFooter className="justify-end">
          <Button variant="ghost" onClick={() => setUploadEpisodeId(null)}>
            Cancelar
          </Button>
          <Button
            onClick={() =>
              associateMut.mutate({
                episodeId: uploadEpisodeId!,
                path: filePath,
              })
            }
            disabled={!filePath.trim() || associateMut.isPending}
          >
            {associateMut.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
