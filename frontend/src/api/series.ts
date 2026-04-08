import api from "./client";
import type { Series, SeriesInfoDTO } from "../types";

export const seriesApi = {
  list: (): Promise<Series[]> => api.get("/admin/series").then((r) => r.data),

  get: (id: number): Promise<SeriesInfoDTO> =>
    api.get(`/admin/series/${id}`).then((r) => r.data),

  create: (body: { categoryId: number; tmdbId: number }): Promise<Series> =>
    api.post("/admin/series", body).then((r) => r.data),

  toggleStatus: (id: number, active: boolean): Promise<void> =>
    api.patch(`/admin/series/${id}/status`, null, { params: { active } }),

  sync: (id: number): Promise<Series> =>
    api.patch(`/admin/series/${id}/sincronizar`).then((r) => r.data),

  delete: (id: number): Promise<void> => api.delete(`/admin/series/${id}`),
};
