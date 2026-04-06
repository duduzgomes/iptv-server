import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  Tv,
  Film,
  Clapperboard,
  Tag,
  ShieldCheck,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useAuthStore } from "../stores/authStore";
import { useUIStore } from "../stores/uiStore";
import client from "../api/client";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/users", label: "Usuários", icon: Users },
  { to: "/channels", label: "Canais", icon: Tv },
  { to: "/movies", label: "Filmes", icon: Film },
  { to: "/series", label: "Séries", icon: Clapperboard },
  { to: "/categories", label: "Categorias", icon: Tag },
];

export function Layout() {
  const { username, role } = useAuth();
  const clear = useAuthStore((s) => s.clear);
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const navigate = useNavigate();
  const location = useLocation();

  async function handleLogout() {
    await client.post("/auth/logout").catch(() => {});
    clear();
    navigate("/login", { replace: true });
  }

  const allItems =
    role === "SUPERADMIN"
      ? [...navItems, { to: "/admins", label: "Admins", icon: ShieldCheck }]
      : navItems;

  return (
    <div className="flex h-screen bg-[#0d0d0d] text-[#e8e8e8] font-mono overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`
        flex flex-col border-r border-[#1f1f1f] transition-all duration-300 shrink-0
        ${sidebarOpen ? "w-52" : "w-14"}
      `}
      >
        {/* Logo / toggle */}
        <div className="flex items-center h-14 px-3 border-b border-[#1f1f1f]">
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded hover:bg-[#1a1a1a] transition-colors"
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          {sidebarOpen && (
            <span className="ml-3 text-sm font-bold tracking-widest uppercase text-[#e8e8e8]">
              IPTV
            </span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 space-y-0.5 px-2">
          {allItems.map(({ to, label, icon: Icon, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) => `
                flex items-center gap-3 px-2 py-2 rounded text-xs transition-colors
                ${
                  isActive
                    ? "bg-[#1a1a1a] text-white"
                    : "text-[#666] hover:text-[#ccc] hover:bg-[#161616]"
                }
              `}
            >
              <Icon size={16} className="shrink-0" />
              {sidebarOpen && <span className="tracking-wider">{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-2 border-t border-[#1f1f1f]">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-2 py-2 rounded text-xs text-[#666] hover:text-red-400 hover:bg-[#161616] transition-colors"
          >
            <LogOut size={16} className="shrink-0" />
            {sidebarOpen && <span className="tracking-wider">Sair</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <header className="flex items-center justify-end h-14 px-6 border-b border-[#1f1f1f] shrink-0">
          <span className="text-xs text-[#444] tracking-widest uppercase">
            {username}
          </span>
        </header>

        {/* Conteúdo com animação de rota */}
        <main className="flex-1 overflow-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              className="h-full p-6"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
