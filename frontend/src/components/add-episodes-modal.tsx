import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { twMerge } from "tailwind-merge";
import { seriesApi } from "../api/series";
import { Modal, ModalFooter, ModalTitle } from "../ui/modal";
import { Button } from "../ui/button";
import type { TmdbSeasonDetailDTO } from "../types";

interface AddEpisodesModalProps {
  open: boolean;
  onClose: () => void;
  seriesId: number;
}

function episodeKey(seasonNumber: number, episodeNumber: number) {
  return `${seasonNumber}-${episodeNumber}`;
}

const checkboxCheckmark =
  "url(\"data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='black' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z'/%3e%3c/svg%3e\")";

const checkboxDash =
  "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 16 16'%3e%3cpath stroke='black' stroke-linecap='round' stroke-width='2' d='M4 8h8'/%3e%3c/svg%3e\")";

const checkboxBase =
  "size-3.5 shrink-0 cursor-pointer appearance-none rounded-sm border border-border-subtle bg-surface-input";
const checkboxChecked =
  "checked:bg-primary checked:border-primary";

function IndeterminateCheckbox({
  checked,
  indeterminate,
  onChange,
  className,
}: {
  checked: boolean;
  indeterminate: boolean;
  onChange: () => void;
  className?: string;
}) {
  const bgImage = indeterminate
    ? checkboxDash
    : checked
      ? checkboxCheckmark
      : "none";

  return (
    <input
      type="checkbox"
      checked={checked}
      ref={(el) => {
        if (el) el.indeterminate = indeterminate;
      }}
      onChange={onChange}
      style={{ backgroundImage: bgImage }}
      className={twMerge(
        checkboxBase,
        checkboxChecked,
        "indeterminate:bg-primary indeterminate:border-primary",
        className,
      )}
    />
  );
}

