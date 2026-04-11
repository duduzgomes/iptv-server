import type { User, PageResponse } from "../types";
import client from "./client";

export const usersApi = {
  list: (page = 0, size = 10) =>
    client
      .get<PageResponse<User>>("/admin/users", {
        params: { page, size, sort: "createdAt,desc" },
      })
      .then((r) => r.data),

  create: (data: { maxConnections: number; validadeDias: number }) =>
    client.post<User>("/admin/users", data).then((r) => r.data),

  update: (
    id: number,
    data: { maxConnections: number; validadeDias: number },
  ) => client.put<User>(`/admin/users/${id}`, data).then((r) => r.data),

  toggleStatus: (id: number, active: boolean) =>
    client
      .patch(`/admin/users/${id}/status`, null, { params: { active } })
      .then((r) => r.data),

  remove: (id: number) =>
    client.delete(`/admin/users/${id}`).then((r) => r.data),
};
