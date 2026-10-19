import React from "react";
import {
  UserPlus,
  Mail,
  Copy,
  Check,
  CheckCircle2,
  Clock,
  Ban,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { InvitationItem } from "../types";

interface InvitationsTabProps {
  invitations: InvitationItem[];
  isLoadingInvites: boolean;
  inviteEmail: string;
  setInviteEmail: (email: string) => void;
  inviteRole: "creator" | "admin";
  setInviteRole: (role: "creator" | "admin") => void;
  isCreatingInvite: boolean;
  latestInviteUrl: string | null;
  copiedInvite: boolean;
  handleCreateInvitation: (e: React.FormEvent) => void;
  handleCopyLink: (url: string, isReset?: boolean) => void;
  handleRevokeInvitation: (id: number) => void;
  fetchInvitations: () => void;
}

export const InvitationsTab: React.FC<InvitationsTabProps> = ({
  invitations,
  isLoadingInvites,
  inviteEmail,
  setInviteEmail,
  inviteRole,
  setInviteRole,
  isCreatingInvite,
  latestInviteUrl,
  copiedInvite,
  handleCreateInvitation,
  handleCopyLink,
  handleRevokeInvitation,
  fetchInvitations,
}) => {
  return (
    <div className="space-y-6">
      {/* Card: Generar Nueva Invitación */}
      <div className="bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-2xl p-5 md:p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#FFC72C] text-[#001E32] flex items-center justify-center font-bold">
            <UserPlus className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-[var(--text-main)]">
              Generar Nuevo Enlace de Invitación
            </h3>
            <p className="text-xs text-[var(--text-subtle)]">
              Crea un enlace único válido por 7 días para que un nuevo usuario
              active su cuenta.
            </p>
          </div>
        </div>

        <form
          onSubmit={handleCreateInvitation}
          className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2"
        >
          <div className="md:col-span-6 space-y-1">
            <label className="block text-[11px] font-bold text-[var(--text-subtle)]">
              Correo Electrónico de la Persona
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--text-muted)]">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="jperez@correo.com o colega@empresa.com"
                className="w-full pl-9 pr-3 py-2 bg-[var(--surface-subtle)] border border-[var(--border-subtle)] focus:border-[#FFC72C] rounded-xl text-xs text-[var(--text-main)] placeholder-[var(--text-muted)] outline-none transition"
              />
            </div>
          </div>

          <div className="md:col-span-3 space-y-1">
            <label className="block text-[11px] font-bold text-[var(--text-subtle)]">
              Rol Asignado
            </label>
            <select
              value={inviteRole}
              onChange={(e) =>
                setInviteRole(e.target.value as "creator" | "admin")
              }
              className="w-full px-3 py-2 bg-[var(--surface-subtle)] border border-[var(--border-subtle)] focus:border-[#FFC72C] rounded-xl text-xs text-[var(--text-main)] outline-none transition cursor-pointer"
            >
              <option value="creator">Creador (Estándar)</option>
              <option value="admin">Administrador (Total)</option>
            </select>
          </div>

          <div className="md:col-span-3 flex items-end">
            <button
              type="submit"
              disabled={isCreatingInvite}
              className="w-full bg-[#FFC72C] hover:bg-[#E6B327] disabled:opacity-50 text-[#001E32] font-black text-xs py-2.5 px-4 rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>
                {isCreatingInvite ? "Generando..." : "Generar Enlace"}
              </span>
            </button>
          </div>
        </form>

        {/* Banner de Enlace Generado para Copiar */}
        {latestInviteUrl && (
          <div className="mt-4 p-4 bg-[var(--surface-subtle)] border-2 border-[#FFC72C] rounded-xl space-y-2 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-[#FFC72C] flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Enlace de Invitación Listo para Compartir:
              </span>
              <span className="text-[10px] text-[var(--text-muted)] font-bold">
                Válido por 7 días
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={latestInviteUrl}
                className="flex-1 px-3 py-2 bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-lg text-xs text-[var(--text-main)] font-mono select-all outline-none"
              />
              <button
                type="button"
                onClick={() => handleCopyLink(latestInviteUrl)}
                className="bg-[#FFC72C] hover:bg-[#E6B327] text-[#001E32] font-black text-xs py-2 px-3.5 rounded-lg transition flex items-center gap-1.5 shrink-0 shadow-sm active:scale-95 cursor-pointer"
              >
                {copiedInvite ? (
                  <>
                    <Check className="w-4 h-4 text-[#001E32]" />
                    <span>¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copiar Enlace</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-[11px] text-[var(--text-subtle)]">
              Puedes enviar este enlace directamente por WhatsApp, Teams o
              correo personal a la persona invitada.
            </p>
          </div>
        )}
      </div>

      {/* Tabla de Invitaciones Emitidas */}
      <div className="bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
          <h3 className="text-xs font-black text-[var(--text-main)] uppercase tracking-wider">
            Historial de Invitaciones
          </h3>
          <button
            type="button"
            onClick={fetchInvitations}
            className="text-xs text-[var(--text-muted)] hover:text-[var(--text-main)] flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Actualizar</span>
          </button>
        </div>

        {isLoadingInvites ? (
          <div className="py-8 text-center text-xs text-[var(--text-muted)]">
            Cargando invitaciones...
          </div>
        ) : invitations.length === 0 ? (
          <div className="p-8 text-center text-xs text-[var(--text-muted)]">
            No se han emitido invitaciones todavía.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--surface-subtle)] text-[var(--text-subtle)] uppercase tracking-wider font-extrabold border-b border-[var(--border-subtle)]">
                <tr>
                  <th className="py-3 px-4">Correo Destino</th>
                  <th className="py-3 px-4">Rol</th>
                  <th className="py-3 px-4">Invitado por</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4">Expira</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {invitations.map((inv) => {
                  const isExpired = new Date(inv.expires_at) < new Date();
                  const isUsed = Boolean(inv.used_at);
                  const isRevoked = Boolean(inv.revoked_at);
                  const isActive = !isExpired && !isUsed && !isRevoked;

                  const inviteUrl = `${window.location.origin}/register?token=${inv.token}`;

                  return (
                    <tr
                      key={inv.id}
                      className="hover:bg-[var(--surface-hover)] transition-colors"
                    >
                      <td className="py-3 px-4 font-bold text-[var(--text-main)]">
                        {inv.email}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${
                            inv.role === "admin"
                              ? "bg-[#FFC72C]/10 text-[#FFC72C] border-[#FFC72C]/30"
                              : "bg-[#48A9C5]/10 text-[#48A9C5] border-[#48A9C5]/30"
                          }`}
                        >
                          {inv.role === "admin" ? "Administrador" : "Creador"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[var(--text-subtle)]">
                        @{inv.invited_by_username || "admin"}
                      </td>
                      <td className="py-3 px-4">
                        {isUsed ? (
                          <span className="text-[10px] font-bold text-[#4C8C2B] flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Registrado
                          </span>
                        ) : isRevoked ? (
                          <span className="text-[10px] font-bold text-[#B7312C] flex items-center gap-1">
                            <Ban className="w-3.5 h-3.5" /> Revocada
                          </span>
                        ) : isExpired ? (
                          <span className="text-[10px] font-bold text-[var(--text-muted)] flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> Expirada
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-[#FFC72C] flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> Pendiente
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-[var(--text-muted)] text-[11px]">
                        {new Date(inv.expires_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {isActive && (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleCopyLink(inviteUrl)}
                              className="p-1.5 text-[#FFC72C] hover:bg-[#FFC72C]/10 rounded-lg transition cursor-pointer"
                              title="Copiar enlace de invitación"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRevokeInvitation(inv.id)}
                              className="p-1.5 text-[#B7312C]/70 hover:text-[#B7312C] hover:bg-[#B7312C]/10 rounded-lg transition cursor-pointer"
                              title="Revocar invitación"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
