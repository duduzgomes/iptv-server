import client from "./client";

interface IniciarResponse {
  uploadId: string;
  urls: string[];
}

const CHUNK_SIZE = 10 * 1024 * 1024;

export const uploadApi = {
  iniciar: (movieId: number, totalChunks: number) =>
    client
      .post<IniciarResponse>(`/admin/upload/movies/${movieId}/iniciar`, null, {
        params: { totalChunks },
      })
      .then((r) => r.data),

  concluir: (movieId: number, uploadId: string, etags: string[]) =>
    client.post(`/admin/upload/movies/${movieId}/concluir`, {
      uploadId,
      etags,
    }),

  iniciarEpisodio: (episodeId: number, totalChunks: number) =>
    client
      .post<IniciarResponse>(
        `/admin/upload/episodes/${episodeId}/iniciar`,
        null,
        { params: { totalChunks } },
      )
      .then((r) => r.data),

  concluirEpisodio: (episodeId: number, uploadId: string, etags: string[]) =>
    client.post(`/admin/upload/episodes/${episodeId}/concluir`, {
      uploadId,
      etags,
    }),

  enviarChunk: async (url: string, chunk: Blob): Promise<string> => {
    const res = await fetch(url, {
      method: "PUT",
      body: chunk,
      headers: { "Content-Type": "video/mp4" },
    });
    if (!res.ok) throw new Error(`Chunk falhou: ${res.status}`);
    const etag = res.headers.get("ETag");
    if (!etag) throw new Error("ETag não retornado pelo MinIO");
    return etag.replace(/"/g, "");
  },

  calcularChunks: (file: File) => Math.ceil(file.size / CHUNK_SIZE),

  getChunk: (file: File, index: number): Blob =>
    file.slice(index * CHUNK_SIZE, (index + 1) * CHUNK_SIZE),
};
