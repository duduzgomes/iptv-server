import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().min(1, "Usuário obrigatório"),
  password: z.string().min(1, "Senha obrigatória"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const categorySchema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  type: z.enum(["LIVE", "VOD", "SERIES"], { error: "Tipo obrigatório" }),
});

export type CategoryFormData = z.infer<typeof categorySchema>;
