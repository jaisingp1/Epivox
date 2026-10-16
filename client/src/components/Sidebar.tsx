import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Sparkles,
  LayoutGrid,
  Tv,
  MessageSquare,
  BookOpen,
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
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

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
  { name: "Banco de Plantillas", path: "/templates", icon: BookOpen },
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
  const { user, logout } = useAuth();

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
      className={`relative flex flex-col justify-between bg-[#001E32] border-r border-[#425563]/40 transition-all duration-300 z-30 select-none ${
        collapsed ? "w-20" : "w-64"
      } min-h-screen shrink-0`}
    >
      {/* Top Section: Branding & Toggle */}
      <div>
        <div className="flex items-center justify-between p-4 border-b border-[#425563]/40 h-18">
          <Link
            to="/"
            className="flex items-center gap-3 overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFC72C] rounded-xl p-1"
          >
            <div className="w-10 h-10 rounded-xl bg-[#FFC72C] text-[#001E32] flex items-center justify-center shrink-0 shadow-md">
              <Sparkles className="w-6 h-6 fill-[#001E32]" />
            </div>
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="font-black text-xl tracking-wider text-white truncate">
                  EPIVOX
                </span>
                <span className="text-[10px] font-bold text-[#FFC72C] uppercase tracking-widest truncate">
                  Interactive Platform
                </span>
              </div>
            )}
          </Link>

          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? "Expandir menú" : "Colapsar menú"}
            className="text-[#ECEBE4]/60 hover:text-[#FFC72C] hover:bg-[#193750] p-1.5 rounded-lg transition shrink-0 cursor-pointer"
          >
            {collapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <ChevronLeft className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1.5" aria-label="Menú principal de Epivox">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                title={collapsed ? item.name : undefined}
                className={`group flex items-center gap-3.5 px-3.5 py-3 rounded-xl font-bold text-sm transition-all duration-200 ${
                  active
                    ? "bg-[#FFC72C] text-[#001E32] shadow-lg shadow-[#FFC72C]/10 font-extrabold"
                    : "text-[#ECEBE4]/80 hover:text-white hover:bg-[#193750]/80"
                }`}
              >
                <Icon
                  className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-110 ${
                    active ? "text-[#001E32]" : "text-[#ECEBE4]/70"
                  }`}
                />
                {!collapsed && (
                  <div className="flex items-center justify-between flex-1 truncate">
                    <span className="truncate">{item.name}</span>
                    {item.badge && (
                      <span
                        className={`text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded font-black ${
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
            <div className="border-t border-[#425563]/40" />
          </div>

          {/* Quick Access Mobile Join */}
          <Link
            to="/join"
            target="_blank"
            rel="noopener noreferrer"
            title={collapsed ? "Unirse como Móvil (PIN)" : undefined}
            className="group flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-[#48A9C5] hover:bg-[#48A9C5]/10 border border-[#48A9C5]/30 transition"
          >
            <Smartphone className="w-5 h-5 shrink-0 group-hover:scale-110 transition-transform" />
            {!collapsed && (
              <div className="flex flex-col truncate">
                <span className="font-extrabold truncate">Unirse Móvil</span>
                <span className="text-[10px] text-[#ECEBE4]/60 truncate">
                  Ingreso directo por PIN
                </span>
              </div>
            )}
          </Link>
        </nav>
      </div>

      {/* Bottom Section: User & Logout */}
      <div className="p-3 border-t border-[#425563]/40 space-y-2">
        {/* User Card */}
        <div
          className={`flex items-center gap-3 p-2 bg-[#193750]/60 rounded-xl border border-[#425563]/40 ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <div className="w-8 h-8 rounded-lg bg-[#48A9C5] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow">
            <User className="w-4 h-4" />
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-bold text-white truncate">
                {user?.full_name || user?.username || "Usuario"}
              </span>
              <span className="text-[10px] text-[#ECEBE4]/60 flex items-center gap-1 truncate">
                {user?.role === "admin" ? (
                  <>
                    <ShieldCheck className="w-3 h-3 text-[#FFC72C]" />
                    <span className="text-[#FFC72C] font-semibold">Administrador</span>
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

        {/* Botón Cerrar Sesión */}
        <button
          type="button"
          onClick={logout}
          title={collapsed ? "Cerrar Sesión" : undefined}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-[#ECEBE4]/70 hover:text-[#B7312C] hover:bg-[#B7312C]/10 transition border border-[#425563]/30 cursor-pointer ${
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
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-[#ECEBE4]/70 hover:text-[#FFC72C] hover:bg-[#193750] transition border border-[#425563]/30"
        >
          <Home className="w-4 h-4 shrink-0 text-[#FFC72C]" />
          {!collapsed && <span className="truncate">Inicio</span>}
        </Link>
      </div>
    </aside>
  );
};

export default Sidebar;
