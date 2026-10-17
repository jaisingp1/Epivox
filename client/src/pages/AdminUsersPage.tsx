import React, { useState, useEffect, useCallback } from "react";
import PageHeader from "../components/PageHeader";
import {
  Users,
  UserPlus,
  Mail,
  Copy,
  Check,
  ShieldCheck,
  Key,
  Clock,
  CheckCircle2,
  XCircle,
  Ban,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

interface UserItem {
  id: number;
  username: string;
  email: string;
  full_name: string | null;
  role: "admin" | "creator";
  is_active: boolean;
  created_at: string;
}

interface InvitationItem {
  id: number;
  email: string;
  token: string;
  role: "admin" | "creator";
  invited_by_user_id: number;
  invited_by_username?: string;
  expires_at: string;
  used_at: string | null;
  revoked_at: string | null;
  created_at: string;
}

export const AdminUsersPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"invitations" | "users">("invitations");

  // Estados de usuarios
  const [users, setUsers] = useState<UserItem[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // Estados de invitaciones
  const [invitations, setInvitations] = useState<InvitationItem[]>([]);
  const [isLoadingInvites, setIsLoadingInvites] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"creator" | "admin">("creator");
  const [isCreatingInvite, setIsCreatingInvite] = useState(false);

  // Enlace recién generado listo para copiar
  const [latestInviteUrl, setLatestInviteUrl] = useState<string | null>(null);
  const [copiedInvite, setCopiedInvite] = useState(false);

  // Reset de contraseña
  const [resetModalUrl, setResetModalUrl] = useState<string | null>(null);
  const [copiedReset, setCopiedReset] = useState(false);

  // Mensajes de feedback
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setIsLoadingUsers(true);
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch {
      // Ignorar
    } finally {
      setIsLoadingUsers(false);
    }
  }, []);

  const fetchInvitations = useCallback(async () => {
    setIsLoadingInvites(true);
    try {
      const res = await fetch("/api/admin/invitations");
      if (res.ok) {
        const data = await res.json();
        setInvitations(data);
      }
    } catch {
      // Ignorar
    } finally {
      setIsLoadingInvites(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchInvitations();
  }, [fetchUsers, fetchInvitations]);

  const handleCreateInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setErrorMsg(null);
    setSuccessMsg(null);
    setIsCreatingInvite(true);

    try {
      const res = await fetch("/api/admin/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Error al generar invitación");
        return;
      }

      setLatestInviteUrl(data.inviteUrl);
      const targetEmail = inviteEmail.trim();
      setInviteEmail("");
      if (data.emailSent) {
        setSuccessMsg(`¡Invitación enviada por correo exitosamente a ${targetEmail}!`);
      } else {
        setSuccessMsg("¡Enlace de invitación generado! Puedes copiar el enlace a continuación.");
      }
      fetchInvitations();
    } catch {
      setErrorMsg("Error de conexión");
    } finally {
      setIsCreatingInvite(false);
    }
  };

  const handleCopyLink = async (url: string, isReset = false) => {
    try {
      await navigator.clipboard.writeText(url);
      if (isReset) {
        setCopiedReset(true);
        setTimeout(() => setCopiedReset(false), 2500);
      } else {
        setCopiedInvite(true);
        setTimeout(() => setCopiedInvite(false), 2500);
      }
    } catch {
      // Fallback manual si clipboard falla
    }
  };

  const handleRevokeInvitation = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/invitations/${id}`, { method: "DELETE" });
      if (res.ok) {
        setInvitations((prev) =>
          prev.map((inv) =>
            inv.id === id ? { ...inv, revoked_at: new Date().toISOString() } : inv,
          ),
        );
      }
    } catch {
      // Ignorar
    }
  };

  const handleToggleUserActive = async (user: UserItem) => {
    try {
      const res = await fetch(`/api/admin/users/${user.id}/active`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !user.is_active }),
      });
      const data = await res.json();
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, is_active: !user.is_active } : u)),
        );
      } else {
        setErrorMsg(data.error || "No se pudo cambiar el estado del usuario");
      }
    } catch {
      setErrorMsg("Error de conexión");
    }
  };

  const handleGenerateReset = async (userId: number, username: string) => {
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}/reset-password`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok && data.resetUrl) {
        setResetModalUrl(data.resetUrl);
        if (data.emailSent) {
          setSuccessMsg(`¡Enlace generado y enviado por correo a @${username}!`);
        } else {
          setSuccessMsg(`Enlace de restablecimiento generado para @${username}`);
        }
      } else {
        setErrorMsg(data.error || "Error al generar enlace de restablecimiento");
      }
    } catch {
      setErrorMsg("Error de conexión");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestión de Usuarios e Invitaciones"
        description="Genera enlaces únicos para invitar nuevos creadores a Epivox y administra el estado de las cuentas existentes."
        breadcrumbs={[
          { label: "Inicio", href: "/" },
          { label: "Administración de Usuarios" },
        ]}
        badge={
          <span className="bg-[#FFC72C]/10 text-[#FFC72C] border border-[#FFC72C]/30 text-xs font-black uppercase px-2.5 py-1 rounded-lg flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            Panel Super Admin
          </span>
        }
      />

      {errorMsg && (
        <div className="flex items-start gap-2.5 p-3.5 bg-[#B7312C]/20 border border-[#B7312C]/50 rounded-2xl text-xs text-[#ECEBE4]">
          <AlertCircle className="w-4 h-4 text-[#B7312C] shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-2.5 p-3.5 bg-[#4C8C2B]/20 border border-[#4C8C2B]/50 rounded-2xl text-xs text-[#ECEBE4]">
          <Check className="w-4 h-4 text-[#4C8C2B] shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Tabs Selector */}
      <div className="flex items-center gap-2 border-b border-[#425563]/40 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("invitations")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition ${
            activeTab === "invitations"
              ? "bg-[#FFC72C] text-[#001E32] shadow font-extrabold"
              : "text-[#ECEBE4]/70 hover:text-white hover:bg-[#193750]"
          }`}
        >
          <UserPlus className="w-4 h-4" />
          <span>Invitaciones ({invitations.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("users")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition ${
            activeTab === "users"
              ? "bg-[#FFC72C] text-[#001E32] shadow font-extrabold"
              : "text-[#ECEBE4]/70 hover:text-white hover:bg-[#193750]"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Usuarios Registrados ({users.length})</span>
        </button>
      </div>

      {/* =================================================================== */}
      {/* TAB 1: INVITACIONES AL SISTEMA                                      */}
      {/* =================================================================== */}
      {activeTab === "invitations" && (
        <div className="space-y-6">
          {/* Card: Generar Nueva Invitación */}
          <div className="bg-[#193750] border border-[#425563] rounded-2xl p-5 md:p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#FFC72C] text-[#001E32] flex items-center justify-center font-bold">
                <UserPlus className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white">Generar Nuevo Enlace de Invitación</h3>
                <p className="text-xs text-[#ECEBE4]/70">
                  Crea un enlace único válido por 7 días para que un nuevo usuario active su cuenta.
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateInvitation} className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2">
              <div className="md:col-span-6 space-y-1">
                <label className="block text-[11px] font-bold text-[#ECEBE4]/80">
                  Correo Electrónico de la Persona
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#ECEBE4]/50">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="jperez@correo.com o colega@empresa.com"
                    className="w-full pl-9 pr-3 py-2 bg-[#001E32] border border-[#425563] focus:border-[#FFC72C] rounded-xl text-xs text-white placeholder-[#ECEBE4]/40 outline-none transition"
                  />
                </div>
              </div>

              <div className="md:col-span-3 space-y-1">
                <label className="block text-[11px] font-bold text-[#ECEBE4]/80">
                  Rol Asignado
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as "creator" | "admin")}
                  className="w-full px-3 py-2 bg-[#001E32] border border-[#425563] focus:border-[#FFC72C] rounded-xl text-xs text-white outline-none transition"
                >
                  <option value="creator">Creador (Estándar)</option>
                  <option value="admin">Administrador (Total)</option>
                </select>
              </div>

              <div className="md:col-span-3 flex items-end">
                <button
                  type="submit"
                  disabled={isCreatingInvite}
                  className="w-full bg-[#FFC72C] hover:bg-[#E6B327] disabled:opacity-50 text-[#001E32] font-black text-xs py-2.5 px-4 rounded-xl transition flex items-center justify-center gap-1.5 shadow active:scale-95 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{isCreatingInvite ? "Generando..." : "Generar Enlace"}</span>
                </button>
              </div>
            </form>

            {/* Banner de Enlace Generado para Copiar */}
            {latestInviteUrl && (
              <div className="mt-4 p-4 bg-[#001E32] border-2 border-[#FFC72C] rounded-xl space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-[#FFC72C] flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    Enlace de Invitación Listo para Compartir:
                  </span>
                  <span className="text-[10px] text-[#ECEBE4]/60">Válido por 7 días</span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={latestInviteUrl}
                    className="flex-1 px-3 py-2 bg-[#193750] border border-[#425563] rounded-lg text-xs text-white font-mono select-all outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopyLink(latestInviteUrl)}
                    className="bg-[#FFC72C] hover:bg-[#E6B327] text-[#001E32] font-black text-xs py-2 px-3.5 rounded-lg transition flex items-center gap-1.5 shrink-0 shadow active:scale-95 cursor-pointer"
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
                <p className="text-[11px] text-[#ECEBE4]/70">
                  Puedes enviar este enlace directamente por WhatsApp, Teams o correo personal a la persona invitada.
                </p>
              </div>
            )}
          </div>

          {/* Tabla de Invitaciones Emitidas */}
          <div className="bg-[#193750] border border-[#425563] rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-[#425563]/40 flex items-center justify-between">
              <h3 className="text-xs font-black text-white uppercase tracking-wider">
                Historial de Invitaciones
              </h3>
              <button
                type="button"
                onClick={fetchInvitations}
                className="text-xs text-[#ECEBE4]/60 hover:text-white flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Actualizar</span>
              </button>
            </div>

            {isLoadingInvites ? (
              <div className="py-8 text-center text-xs text-[#ECEBE4]/60">Cargando invitaciones...</div>
            ) : invitations.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#ECEBE4]/60">
                No se han emitido invitaciones todavía.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#001E32] text-[#ECEBE4]/80 uppercase tracking-wider font-extrabold border-b border-[#425563]">
                    <tr>
                      <th className="py-3 px-4">Correo Destino</th>
                      <th className="py-3 px-4">Rol</th>
                      <th className="py-3 px-4">Invitado por</th>
                      <th className="py-3 px-4">Estado</th>
                      <th className="py-3 px-4">Expira</th>
                      <th className="py-3 px-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#425563]/40">
                    {invitations.map((inv) => {
                      const isExpired = new Date(inv.expires_at) < new Date();
                      const isUsed = Boolean(inv.used_at);
                      const isRevoked = Boolean(inv.revoked_at);
                      const isActive = !isExpired && !isUsed && !isRevoked;

                      const inviteUrl = `${window.location.origin}/register?token=${inv.token}`;

                      return (
                        <tr key={inv.id} className="hover:bg-[#001E32]/60 transition-colors">
                          <td className="py-3 px-4 font-bold text-white">{inv.email}</td>
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
                          <td className="py-3 px-4 text-[#ECEBE4]/70">
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
                              <span className="text-[10px] font-bold text-[#ECEBE4]/50 flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" /> Expirada
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-[#FFC72C] flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" /> Pendiente
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-[#ECEBE4]/60 text-[11px]">
                            {new Date(inv.expires_at).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {isActive && (
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleCopyLink(inviteUrl)}
                                  className="p-1.5 text-[#FFC72C] hover:bg-[#FFC72C]/10 rounded-lg transition"
                                  title="Copiar enlace de invitación"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRevokeInvitation(inv.id)}
                                  className="p-1.5 text-[#B7312C]/70 hover:text-[#B7312C] hover:bg-[#B7312C]/10 rounded-lg transition"
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
      )}

      {/* =================================================================== */}
      {/* TAB 2: USUARIOS REGISTRADOS                                         */}
      {/* =================================================================== */}
      {activeTab === "users" && (
        <div className="space-y-4">
          {/* Banner de Enlace de Restablecimiento si se generó uno */}
          {resetModalUrl && (
            <div className="p-4 bg-[#001E32] border-2 border-[#48A9C5] rounded-xl space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-[#48A9C5] flex items-center gap-1.5">
                  <Key className="w-4 h-4" />
                  Enlace de Restablecimiento de Contraseña (Válido 24h):
                </span>
                <button
                  type="button"
                  onClick={() => setResetModalUrl(null)}
                  className="text-xs text-[#ECEBE4]/60 hover:text-white"
                >
                  Cerrar
                </button>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={resetModalUrl}
                  className="flex-1 px-3 py-2 bg-[#193750] border border-[#425563] rounded-lg text-xs text-white font-mono select-all outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleCopyLink(resetModalUrl, true)}
                  className="bg-[#48A9C5] hover:bg-[#3B8FA7] text-[#001E32] font-black text-xs py-2 px-3.5 rounded-lg transition flex items-center gap-1.5 shrink-0 shadow active:scale-95 cursor-pointer"
                >
                  {copiedReset ? (
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
            </div>
          )}

          <div className="bg-[#193750] border border-[#425563] rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-[#425563]/40 flex items-center justify-between">
              <h3 className="text-xs font-black text-white uppercase tracking-wider">
                Catálogo de Cuentas Activas e Inactivas
              </h3>
              <button
                type="button"
                onClick={fetchUsers}
                className="text-xs text-[#ECEBE4]/60 hover:text-white flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Actualizar</span>
              </button>
            </div>

            {isLoadingUsers ? (
              <div className="py-8 text-center text-xs text-[#ECEBE4]/60">Cargando usuarios...</div>
            ) : users.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#ECEBE4]/60">No hay usuarios registrados.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#001E32] text-[#ECEBE4]/80 uppercase tracking-wider font-extrabold border-b border-[#425563]">
                    <tr>
                      <th className="py-3 px-4">Usuario</th>
                      <th className="py-3 px-4">Nombre Completo</th>
                      <th className="py-3 px-4">Correo</th>
                      <th className="py-3 px-4">Rol</th>
                      <th className="py-3 px-4">Estado</th>
                      <th className="py-3 px-4">Fecha Registro</th>
                      <th className="py-3 px-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#425563]/40">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-[#001E32]/60 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-white">@{u.username}</td>
                        <td className="py-3 px-4 text-[#ECEBE4] font-medium">{u.full_name || "-"}</td>
                        <td className="py-3 px-4 text-[#ECEBE4]/80">{u.email}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${
                              u.role === "admin"
                                ? "bg-[#FFC72C]/10 text-[#FFC72C] border-[#FFC72C]/30"
                                : "bg-[#48A9C5]/10 text-[#48A9C5] border-[#48A9C5]/30"
                            }`}
                          >
                            {u.role === "admin" ? "Administrador" : "Creador"}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {u.is_active ? (
                            <span className="text-[10px] font-bold text-[#4C8C2B] flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Activo
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-[#B7312C] flex items-center gap-1">
                              <Ban className="w-3.5 h-3.5" /> Inactivo
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-[#ECEBE4]/60 text-[11px]">
                          {new Date(u.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleGenerateReset(u.id, u.username)}
                              className="p-1.5 text-[#48A9C5] hover:bg-[#48A9C5]/10 rounded-lg transition"
                              title="Generar enlace de restablecimiento de contraseña"
                            >
                              <Key className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleUserActive(u)}
                              className={`p-1.5 rounded-lg transition ${
                                u.is_active
                                  ? "text-[#B7312C]/70 hover:text-[#B7312C] hover:bg-[#B7312C]/10"
                                  : "text-[#4C8C2B] hover:bg-[#4C8C2B]/10"
                              }`}
                              title={u.is_active ? "Desactivar usuario" : "Activar usuario"}
                            >
                              {u.is_active ? (
                                <Ban className="w-3.5 h-3.5" />
                              ) : (
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsersPage;
