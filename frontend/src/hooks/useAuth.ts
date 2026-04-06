import { useAuthStore } from "../stores/authStore";

export function useAuth() {
  const { username, role } = useAuthStore();
  return {
    isAuthenticated: !!username,
    username,
    role,
    isSuperAdmin: role === "SUPERADMIN",
  };
}
