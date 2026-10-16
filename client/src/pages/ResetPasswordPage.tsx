import React, { useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Sparkles, Lock, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!token) {
      setErrorMsg("Falta el token de restablecimiento.");
      return;
    }
    if (password.length < 8) {
      setErrorMsg("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg("Las contraseñas no coinciden.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Error al restablecer la contraseña.");
        setIsSubmitting(false);
        return;
      }
      setSuccess(true);
      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 2500);
    } catch {
      setErrorMsg("Error de comunicación con el servidor.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#001E32] text-white flex flex-col justify-between p-4 md:p-8 font-sans">
      <header className="w-full max-w-6xl mx-auto flex items-center justify-between py-2">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FFC72C] text-[#001E32] flex items-center justify-center shadow-md">
            <Sparkles className="w-6 h-6 fill-[#001E32]" />
          </div>
          <span className="font-black text-xl tracking-wider text-white">EPIVOX</span>
        </Link>
      </header>

      <main className="w-full max-w-md mx-auto my-8">
        <div className="bg-[#193750] border-2 border-[#425563] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-1.5">
            <h1 className="text-2xl font-black text-white tracking-wide">
              Nueva Contraseña
            </h1>
            <p className="text-xs text-[#ECEBE4]/70">
              Ingresa una nueva clave de acceso para tu cuenta
            </p>
          </div>

          {success ? (
            <div className="p-4 bg-[#4C8C2B]/20 border border-[#4C8C2B]/50 rounded-2xl text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-[#4C8C2B] mx-auto" />
              <p className="text-sm font-bold text-white">¡Contraseña restablecida!</p>
              <p className="text-xs text-[#ECEBE4]/80">Redirigiendo a iniciar sesión...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <div className="flex items-start gap-2.5 p-3.5 bg-[#B7312C]/20 border border-[#B7312C]/50 rounded-2xl text-xs text-[#ECEBE4]">
                  <AlertCircle className="w-4 h-4 text-[#B7312C] shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#ECEBE4]/90">
                  Nueva Contraseña
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
                  <span>Guardando...</span>
                ) : (
                  <>
                    <span>Actualizar Contraseña</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </main>

      <footer className="w-full max-w-6xl mx-auto text-center text-[11px] text-[#ECEBE4]/50 py-2">
        <span>Epivox &copy; {new Date().getFullYear()}</span>
      </footer>
    </div>
  );
};

export default ResetPasswordPage;
