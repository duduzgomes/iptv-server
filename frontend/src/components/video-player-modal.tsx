import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { X, AlertCircle, Loader2 } from "lucide-react";
import { twMerge } from "tailwind-merge";

interface VideoPlayerModalProps {
  open: boolean;
  onClose: () => void;
  src: string;
  title?: string;
}

type PlayerState = "loading" | "playing" | "error";

function isHlsUrl(url: string) {
  return url.includes(".m3u8") || url.includes("hls");
}

export function VideoPlayerModal({
  open,
  onClose,
  src,
  title,
}: VideoPlayerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [state, setState] = useState<PlayerState>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !src) return;

    const video = videoRef.current;
    if (!video) return;

    setState("loading");
    setErrorMessage(null);

    function onCanPlay() {
      setState("playing");
    }

    function onError() {
      setState("error");
      setErrorMessage("Não foi possível reproduzir o vídeo.");
    }

    video.addEventListener("canplay", onCanPlay);
    video.addEventListener("error", onError);

    if (isHlsUrl(src)) {
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: false,
        });
        hlsRef.current = hls;

        hls.loadSource(src);
        hls.attachMedia(video);

        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) {
            setState("error");
            setErrorMessage(
              [
                Hls.ErrorDetails.MANIFEST_LOAD_ERROR,
                Hls.ErrorDetails.MANIFEST_LOAD_TIMEOUT,
                Hls.ErrorDetails.LEVEL_LOAD_ERROR,
                Hls.ErrorDetails.FRAG_LOAD_ERROR,
                Hls.ErrorDetails.FRAG_LOAD_TIMEOUT,
              ].includes(data.details)
                ? "Erro de rede ao carregar o stream HLS."
                : "Erro ao reproduzir o stream HLS.",
            );
          }
        });
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        // Safari — HLS nativo
        video.src = src;
      } else {
        setState("error");
        setErrorMessage("Seu navegador não suporta reprodução HLS.");
      }
    } else {
      // MP4 / stream progressivo
      video.src = src;
    }

    return () => {
      video.removeEventListener("canplay", onCanPlay);
      video.removeEventListener("error", onError);

      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }

      video.pause();
      video.removeAttribute("src");
      video.load();
    };
  }, [open, src]);

  useEffect(() => {
    if (!open) {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      const video = videoRef.current;
      if (video) {
        video.pause();
        video.removeAttribute("src");
        video.load();
      }
      setState("loading");
      setErrorMessage(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      data-slot="video-player-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        data-slot="video-player-modal"
        className="relative w-full max-w-4xl mx-4 rounded overflow-hidden bg-black border border-border-subtle shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-surface border-b border-border-subtle">
          <span className="text-sm font-medium text-text truncate pr-4">
            {title ?? "Reprodutor"}
          </span>
          <button
            type="button"
            data-slot="close-button"
            aria-label="Fechar player"
            onClick={onClose}
            className="shrink-0 rounded p-1 text-text-muted transition-colors hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Player area */}
        <div className="relative aspect-video w-full bg-black">
          {/* Video */}
          <video
            ref={videoRef}
            data-slot="video"
            controls
            autoPlay
            playsInline
            className={twMerge(
              "absolute inset-0 w-full h-full",
              state !== "playing" && "invisible",
            )}
          />

          {/* Loading overlay */}
          {state === "loading" && (
            <div
              data-slot="loading-overlay"
              className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-text-muted"
            >
              <Loader2 className="size-8 animate-spin text-primary" />
              <span className="text-sm">Carregando vídeo...</span>
            </div>
          )}

          {/* Error overlay */}
          {state === "error" && (
            <div
              data-slot="error-overlay"
              className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center"
            >
              <AlertCircle className="size-8 text-error" />
              <p className="text-sm text-text-muted">
                {errorMessage ?? "Ocorreu um erro ao reproduzir o vídeo."}
              </p>
            </div>
          )}
        </div>

        {/* Source type badge */}
        <div className="flex items-center gap-2 px-4 py-2 bg-surface border-t border-border-subtle">
          <span className="text-xs text-text-subtle font-mono truncate flex-1">
            {src}
          </span>
          <span className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-surface-input text-text-muted border border-border-subtle">
            {isHlsUrl(src) ? "HLS" : "MP4"}
          </span>
        </div>
      </div>
    </div>
  );
}
