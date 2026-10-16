import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Sparkles, Lock, User, Eye, EyeOff, Smartphone, AlertCircle, ArrowRight } from "lucide-react";

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [loginValue, setLoginValue] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || "/";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!loginValue.trim() || !password) {
      setErrorMsg("Por favor, ingresa tu usuario o correo y contraseña.");
      return;
    }

    setIsSubmitting(true);
    const result = await login(loginValue, password);
    setIsSubmitting(false);

    if (result.success) {
      navigate(from, { replace: true });
    } else {
      setErrorMsg(result.error || "Credenciales incorrectas.");
    }
  };

  return (
    <div className="min-h-screen bg-[#001E32] text-white flex flex-col justify-between p-4 md:p-8 font-sans selection:bg-[#FFC72C] selection:text-[#001E32]">
      {/* Top Bar */}
      <header className="w-full max-w-6xl mx-auto flex items-center justify-between py-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FFC72C] text-[#001E32] flex items-center justify-center shadow-md">
            <Sparkles className="w-6 h-6 fill-[#001E32]" />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-xl tracking-wider text-white">EPIVOX</span>
            <span className="text-[10px] font-bold text-[#FFC72C] uppercase tracking-widest">
              PastenLabs Standalone
            </span>
          </div>
        </div>

        <Link
          to="/join"
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-[#48A9C5] hover:bg-[#48A9C5]/10 border border-[#48A9C5]/40 transition"
        >
          <Smartphone className="w-4 h-4" />
          <span>Tengo un PIN móvil</span>
        </Link>
      </header>

      {/* Main Form Center */}
      <main className="w-full max-w-md mx-auto my-8">
        <div className="bg-[#193750] border-2 border-[#425563] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-1.5">
            <h1 className="text-2xl font-black text-white tracking-wide">
              Iniciar Sesión
            </h1>
            <p className="text-xs text-[#ECEBE4]/70">
              Ingresa tus credenciales para crear y gestionar presentaciones
            </p>
          </div>

          {errorMsg && (
            <div className="flex items-start gap-2.5 p-3.5 bg-[#B7312C]/20 border border-[#B7312C]/50 rounded-2xl text-xs text-[#ECEBE4] animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-[#B7312C] shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="login-input"
                className="block text-xs font-bold text-[#ECEBE4]/90"
              >
                Usuario o Correo
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#ECEBE4]/50">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="login-input"
                  type="text"
                  autoComplete="username"
                  required
                  value={loginValue}
                  onChange={(e) => setLoginValue(e.target.value)}
                  placeholder="ej. jaisingp o correo@hotmail.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#001E32] border border-[#425563] focus:border-[#FFC72C] focus:ring-1 focus:ring-[#FFC72C] rounded-xl text-xs text-white placeholder-[#ECEBE4]/40 outline-none transition"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="password-input"
                className="block text-xs font-bold text-[#ECEBE4]/90"
              >
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#ECEBE4]/50">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password-input"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-[#001E32] border border-[#425563] focus:border-[#FFC72C] focus:ring-1 focus:ring-[#FFC72C] rounded-xl text-xs text-white placeholder-[#ECEBE4]/40 outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#ECEBE4]/50 hover:text-white transition"
                  tabIndex={-1}
                  aria-label={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#FFC72C] hover:bg-[#E6B327] disabled:opacity-50 text-[#001E32] font-black text-sm py-3 px-4 rounded-xl transition flex items-center justify-center gap-2 shadow-lg active:scale-98 cursor-pointer mt-2"
            >
              {isSubmitting ? (
                <span>Ingresando...</span>
              ) : (
                <>
                  <span>Entrar a Epivox</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-2 border-t border-[#425563]/40 text-center space-y-2">
            <p className="text-[11px] text-[#ECEBE4]/60 leading-relaxed">
              El registro es <strong className="text-[#FFC72C]">únicamente por invitación</strong>. Si recibiste un enlace del administrador, ábrelo en tu navegador para activar tu cuenta.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-6xl mx-auto text-center text-[11px] text-[#ECEBE4]/50 py-2">
        <span>Epivox &copy; {new Date().getFullYear()} &bull; Servidor Autónomo en epivox.pastenlabs.com</span>
      </footer>
    </div>
  );
};

export default LoginPage;
