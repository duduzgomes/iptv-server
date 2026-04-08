import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export function ProtectedRoute({ requiredRole }: { requiredRole?: string }) {
  const { username, role, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-4 rounded-2xl bg-zinc-900 px-10 py-8 shadow-2xl ring-1 ring-white/10">
          <div className="relative h-10 w-10">
            <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-white opacity-80" />
            <div className="absolute inset-1 animate-spin rounded-full border-2 border-transparent border-t-white/30 [animation-duration:1.5s] [animation-direction:reverse]" />
          </div>
          <span className="text-sm font-medium tracking-widest text-zinc-400 uppercase">
            Verificando sessão
          </span>
        </div>
      </div>
    );
  }

  if (!username) return <Navigate to="/login" replace />;
  if (requiredRole && role !== requiredRole) return <Navigate to="/" replace />;

  return <Outlet />;
}
