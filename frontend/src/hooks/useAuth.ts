import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../stores/authStore";
import client from "../api/client";

export function useAuth() {
  const { username, role, setAuth } = useAuthStore();

  const { isLoading } = useQuery({
    queryKey: ["auth-me"],
    queryFn: async () => {
      const { data } = await client.get("/auth/me");
      setAuth(data.username, data.role);
      return data;
    },
    enabled: !username,
    staleTime: Infinity,
    retry: false,
  });

  return { username, role, isLoading };
}
