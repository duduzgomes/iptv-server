import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import client from "../api/client";
import { useAuthStore } from "../stores/authStore";
import { loginSchema } from "../schemas";
import type { LoginFormData } from "../schemas";
import { Field, FormInput } from "../ui/form-field";
import { Button } from "../ui/button";

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      const res = await client.post("/auth/login", data);
      const { username, role } = res.data;
      setAuth(username, role);
      navigate("/");
    } catch {
      toast.error("Usuário ou senha inválidos");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-deepest">
      <div className="w-full max-w-xs px-4">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-surface border border-border-subtle rounded p-8 flex flex-col gap-6"
        >
          <div className="flex flex-col gap-1">
            <span className="text-xs tracking-widest uppercase text-text-subtle">
              painel de controle
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-primary tracking-tight">
                IPTV
              </span>
              <span className="text-xs tracking-widest uppercase text-text-muted">
                admin
              </span>
            </div>
          </div>

          <div className="h-px bg-border-subtle" />

          <div className="flex flex-col gap-4">
            <Field label="identificador" error={errors.username?.message}>
              <FormInput
                {...register("username")}
                placeholder="—"
                autoComplete="username"
              />
            </Field>

            <Field label="senha" error={errors.password?.message}>
              <FormInput
                {...register("password")}
                type="password"
                placeholder="—"
                autoComplete="current-password"
              />
            </Field>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? "aguardando..." : "autenticar"}
          </Button>

          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-success shrink-0" />
            <span className="text-xs text-text-subtle tracking-widest uppercase">
              sistema online
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}
