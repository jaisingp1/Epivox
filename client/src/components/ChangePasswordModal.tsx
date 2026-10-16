import React, { useState } from "react";
import { KeyRound, Lock, Eye, EyeOff, X, CheckCircle2, AlertCircle } from "lucide-react";

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError(null);
    setSuccess(false);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError("La nueva contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden. Por favor verifica.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error al actualizar la contraseña");
      }

      setSuccess(true);
      setTimeout(() => {
        handleClose();
      }, 1800);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error de comunicación con el servidor";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#001E32]/80 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-[#193750] border border-[#425563] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#425563]/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFC72C]/10 border border-[#FFC72C]/30 flex items-center justify-center text-[#FFC72C]">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Cambiar Mi Contraseña</h2>
              <p className="text-xs text-[#ECEBE4]/60">
                Actualiza tu clave de acceso personal
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-[#ECEBE4]/50 hover:text-white p-1 rounded-lg transition"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {success ? (
            <div className="text-center py-6 space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#4C8C2B]/20 border border-[#4C8C2B] text-[#4C8C2B] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-white">¡Contraseña actualizada!</h3>
              <p className="text-xs text-[#ECEBE4]/70">
                Tu clave ha sido modificada exitosamente.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-[#B7312C]/20 border border-[#B7312C]/40 text-[#ECEBE4] text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-[#B7312C] shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Contraseña actual */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#ECEBE4]/90">
                  Contraseña Actual
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#ECEBE4]/50">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showCurrent ? "text" : "password"}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Tu contraseña actual"
                    className="w-full pl-9 pr-10 py-2.5 bg-[#001E32] border border-[#425563] focus:border-[#FFC72C] rounded-xl text-xs text-white placeholder-[#ECEBE4]/40 outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#ECEBE4]/50 hover:text-white"
                  >
                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Nueva contraseña */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#ECEBE4]/90">
                  Nueva Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#ECEBE4]/50">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type={showNew ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    className="w-full pl-9 pr-10 py-2.5 bg-[#001E32] border border-[#425563] focus:border-[#FFC72C] rounded-xl text-xs text-white placeholder-[#ECEBE4]/40 outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#ECEBE4]/50 hover:text-white"
                  >
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirmar nueva contraseña */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#ECEBE4]/90">
                  Confirmar Nueva Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#ECEBE4]/50">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type={showConfirm ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repite la nueva contraseña"
                    className="w-full pl-9 pr-10 py-2.5 bg-[#001E32] border border-[#425563] focus:border-[#FFC72C] rounded-xl text-xs text-white placeholder-[#ECEBE4]/40 outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#ECEBE4]/50 hover:text-white"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Botones */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-[#ECEBE4]/70 hover:bg-[#001E32] transition border border-[#425563]/40 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold bg-[#FFC72C] hover:bg-[#E6B327] disabled:opacity-50 text-[#001E32] transition shadow cursor-pointer"
                >
                  {isSubmitting ? "Guardando..." : "Guardar Clave"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
