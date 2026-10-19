import React, { useState, useEffect, useCallback } from "react";
import PageHeader from "../../components/PageHeader";
import { Users, UserPlus, ShieldCheck, AlertCircle, Check } from "lucide-react";
import { UserItem, InvitationItem } from "./types";
import { InvitationsTab } from "./components/InvitationsTab";
import { UsersTableTab } from "./components/UsersTableTab";

export const AdminUsersPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"invitations" | "users">(
    "invitations",
  );

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
        setSuccessMsg(
          `¡Invitación enviada por correo exitosamente a ${targetEmail}!`,
        );
      } else {
        setSuccessMsg(
          "¡Enlace de invitación generado! Puedes copiar el enlace a continuación.",
        );
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
      const res = await fetch(`/api/admin/invitations/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setInvitations((prev) =>
          prev.map((inv) =>
            inv.id === id
              ? { ...inv, revoked_at: new Date().toISOString() }
              : inv,
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
          prev.map((u) =>
            u.id === user.id ? { ...u, is_active: !user.is_active } : u,
          ),
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
          setSuccessMsg(
            `¡Enlace generado y enviado por correo a @${username}!`,
          );
        } else {
          setSuccessMsg(
            `Enlace de restablecimiento generado para @${username}`,
          );
        }
      } else {
        setErrorMsg(
          data.error || "Error al generar enlace de restablecimiento",
        );
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
        <div className="flex items-start gap-2.5 p-3.5 bg-[#B7312C]/10 border border-[#B7312C]/30 rounded-2xl text-xs text-[#B7312C]">
          <AlertCircle className="w-4 h-4 text-[#B7312C] shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-2.5 p-3.5 bg-[#4C8C2B]/10 border border-[#4C8C2B]/30 rounded-2xl text-xs text-[#4C8C2B]">
          <Check className="w-4 h-4 text-[#4C8C2B] shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Tabs Selector */}
      <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("invitations")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition cursor-pointer ${
            activeTab === "invitations"
              ? "bg-[#FFC72C] text-[#001E32] shadow-sm font-extrabold"
              : "text-[var(--text-subtle)] hover:text-[var(--text-main)] hover:bg-[var(--surface-hover)]"
          }`}
        >
          <UserPlus className="w-4 h-4" />
          <span>Invitaciones ({invitations.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("users")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition cursor-pointer ${
            activeTab === "users"
              ? "bg-[#FFC72C] text-[#001E32] shadow-sm font-extrabold"
              : "text-[var(--text-subtle)] hover:text-[var(--text-main)] hover:bg-[var(--surface-hover)]"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Usuarios Registrados ({users.length})</span>
        </button>
      </div>

      {activeTab === "invitations" ? (
        <InvitationsTab
          invitations={invitations}
          isLoadingInvites={isLoadingInvites}
          inviteEmail={inviteEmail}
          setInviteEmail={setInviteEmail}
          inviteRole={inviteRole}
          setInviteRole={setInviteRole}
          isCreatingInvite={isCreatingInvite}
          latestInviteUrl={latestInviteUrl}
          copiedInvite={copiedInvite}
          handleCreateInvitation={handleCreateInvitation}
          handleCopyLink={handleCopyLink}
          handleRevokeInvitation={handleRevokeInvitation}
          fetchInvitations={fetchInvitations}
        />
      ) : (
        <UsersTableTab
          users={users}
          isLoadingUsers={isLoadingUsers}
          resetModalUrl={resetModalUrl}
          setResetModalUrl={setResetModalUrl}
          copiedReset={copiedReset}
          handleCopyLink={handleCopyLink}
          handleGenerateReset={handleGenerateReset}
          handleToggleUserActive={handleToggleUserActive}
          fetchUsers={fetchUsers}
        />
      )}
    </div>
  );
};

export default AdminUsersPage;
