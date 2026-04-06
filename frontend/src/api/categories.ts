import type { Category } from "../types";
import client from "./client";

export const categoriesApi = {
  list: (type?: string) =>
    client
      .get<Category[]>("/admin/categories", { params: type ? { type } : {} })
      .then((r) => r.data),

  create: (data: { name: string; type: string }) =>
    client.post<Category>("/admin/categories", data).then((r) => r.data),

  update: (id: number, data: { name: string }) =>
    client.put<Category>(`/admin/categories/${id}`, data).then((r) => r.data),

  toggleStatus: (id: number) =>
    client.patch(`/admin/categories/${id}/status`).then((r) => r.data),

  remove: (id: number) =>
    client.delete(`/admin/categories/${id}`).then((r) => r.data),
};
