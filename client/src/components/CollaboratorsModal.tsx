import React, { useState, useEffect, useCallback } from "react";
import Modal from "./Modal";
import { UserPlus, Trash2, Shield, User, Check, AlertCircle, Search, X } from "lucide-react";


interface Collaborator {
  user_id: number;
  username: string;
  full_name: string | null;
  email: string;
  role: string;
  created_at: string;
}

interface RegisteredUser {
  id: number;
  username: string;
  full_name: string | null;
  email: string;
  role: string;
}

interface CollaboratorsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activityId: number | null;
  activityTitle: string;
  isOwnerOrAdmin: boolean;
}

export const CollaboratorsModal: React.FC<CollaboratorsModalProps> = ({
  isOpen,
  onClose,
  activityId,
  activityTitle,
  isOwnerOrAdmin,
}) => {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<RegisteredUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<RegisteredUser | null>(null);
  const [searchFilter, setSearchFilter] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchCollaborators = useCallback(async () => {
    if (!activityId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/epivox/activities/${activityId}/collaborators`);
      if (res.ok) {
        const data = await res.json();
        setCollaborators(data);
      }
    } catch {
      // Ignorar
    } finally {
      setIsLoading(false);
    }
  }, [activityId]);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/epivox/users/search");
      if (res.ok) {
        const data = await res.json();
        setAvailableUsers(data);
      }
    } catch {
      // Ignorar
    }
  }, []);

  useEffect(() => {
    if (isOpen && activityId) {
      setErrorMsg(null);
      setSuccessMsg(null);
      setSelectedUser(null);
      setSearchFilter("");
      setIsDropdownOpen(false);
      fetchCollaborators();
      fetchUsers();
    }
  }, [isOpen, activityId, fetchCollaborators, fetchUsers]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityId) return;
    const targetValue = selectedUser ? selectedUser.username : searchFilter.trim();
    if (!targetValue) {
      setErrorMsg("Selecciona o escribe un usuario para invitar.");
      return;
    }

    setErrorMsg(null);
    setSuccessMsg(null);
    setIsAdding(true);

    try {
      const res = await fetch(`/api/epivox/activities/${activityId}/collaborators`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usernameOrEmail: targetValue }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Error al agregar colaborador");
        return;
      }
      setSuccessMsg("Colaborador agregado exitosamente.");
      setSelectedUser(null);
      setSearchFilter("");
      setIsDropdownOpen(false);
      setCollaborators(data.collaborators || []);
    } catch {
      setErrorMsg("Error de conexión");
    } finally {
      setIsAdding(false);
    }
  };


  const handleRemove = async (userId: number) => {
    if (!activityId) return;
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/epivox/activities/${activityId}/collaborators/${userId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        setErrorMsg(data.error || "Error al remover colaborador");
        return;
      }
      setCollaborators((prev) => prev.filter((c) => c.user_id !== userId));
      setSuccessMsg("Colaborador removido");
    } catch {
      setErrorMsg("Error de conexión");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Colaboradores de la Presentación"
      description={`Gestiona quién puede ver y editar "${activityTitle}"`}
      maxWidth="lg"
      footer={
        <button
          type="button"
          onClick={onClose}
          className="bg-[#001E32] hover:bg-[#254F72] text-[#ECEBE4] border border-[#425563] font-bold text-xs py-2 px-4 rounded-xl transition"
        >
          Cerrar
        </button>
      }
    >
      <div className="space-y-5">
        {errorMsg && (
          <div className="flex items-start gap-2 p-3 bg-[#B7312C]/20 border border-[#B7312C]/40 rounded-xl text-xs text-[#ECEBE4]">
            <AlertCircle className="w-4 h-4 text-[#B7312C] shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-center gap-2 p-3 bg-[#4C8C2B]/20 border border-[#4C8C2B]/40 rounded-xl text-xs text-[#ECEBE4]">
            <Check className="w-4 h-4 text-[#4C8C2B] shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Formulario para añadir colaborador */}
        {isOwnerOrAdmin && (
          <form onSubmit={handleAdd} className="space-y-2 pt-1">
            <label className="block text-xs font-bold text-[#ECEBE4]/90">
              Buscar e Invitar Usuario Registrado
            </label>

            <div className="relative">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-[#ECEBE4]/40 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={selectedUser ? `${selectedUser.full_name || selectedUser.username} (${selectedUser.email})` : searchFilter}
                    onChange={(e) => {
                      if (selectedUser) setSelectedUser(null);
                      setSearchFilter(e.target.value);
                      setIsDropdownOpen(true);
                    }}
                    onFocus={() => setIsDropdownOpen(true)}
                    placeholder="Buscar por nombre, usuario (@) o correo..."
                    className="w-full pl-9 pr-8 py-2.5 bg-[#001E32] border border-[#425563] focus:border-[#FFC72C] rounded-xl text-xs text-white placeholder-[#ECEBE4]/40 outline-none transition"
                  />
                  {(searchFilter || selectedUser) && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedUser(null);
                        setSearchFilter("");
                        setIsDropdownOpen(false);
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#ECEBE4]/50 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isAdding || (!selectedUser && !searchFilter.trim())}
                  className="bg-[#FFC72C] hover:bg-[#E6B327] disabled:opacity-50 text-[#001E32] font-black text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 shrink-0 shadow active:scale-95 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{isAdding ? "Añadiendo..." : "Invitar"}</span>
                </button>
              </div>

              {/* Menú desplegable con usuarios registrados */}
              {isDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsDropdownOpen(false)}
                  />
                  <div className="absolute left-0 right-16 top-full mt-1 bg-[#193750] border-2 border-[#425563] rounded-xl shadow-2xl max-h-56 overflow-y-auto z-50 divide-y divide-[#425563]/40">
                    {availableUsers
                      .filter((u) => !collaborators.some((c) => c.user_id === u.id))
                      .filter((u) => {
                        if (!searchFilter.trim() || selectedUser) return true;
                        const term = searchFilter.toLowerCase();
                        return (
                          u.username.toLowerCase().includes(term) ||
                          (u.full_name && u.full_name.toLowerCase().includes(term)) ||
                          u.email.toLowerCase().includes(term)
                        );
                      })
                      .map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => {
                            setSelectedUser(u);
                            setSearchFilter(u.username);
                            setIsDropdownOpen(false);
                          }}
                          className="w-full flex items-center justify-between p-3 text-left hover:bg-[#001E32] transition group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-[#FFC72C]/20 border border-[#FFC72C]/40 text-[#FFC72C] font-black text-xs flex items-center justify-center shrink-0">
                              {(u.full_name || u.username)[0]?.toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <span className="text-xs font-bold text-white block truncate group-hover:text-[#FFC72C]">
                                {u.full_name || u.username}
                              </span>
                              <span className="text-[10px] text-[#ECEBE4]/60 block truncate">
                                @{u.username} • {u.email}
                              </span>
                            </div>
                          </div>
                          <span className="text-[10px] bg-[#001E32] text-[#48A9C5] border border-[#48A9C5]/30 px-2 py-0.5 rounded shrink-0">
                            {u.role}
                          </span>
                        </button>
                      ))}

                    {availableUsers
                      .filter((u) => !collaborators.some((c) => c.user_id === u.id))
                      .filter((u) => {
                        if (!searchFilter.trim() || selectedUser) return true;
                        const term = searchFilter.toLowerCase();
                        return (
                          u.username.toLowerCase().includes(term) ||
                          (u.full_name && u.full_name.toLowerCase().includes(term)) ||
                          u.email.toLowerCase().includes(term)
                        );
                      }).length === 0 && (
                      <div className="p-4 text-center text-xs text-[#ECEBE4]/50">
                        No se encontraron usuarios disponibles para invitar.
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <p className="text-[11px] text-[#ECEBE4]/60">
              Selecciona cualquier usuario registrado en Epivox para otorgarle permisos de edición.
            </p>
          </form>
        )}


        {/* Lista de colaboradores actuales */}
        <div className="space-y-2 pt-2 border-t border-[#425563]/40">
          <h4 className="text-xs font-bold text-[#ECEBE4]/80 uppercase tracking-wider">
            Personas con Acceso ({collaborators.length})
          </h4>

          {isLoading ? (
            <div className="py-6 text-center text-xs text-[#ECEBE4]/60">
              Cargando colaboradores...
            </div>
          ) : collaborators.length === 0 ? (
            <div className="p-4 bg-[#001E32]/50 border border-[#425563]/40 rounded-xl text-center text-xs text-[#ECEBE4]/60">
              Esta presentación no tiene colaboradores asignados aún. Solo tú (y el Administrador) tienen acceso.
            </div>
          ) : (
            <div className="divide-y divide-[#425563]/30 border border-[#425563]/40 rounded-xl overflow-hidden bg-[#001E32]/40">
              {collaborators.map((collab) => (
                <div
                  key={collab.user_id}
                  className="flex items-center justify-between p-3 text-xs hover:bg-[#001E32]/70 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-[#48A9C5]/20 text-[#48A9C5] flex items-center justify-center shrink-0">
                      <User className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-bold text-white truncate">
                        {collab.full_name || collab.username}
                      </span>
                      <span className="text-[10px] text-[#ECEBE4]/60 truncate">
                        @{collab.username} &bull; {collab.email}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-[#48A9C5]/10 text-[#48A9C5] border border-[#48A9C5]/30 flex items-center gap-1">
                      <Shield className="w-2.5 h-2.5" />
                      Editor
                    </span>
                    {isOwnerOrAdmin && (
                      <button
                        type="button"
                        onClick={() => handleRemove(collab.user_id)}
                        className="p-1.5 text-[#B7312C]/70 hover:text-[#B7312C] hover:bg-[#B7312C]/10 rounded-lg transition"
                        title="Quitar acceso de edición"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default CollaboratorsModal;
