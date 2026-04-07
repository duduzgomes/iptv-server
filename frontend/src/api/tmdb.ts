const TMDB_KEY = import.meta.env.VITE_TMDB_API_KEY;
const TMDB_BASE = "https://api.themoviedb.org/3";

export interface TmdbMovie {
  id: number;
  title: string;
  original_title: string;
  poster_path: string | null;
  release_date: string;
}

export const tmdbApi = {
  search: async (query: string): Promise<TmdbMovie[]> => {
    if (!query.trim()) return [];
    const res = await fetch(
      `${TMDB_BASE}/search/movie?query=${encodeURIComponent(query)}&language=pt-BR&api_key=${TMDB_KEY}`,
    );
    const data = await res.json();
    return data.results ?? [];
  },
};
