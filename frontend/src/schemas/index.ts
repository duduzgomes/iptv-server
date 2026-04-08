import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().min(1, "Usuário obrigatório"),
  password: z.string().min(1, "Senha obrigatória"),
});

export const categorySchema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  contentType: z.enum(["LIVE", "VOD", "SERIES"], { error: "Tipo obrigatório" }),
});

const coerceNumber = (min: number, msg: string) =>
  z.string().transform(Number).pipe(z.number().min(min, msg));

export const userSchema = z.object({
  maxConnections: coerceNumber(1, "Mínimo 1 conexão"),
  validadeDias: coerceNumber(1, "Mínimo 1 dia"),
});

export const renovarSchema = z.object({
  dias: coerceNumber(1, "Mínimo 1 dia"),
});

export const channelSchema = z.object({
  categoryId: z.number({ error: "Categoria obrigatória" }),
  name: z.string().min(1, "Nome obrigatório"),
  logoUrl: z.string().optional(),
  sourceUrl: z.string().min(1, "URL de origem obrigatória"),
  streamKey: z.string().min(1, "Stream key obrigatória"),
  epgChannelId: z.string().optional(),
});

export const seriesSchema = z.object({
  categoryId: z.number({ error: "Categoria obrigatória" }),
  tmdbId: z.number({ error: "TMDB ID obrigatório" }),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type CategoryFormData = z.infer<typeof categorySchema>;
export type UserFormData = z.output<typeof userSchema>;
export type RenovarFormData = z.output<typeof renovarSchema>;
export type ChannelFormData = z.infer<typeof channelSchema>;
export type seriesSchema = z.infer<typeof seriesSchema>;
