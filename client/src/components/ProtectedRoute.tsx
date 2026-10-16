import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Sparkles, ShieldAlert } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAdmin = false,
}) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#001E32] text-white flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 rounded-2xl bg-[#FFC72C] flex items-center justify-center shadow-xl animate-pulse mb-4">
          <Sparkles className="w-8 h-8 fill-[#001E32] text-[#001E32]" />
        </div>
        <p className="text-sm font-bold text-[#ECEBE4]/80 tracking-wide">
          Verificando credenciales en Epivox...
        </p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && user.role !== "admin") {
    return (
      <div className="min-h-screen bg-[#001E32] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#B7312C]/20 border border-[#B7312C]/40 flex items-center justify-center shadow-xl mb-4 text-[#B7312C]">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-white mb-2">Acceso Restringido</h2>
        <p className="text-sm text-[#ECEBE4]/70 max-w-md mb-6">
          Esta sección está reservada exclusivamente para el Administrador del sistema.
        </p>
        <a
          href="/"
          className="bg-[#FFC72C] hover:bg-[#E6B327] text-[#001E32] font-black text-xs py-2.5 px-6 rounded-xl transition"
        >
          Volver al Inicio
        </a>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
