import type { ChannelFormData } from "../schemas";
import type { Channel } from "../types";
import api from "./client";

export const getChannels = async (): Promise<Channel[]> => {
  const { data } = await api.get("/admin/channels");
  return data;
};

export const createChannel = async (
  body: ChannelFormData,
): Promise<Channel> => {
  const { data } = await api.post("/admin/channels", body);
  return data;
};

export const updateChannel = async (
  id: number,
  body: Omit<ChannelFormData, "categoryId" | "streamKey">,
): Promise<Channel> => {
  const { data } = await api.put(`/admin/channels/${id}`, body);
  return data;
};

export const toggleChannelStatus = async (
  id: number,
  active: boolean,
): Promise<void> => {
  await api.patch(`/admin/channels/${id}/status`, null, { params: { active } });
};

export const deleteChannel = async (id: number): Promise<void> => {
  await api.delete(`/admin/channels/${id}`);
};
