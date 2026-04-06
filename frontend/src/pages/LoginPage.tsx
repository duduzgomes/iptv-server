import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import client from "../api/client";
import { useAuthStore } from "../stores/authStore";
import { loginSchema } from "../schemas";
import type { LoginFormData } from "../schemas";

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
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-gray-900 p-8 rounded-xl w-full max-w-sm flex flex-col gap-4"
      >
        <h1 className="text-white text-2xl font-bold text-center">
          IPTV Admin
        </h1>

        <div className="flex flex-col gap-1">
          <input
            {...register("username")}
            placeholder="Usuário"
            className="bg-gray-800 text-white rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {errors.username && (
            <span className="text-red-400 text-sm">
              {errors.username.message}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <input
            {...register("password")}
            type="password"
            placeholder="Senha"
            className="bg-gray-800 text-white rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {errors.password && (
            <span className="text-red-400 text-sm">
              {errors.password.message}
            </span>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-2 rounded-lg transition-colors"
        >
          {isSubmitting ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
