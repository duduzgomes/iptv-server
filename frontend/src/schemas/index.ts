import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().min(1, "Usuário obrigatório"),
  password: z.string().min(1, "Senha obrigatória"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const categorySchema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  contentType: z.enum(["LIVE", "VOD", "SERIES"], { error: "Tipo obrigatório" }),
});

export type CategoryFormData = z.infer<typeof categorySchema>;

const coerceNumber = (min: number, msg: string) =>
  z.string().transform(Number).pipe(z.number().min(min, msg));

export const userSchema = z.object({
  maxConnections: coerceNumber(1, "Mínimo 1 conexão"),
  validadeDias: coerceNumber(1, "Mínimo 1 dia"),
});

export const renovarSchema = z.object({
  dias: coerceNumber(1, "Mínimo 1 dia"),
});

export type UserFormData = z.output<typeof userSchema>;
export type RenovarFormData = z.output<typeof renovarSchema>;
