import { useState } from "react";
import { Upload, Play } from "lucide-react";
import { toast } from "sonner";
import type { Movie } from "../types";
import { Modal } from "../ui/modal";
import { Button } from "../ui/button";
import { formatDuration } from "../helpers/format-duration";
import { moviesApi } from "../api/movies";
import { VideoPlayerModal } from "./video-player-modal";

interface InfoRowProps {
  label: string;
  children: React.ReactNode;
}

interface MovieDetailModalProps {
  movie: Movie | null;
  onClose: () => void;
  onUpload: (movie: Movie) => void;
}

function InfoRow({ label, children }: InfoRowProps) {
  return (
    <div className="flex gap-3">
      <span className="text-sm text-text-strong  w-28 shrink-0">{label}</span>
      <span className="text-sm text-text-muted font-normal">{children}</span>
    </div>
  );
}

export function MovieDetailModal({
  movie,
  onClose,
  onUpload,
}: MovieDetailModalProps) {
  const [playerOpen, setPlayerOpen] = useState(false);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [loadingStream, setLoadingStream] = useState(false);

  if (!movie) return null;

  const canWatch = movie.vodStatus === "READY";

  async function handleWatch() {
    if (!movie) return;
    setLoadingStream(true);
    try {
      const url = await moviesApi.getStreamUrl(movie.id);
      setStreamUrl(url);
      setPlayerOpen(true);
    } catch {
      toast.error("Não foi possível obter a URL do vídeo.");
    } finally {
      setLoadingStream(false);
    }
  }

  return (
    <Modal open={!!movie} onClose={onClose} size="xl">
      <div className="flex flex-col gap-5">
        {/* Linha 1: Poster + Metadados */}
        <div className="flex gap-6">
          {/* Poster */}
          <div className="shrink-0">
            {movie.posterUrl ? (
              <img
                src={movie.posterUrl}
                alt={movie.title}
                className="w-48 object-cover border border-border rounded-md"
              />
            ) : (
              <div className="w-48 h-64 bg-surface-input rounded-lg flex items-center justify-center">
                <span className="text-text-ghost text-xs text-center px-2">
                  Sem poster
                </span>
              </div>
            )}
          </div>

          {/* Metadados */}
          <div className="flex-1 flex flex-col gap-5 min-w-0">
            <div>
              <h2 className="text-text-strong font-bold text-base leading-snug">
                {movie.title}
              </h2>
              {movie.originalTitle && movie.originalTitle !== movie.title && (
                <p className="text-text-subtle text-sm mt-1">
                  {movie.originalTitle}
                </p>
              )}
            </div>

            <div className="space-y-2.5">
              <InfoRow label="Ano">{movie.year || "—"}</InfoRow>
              <InfoRow label="Gênero">{movie.genre || "—"}</InfoRow>
              <InfoRow label="Duração">
                {formatDuration(movie.duration)}
              </InfoRow>
              <InfoRow label="Avaliação">
                {movie.rating ? `${movie.rating} / 10` : "—"}
              </InfoRow>
              <InfoRow label="Diretor">{movie.director || "—"}</InfoRow>
              <InfoRow label="Elenco">{movie.castMembers || "—"}</InfoRow>
            </div>
          </div>
        </div>

        {/* Linha 2: Sinopse */}
        {movie.synopsis && (
          <div className="space-y-1.5">
            <p className="text-sm text-text-strong font-medium">Sinopse</p>
            <p className="text-sm text-text-muted leading-relaxed text-justify">
              {movie.synopsis}
            </p>
          </div>
        )}

        {/* Ações */}
        <div className="flex gap-3 self-end">
          {canWatch && (
            <Button variant="primary" onClick={handleWatch} disabled={loadingStream}>
              <Play />
              {loadingStream ? "Carregando..." : "Assistir"}
            </Button>
          )}
          <Button
            variant="default"
            onClick={() => {
              onClose();
              onUpload(movie);
            }}
          >
            <Upload />
            Upload
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>

      {streamUrl && (
        <VideoPlayerModal
          open={playerOpen}
          onClose={() => setPlayerOpen(false)}
          src={streamUrl}
          title={movie.title}
        />
      )}
    </Modal>
  );
}
