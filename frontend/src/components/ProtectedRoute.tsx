import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export function ProtectedRoute({ requiredRole }: { requiredRole?: string }) {
  const { username, role, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <span className="animate-pulse text-muted-foreground">
          Verificando sessão...
        </span>
      </div>
    );
  }

  if (!username) return <Navigate to="/login" replace />;
  if (requiredRole && role !== requiredRole) return <Navigate to="/" replace />;

  return <Outlet />;
}
