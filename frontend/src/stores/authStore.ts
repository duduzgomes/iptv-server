import { create } from "zustand";

type Role = "SUPERADMIN" | "ADMIN";

interface AuthState {
  username: string | null;
  role: Role | null;
  setAuth: (username: string, role: Role) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  username: null,
  role: null,
  setAuth: (username, role) => set({ username, role }),
  clear: () => set({ username: null, role: null }),
}));
