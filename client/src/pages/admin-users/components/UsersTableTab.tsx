import React from "react";
import { Key, RefreshCw, CheckCircle2, Ban, Check, Copy } from "lucide-react";
import { UserItem } from "../types";

interface UsersTableTabProps {
  users: UserItem[];
  isLoadingUsers: boolean;
  resetModalUrl: string | null;
  setResetModalUrl: (url: string | null) => void;
  copiedReset: boolean;
  handleCopyLink: (url: string, isReset?: boolean) => void;
  handleGenerateReset: (userId: number, username: string) => void;
  handleToggleUserActive: (user: UserItem) => void;
  fetchUsers: () => void;
}

export const UsersTableTab: React.FC<UsersTableTabProps> = ({
  users,
  isLoadingUsers,
  resetModalUrl,
  setResetModalUrl,
  copiedReset,
  handleCopyLink,
  handleGenerateReset,
  handleToggleUserActive,
  fetchUsers,
}) => {
  return (
    <div className="space-y-4">
      {/* Banner de Enlace de Restablecimiento si se generó uno */}
      {resetModalUrl && (
        <div className="p-4 bg-[var(--surface-subtle)] border-2 border-[#48A9C5] rounded-xl space-y-2 animate-in fade-in">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-[#48A9C5] flex items-center gap-1.5">
              <Key className="w-4 h-4" />
              Enlace de Restablecimiento de Contraseña (Válido 24h):
            </span>
            <button
              type="button"
              onClick={() => setResetModalUrl(null)}
              className="text-xs text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer"
            >
              Cerrar
            </button>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={resetModalUrl}
              className="flex-1 px-3 py-2 bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-lg text-xs text-[var(--text-main)] font-mono select-all outline-none"
            />
            <button
              type="button"
              onClick={() => handleCopyLink(resetModalUrl, true)}
              className="bg-[#48A9C5] hover:bg-[#3B8FA7] text-[#001E32] font-black text-xs py-2 px-3.5 rounded-lg transition flex items-center gap-1.5 shrink-0 shadow-sm active:scale-95 cursor-pointer"
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

      <div className="bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
          <h3 className="text-xs font-black text-[var(--text-main)] uppercase tracking-wider">
            Catálogo de Cuentas Activas e Inactivas
          </h3>
          <button
            type="button"
            onClick={fetchUsers}
            className="text-xs text-[var(--text-muted)] hover:text-[var(--text-main)] flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Actualizar</span>
          </button>
        </div>

        {isLoadingUsers ? (
          <div className="py-8 text-center text-xs text-[var(--text-muted)]">
            Cargando usuarios...
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-xs text-[var(--text-muted)]">
            No hay usuarios registrados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--surface-subtle)] text-[var(--text-subtle)] uppercase tracking-wider font-extrabold border-b border-[var(--border-subtle)]">
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
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {users.map((u) => (
                  <tr
                    key={u.id}
                    className="hover:bg-[var(--surface-hover)] transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-[var(--text-main)]">
                      @{u.username}
                    </td>
                    <td className="py-3 px-4 text-[var(--text-subtle)] font-medium">
                      {u.full_name || "-"}
                    </td>
                    <td className="py-3 px-4 text-[var(--text-subtle)]">
                      {u.email}
                    </td>
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
                    <td className="py-3 px-4 text-[var(--text-muted)] text-[11px]">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleGenerateReset(u.id, u.username)}
                          className="p-1.5 text-[#48A9C5] hover:bg-[#48A9C5]/10 rounded-lg transition cursor-pointer"
                          title="Generar enlace de restablecimiento de contraseña"
                        >
                          <Key className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleUserActive(u)}
                          className={`p-1.5 rounded-lg transition cursor-pointer ${
                            u.is_active
                              ? "text-[#B7312C]/70 hover:text-[#B7312C] hover:bg-[#B7312C]/10"
                              : "text-[#4C8C2B] hover:bg-[#4C8C2B]/10"
                          }`}
                          title={
                            u.is_active
                              ? "Desactivar usuario"
                              : "Activar usuario"
                          }
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
  );
};