export function AddEpisodesModal({
  open,
  onClose,
  seriesId,
}: AddEpisodesModalProps) {
  const [expandedSeasons, setExpandedSeasons] = useState<Set<number>>(
    new Set(),
  );
  const [selectedEpisodes, setSelectedEpisodes] = useState<Set<string>>(
    new Set(),
  );

  const queryClient = useQueryClient();

  const { data: seasons = [], isLoading } = useQuery<TmdbSeasonDetailDTO[]>({
    queryKey: ["series-seasons-tmdb", seriesId],
    queryFn: () => seriesApi.getSeasons(seriesId),
    enabled: open && !!seriesId,
  });

  const addMut = useMutation({
    mutationFn: (episodes: { seasonNumber: number; episodeNumber: number }[]) =>
      seriesApi.addEpisodes(seriesId, episodes),
    onSuccess: () => {
      toast.success("Episódios cadastrados com sucesso");
      queryClient.invalidateQueries({ queryKey: ["series-detail", seriesId] });
      handleClose();
    },
    onError: () => toast.error("Erro ao cadastrar episódios"),
  });

  function handleClose() {
    setExpandedSeasons(new Set());
    setSelectedEpisodes(new Set());
    onClose();
  }

  function toggleSeasonExpanded(seasonNumber: number) {
    setExpandedSeasons((prev) => {
      const next = new Set(prev);
      if (next.has(seasonNumber)) next.delete(seasonNumber);
      else next.add(seasonNumber);
      return next;
    });
  }

  function toggleEpisode(seasonNumber: number, episodeNumber: number) {
    const key = episodeKey(seasonNumber, episodeNumber);
    setSelectedEpisodes((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleAllInSeason(season: TmdbSeasonDetailDTO) {
    const keys = season.episodes.map((ep) =>
      episodeKey(season.season_number, ep.episode_number),
    );
    const allSelected = keys.every((k) => selectedEpisodes.has(k));
    setSelectedEpisodes((prev) => {
      const next = new Set(prev);
      if (allSelected) keys.forEach((k) => next.delete(k));
      else keys.forEach((k) => next.add(k));
      return next;
    });
  }

  function handleSubmit() {
    const episodes = Array.from(selectedEpisodes).map((key) => {
      const [seasonNumber, episodeNumber] = key.split("-").map(Number);
      return { seasonNumber, episodeNumber };
    });
    addMut.mutate(episodes);
  }

  const totalSelected = selectedEpisodes.size;

  return (
    <Modal open={open} onClose={handleClose} size="lg">
      <ModalTitle>Cadastrar episódios</ModalTitle>

      <div
        data-slot="season-list"
        className="space-y-1.5 h-96 overflow-y-auto pr-0.5"
      >
        {isLoading ? (
          <p className="py-8 text-center text-sm text-text-muted animate-pulse">
            Buscando temporadas...
          </p>
        ) : seasons.length === 0 ? (
          <p className="py-8 text-center text-sm text-text-muted">
            Nenhuma temporada encontrada no TMDB.
          </p>
        ) : (
          seasons.map((season) => {
            const isExpanded = expandedSeasons.has(season.season_number);
            const keys = season.episodes.map((ep) =>
              episodeKey(season.season_number, ep.episode_number),
            );
            const selectedCount = keys.filter((k) =>
              selectedEpisodes.has(k),
            ).length;
            const allSelected =
              keys.length > 0 && selectedCount === keys.length;
            const someSelected = selectedCount > 0 && !allSelected;

            return (
              <div
                key={season.season_number}
                data-slot="season-row"
                className="rounded border border-border-subtle overflow-hidden"
              >
                {/* Season header */}
                <div className="flex items-center gap-2.5 px-3 py-2.5 bg-surface">
                  <IndeterminateCheckbox
                    checked={allSelected}
                    indeterminate={someSelected}
                    onChange={() => toggleAllInSeason(season)}
                  />

                  <button
                    type="button"
                    data-slot="season-toggle"
                    onClick={() => toggleSeasonExpanded(season.season_number)}
                    className="flex flex-1 items-center gap-2 text-left transition-colors hover:text-text-strong focus-visible:outline-none"
                  >
                    {isExpanded ? (
                      <ChevronDown className="size-3.5 shrink-0 text-text-muted" />
                    ) : (
                      <ChevronRight className="size-3.5 shrink-0 text-text-muted" />
                    )}
                    <span className="text-sm font-semibold text-text">
                      {season.name}
                    </span>
                    <span className="text-xs text-text-subtle ml-1">
                      {season.episodes.length} ep.
                    </span>
                  </button>

                  {selectedCount > 0 && (
                    <span className="text-xs text-primary tabular-nums">
                      {selectedCount}/{season.episodes.length}
                    </span>
                  )}
                </div>

                {/* Episode list */}
                {isExpanded && season.episodes.length > 0 && (
                  <div
                    data-slot="episode-list"
                    className="divide-y divide-border-subtle border-t border-border-subtle"
                  >
                    {season.episodes.map((ep) => {
                      const key = episodeKey(
                        season.season_number,
                        ep.episode_number,
                      );
                      const isChecked = selectedEpisodes.has(key);

                      return (
                        <label
                          key={ep.id}
                          data-slot="episode-row"
                          className="flex cursor-pointer items-center gap-3 px-4 py-2 transition-colors hover:bg-surface-raised"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() =>
                              toggleEpisode(
                                season.season_number,
                                ep.episode_number,
                              )
                            }
                            style={{
                              backgroundImage: isChecked
                                ? checkboxCheckmark
                                : "none",
                            }}
                            className={twMerge(checkboxBase, checkboxChecked)}
                          />

                          <span className="w-7 shrink-0 text-xs tabular-nums text-text-muted">
                            E{ep.episode_number}
                          </span>

                          <span className="flex-1 truncate text-sm text-text">
                            {ep.name}
                          </span>

                          {ep.air_date && (
                            <span className="shrink-0 text-xs text-text-subtle">
                              {ep.air_date}
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <ModalFooter>
        <Button variant="ghost" onClick={handleClose}>
          Cancelar
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={totalSelected === 0 || addMut.isPending}
        >
          {addMut.isPending
            ? "Cadastrando..."
            : totalSelected > 0
              ? `Cadastrar ${totalSelected} ep.`
              : "Cadastrar"}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
