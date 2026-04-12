import type { Movie } from "../types";
import client from "./client";

export const moviesApi = {
  list: () => client.get<Movie[]>("/admin/movies").then((r) => r.data),

  create: (data: { categoryId: number; tmdbId: number }) =>
    client.post<Movie>("/admin/movies", data).then((r) => r.data),

  toggleStatus: (id: number) =>
    client.patch(`/admin/movies/${id}/status`).then((r) => r.data),

  sincronizar: (id: number) =>
    client.patch(`/admin/movies/${id}/sincronizar`).then((r) => r.data),

  remove: (id: number) =>
    client.delete(`/admin/movies/${id}`).then((r) => r.data),

  getStreamUrl: (id: number) =>
    client.get<{ url: string }>(`/admin/movies/${id}/stream-url`).then((r) => r.data.url),
};
