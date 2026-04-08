export interface Category {
  id: number;
  name: string;
  contentType: "LIVE" | "VOD" | "SERIES";
  active: boolean;
}
export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface User {
  id: number;
  username: string;
  password: string;
  maxConnections: number;
  active: boolean;
  expiresAt: string;
  createdBy: string | null;
  createdAt: string;
}
export interface Movie {
  id: number;
  tmdbId: number;
  title: string;
  originalTitle: string;
  year: number;
  genre: string;
  posterUrl: string | null;
  rating: number;
  duration: number;
  active: boolean;
  vodStatus: "PENDING" | "UPLOADING" | "PROCESSING" | "READY" | "ERROR";
  hlsPath: string | null;
  category: Category;
  createdAt: string;
}

export interface Channel {
  id: number;
  name: string;
  logoUrl?: string;
  sourceUrl: string;
  streamKey: string;
  epgChannelId?: string;
  num: number;
  active: boolean;
  category: { id: number; name: string };
  createdAt: string;
}

export interface Series {
  id: number;
  title: string;
  posterUrl?: string;
  genre?: string;
  rating?: number;
  active: boolean;
  category: { id: number; name: string };
  updatedAt: string;
}

export interface EpisodeDTO {
  id: string;
  episode_num: number;
  title: string;
  season: number;
  info?: {
    plot?: string;
    duration?: string;
    movie_image?: string;
    release_date?: string;
  };
}

export interface SeriesInfoDTO {
  info: {
    series_id: number;
    name: string;
    cover?: string;
    genre?: string;
    rating?: string;
  };
  episodes: Record<string, EpisodeDTO[]>;
}
