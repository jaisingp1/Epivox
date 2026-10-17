import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Sparkles,
  LayoutGrid,
  Tv,
  MessageSquare,
  KeyRound,
  BarChart2,
  Smartphone,
  ChevronLeft,
  ChevronRight,
  Home,
  User,
  ShieldCheck,
  Shield,
  Users,
  LogOut,
  HelpCircle,
  Sun,
  Moon,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import ChangePasswordModal from "./ChangePasswordModal";

interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
  badge?: string;
  adminOnly?: boolean;
}

const baseNavItems: NavItem[] = [
  { name: "Inicio / Hub", path: "/", icon: LayoutGrid },
  { name: "Presentaciones", path: "/presentations", icon: Tv },
  {
    name: "Preguntas Abiertas",
    path: "/open-polls",
    icon: MessageSquare,
    badge: "Mentimeter",
  },
  { name: "Banco de Preguntas", path: "/question-bank", icon: HelpCircle },
  { name: "Reportes y Analíticas", path: "/reports", icon: BarChart2 },
  {
    name: "Gestión de Usuarios",
    path: "/admin/users",
    icon: Users,
    badge: "Admin",
    adminOnly: true,
  },
];

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const { user, logout } = useAuth();
  const { toggleTheme, isDark } = useTheme();

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/" || location.pathname === "/hub";
    }
    return location.pathname.startsWith(path);
  };

  const navItems = baseNavItems.filter((item) => {
    if (item.adminOnly) {
      return user?.role === "admin";
    }
    return true;
  });

  return (
    <aside
      className={`relative flex flex-col justify-between bg-[var(--surface-card)] border-r border-[var(--border-subtle)] text-[var(--text-main)] transition-all duration-300 z-30 select-none ${
        collapsed ? "w-20" : "w-68"
      } min-h-screen shrink-0`}
    >
      {/* Top Section: Branding & Toggle */}
      <div>
        <div className="flex items-center justify-between p-4 border-b border-[var(--border-subtle)] h-18">
          <Link
            to="/"
            className="flex items-center gap-3 overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFC72C] rounded-xl p-1"
          >
            <div className="w-10 h-10 rounded-xl bg-[#FFC72C] text-[#001E32] flex items-center justify-center shrink-0 shadow-md">
              <Sparkles className="w-6 h-6 fill-[#001E32]" />
            </div>
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="font-black text-xl tracking-wider text-[var(--text-main)] leading-none">
                  EPIVOX
                </span>
                <span className="text-[10px] font-bold text-[#FFC72C] uppercase tracking-widest mt-1">
                  Interactive Platform
                </span>
              </div>
            )}
          </Link>

          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? "Expandir menú" : "Colapsar menú"}
            className="text-[var(--text-subtle)] hover:text-[#FFC72C] hover:bg-[var(--surface-subtle)] p-1.5 rounded-lg transition shrink-0 cursor-pointer"
          >
            {collapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <ChevronLeft className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1" aria-label="Menú principal de Epivox">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                title={collapsed ? item.name : undefined}
                className={`group flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all duration-200 ${
                  active
                    ? "bg-[#FFC72C] text-[#001E32] shadow-md shadow-[#FFC72C]/10 font-extrabold"
                    : "text-[var(--text-subtle)] hover:text-[var(--text-main)] hover:bg-[var(--surface-subtle)]"
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                    active ? "text-[#001E32]" : "text-[var(--text-muted)]"
                  }`}
                />
                {!collapsed && (
                  <div className="flex items-center justify-between flex-1 min-w-0 gap-1.5">
                    <span className="truncate">{item.name}</span>
                    {item.badge && (
                      <span
                        className={`shrink-0 text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded font-black ${
                          active
                            ? "bg-[#001E32] text-[#FFC72C]"
                            : item.badge === "Admin"
                              ? "bg-[#FFC72C]/20 text-[#FFC72C] border border-[#FFC72C]/30"
                              : "bg-[#48A9C5]/20 text-[#48A9C5] border border-[#48A9C5]/30"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </Link>
            );
          })}

          <div className="py-2">
            <div className="border-t border-[var(--border-subtle)]" />
          </div>

          {/* Quick Access Mobile Join */}
          <Link
            to="/join"
            target="_blank"
            rel="noopener noreferrer"
            title={collapsed ? "Unirse como Móvil (PIN)" : undefined}
            className="group flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-[#48A9C5] hover:bg-[#48A9C5]/10 border border-[#48A9C5]/30 transition"
          >
            <Smartphone className="w-4 h-4 shrink-0 group-hover:scale-110 transition-transform" />
            {!collapsed && (
              <div className="flex flex-col truncate min-w-0">
                <span className="font-extrabold truncate">Unirse Móvil</span>
                <span className="text-[10px] text-[var(--text-muted)] truncate">
                  Ingreso directo por PIN
                </span>
              </div>
            )}
          </Link>
        </nav>
      </div>

      {/* Bottom Section: Theme Toggle, User & Logout */}
      <div className="p-3 border-t border-[var(--border-subtle)] space-y-1.5">
        {/* User Card */}
        <div
          className={`flex items-center gap-2.5 p-2 bg-[var(--surface-subtle)] rounded-xl border border-[var(--border-subtle)] ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <div className="w-8 h-8 rounded-lg bg-[#48A9C5] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow">
            <User className="w-4 h-4" />
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-bold text-[var(--text-main)] truncate">
                {user?.full_name || user?.username || "Usuario"}
              </span>
              <span className="text-[10px] text-[var(--text-muted)] flex items-center gap-1 truncate">
                {user?.role === "admin" ? (
                  <>
                    <ShieldCheck className="w-3 h-3 text-[#FFC72C]" />
                    <span className="text-[#FFC72C] font-semibold">
                      Administrador
                    </span>
                  </>
                ) : (
                  <>
                    <Shield className="w-3 h-3 text-[#48A9C5]" />
                    <span>Creador</span>
                  </>
                )}
              </span>
            </div>
          )}
        </div>

        {/* Theme Toggle (Light / Dark) */}
        <button
          type="button"
          onClick={toggleTheme}
          title={isDark ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro"}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition border border-[var(--border-subtle)] cursor-pointer text-[var(--text-subtle)] hover:text-[#FFC72C] hover:bg-[var(--surface-subtle)] ${
            collapsed ? "justify-center" : ""
          }`}
        >
          {isDark ? (
            <Sun className="w-4 h-4 shrink-0 text-[#FFC72C]" />
          ) : (
            <Moon className="w-4 h-4 shrink-0 text-[var(--text-main)]" />
          )}
          {!collapsed && (
            <span className="truncate">
              {isDark ? "Modo Claro" : "Modo Oscuro"}
            </span>
          )}
        </button>

        {/* Botón Cambiar Mi Contraseña */}
        <button
          type="button"
          onClick={() => setIsPasswordModalOpen(true)}
          title={collapsed ? "Cambiar Contraseña" : undefined}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-[var(--text-subtle)] hover:text-[#FFC72C] hover:bg-[var(--surface-subtle)] transition border border-[var(--border-subtle)] cursor-pointer ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <KeyRound className="w-4 h-4 shrink-0 text-[#FFC72C]" />
          {!collapsed && <span className="truncate">Cambiar Contraseña</span>}
        </button>

        {/* Botón Cerrar Sesión */}
        <button
          type="button"
          onClick={logout}
          title={collapsed ? "Cerrar Sesión" : undefined}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-[var(--text-subtle)] hover:text-[#B7312C] hover:bg-[#B7312C]/10 transition border border-[var(--border-subtle)] cursor-pointer ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <LogOut className="w-4 h-4 shrink-0 text-[#B7312C]" />
          {!collapsed && <span className="truncate">Cerrar Sesión</span>}
        </button>

        {/* Seleccionar Módulo (Home) */}
        <Link
          to="/"
          title="Inicio"
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-[var(--text-subtle)] hover:text-[#FFC72C] hover:bg-[var(--surface-subtle)] transition border border-[var(--border-subtle)]"
        >
          <Home className="w-4 h-4 shrink-0 text-[#FFC72C]" />
          {!collapsed && <span className="truncate">Inicio</span>}
        </Link>
      </div>

      {/* Modal para cambiar contraseña */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </aside>
  );
};

export default Sidebar;
