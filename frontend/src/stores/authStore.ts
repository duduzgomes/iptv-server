import { create } from "zustand";

interface AuthState {
  username: string | null;
  role: string | null;
  setAuth: (username: string, role: string) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  username: null,
  role: null,
  setAuth: (username, role) => set({ username, role }),
  clear: () => set({ username: null, role: null }),
}));
