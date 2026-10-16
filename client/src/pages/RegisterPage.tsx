import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Sparkles, User, Lock, Mail, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";

export const RegisterPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const [isValidating, setIsValidating] = useState(true);
  const [inviteData, setInviteData] = useState<{ email: string; role: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setIsValidating(false);
      setErrorMsg("No se proporcionó ningún token de invitación.");
      return;
    }

    const validateToken = async () => {
      try {
        const res = await fetch(`/api/auth/invitation/${token}`);
        const data = await res.json();
        if (res.ok && data.valid) {
          setInviteData({ email: data.email, role: data.role });
        } else {
          setErrorMsg(data.error || "Invitación inválida o expirada.");
        }
      } catch {
        setErrorMsg("Error de conexión al validar la invitación.");
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (password !== confirmPassword) {
      setErrorMsg("Las contraseñas no coinciden.");
      return;
    }

    if (password.length < 8) {
      setErrorMsg("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          fullName,
          username,
          password,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Error al completar el registro.");
        setIsSubmitting(false);
        return;
      }

      // Registro exitoso: refrescamos el usuario en contexto y redirigimos
      await refreshUser();
      navigate("/", { replace: true });
    } catch {
      setErrorMsg("Error al comunicarse con el servidor.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#001E32] text-white flex flex-col justify-between p-4 md:p-8 font-sans">
      {/* Top Bar */}
      <header className="w-full max-w-6xl mx-auto flex items-center justify-between py-2">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FFC72C] text-[#001E32] flex items-center justify-center shadow-md">
            <Sparkles className="w-6 h-6 fill-[#001E32]" />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-xl tracking-wider text-white">EPIVOX</span>
            <span className="text-[10px] font-bold text-[#FFC72C] uppercase tracking-widest">
              Activación de Cuenta
            </span>
          </div>
        </Link>
      </header>

      {/* Main Form Center */}
      <main className="w-full max-w-md mx-auto my-8">
        <div className="bg-[#193750] border-2 border-[#425563] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-1.5">
            <h1 className="text-2xl font-black text-white tracking-wide">
              Crear tu Cuenta
            </h1>
            <p className="text-xs text-[#ECEBE4]/70">
              Completa tus datos para activar tu acceso a Epivox
            </p>
          </div>

          {isValidating ? (
            <div className="py-8 text-center text-xs text-[#ECEBE4]/70 space-y-3">
              <div className="w-8 h-8 border-2 border-[#FFC72C] border-t-transparent rounded-full animate-spin mx-auto" />
              <p>Validando invitación...</p>
            </div>
          ) : errorMsg && !inviteData ? (
            <div className="space-y-4">
              <div className="flex items-start gap-2.5 p-4 bg-[#B7312C]/20 border border-[#B7312C]/50 rounded-2xl text-xs text-[#ECEBE4]">
                <AlertCircle className="w-5 h-5 text-[#B7312C] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-white">Invitación Inválida o Expirada</p>
                  <p className="text-[#ECEBE4]/80">{errorMsg}</p>
                </div>
              </div>
              <Link
                to="/login"
                className="w-full bg-[#193750] hover:bg-[#254F72] border border-[#425563] text-white font-bold text-xs py-2.5 px-4 rounded-xl transition flex items-center justify-center gap-2"
              >
                Ir a Iniciar Sesión
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <div className="flex items-start gap-2.5 p-3.5 bg-[#B7312C]/20 border border-[#B7312C]/50 rounded-2xl text-xs text-[#ECEBE4]">
                  <AlertCircle className="w-4 h-4 text-[#B7312C] shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Email (Read only from invitation) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#ECEBE4]/90">
                  Correo Electrónico Invitado
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#ECEBE4]/50">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    disabled
                    value={inviteData?.email || ""}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#001E32]/60 border border-[#425563] rounded-xl text-xs text-[#ECEBE4]/70 cursor-not-allowed"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#4C8C2B]">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#ECEBE4]/90">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="ej. Juan Pérez"
                  className="w-full px-3.5 py-2.5 bg-[#001E32] border border-[#425563] focus:border-[#FFC72C] rounded-xl text-xs text-white placeholder-[#ECEBE4]/40 outline-none transition"
                />
              </div>

              {/* Username */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#ECEBE4]/90">
                  Nombre de Usuario
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#ECEBE4]/50">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().trim())}
                    placeholder="ej. jperez"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#001E32] border border-[#425563] focus:border-[#FFC72C] rounded-xl text-xs text-white placeholder-[#ECEBE4]/40 outline-none transition"
                  />
                </div>
                <span className="text-[10px] text-[#ECEBE4]/50 block">
                  3 a 32 caracteres (minúsculas, números, punto o guion)
                </span>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#ECEBE4]/90">
                  Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#ECEBE4]/50">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#001E32] border border-[#425563] focus:border-[#FFC72C] rounded-xl text-xs text-white placeholder-[#ECEBE4]/40 outline-none transition"
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#ECEBE4]/90">
                  Confirmar Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#ECEBE4]/50">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repite la contraseña"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#001E32] border border-[#425563] focus:border-[#FFC72C] rounded-xl text-xs text-white placeholder-[#ECEBE4]/40 outline-none transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#FFC72C] hover:bg-[#E6B327] disabled:opacity-50 text-[#001E32] font-black text-sm py-3 px-4 rounded-xl transition flex items-center justify-center gap-2 shadow-lg active:scale-98 cursor-pointer mt-2"
              >
                {isSubmitting ? (
                  <span>Activando cuenta...</span>
                ) : (
                  <>
                    <span>Activar y Entrar</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-6xl mx-auto text-center text-[11px] text-[#ECEBE4]/50 py-2">
        <span>Epivox &copy; {new Date().getFullYear()}</span>
      </footer>
    </div>
  );
};

export default RegisterPage;
