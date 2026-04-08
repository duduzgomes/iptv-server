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
