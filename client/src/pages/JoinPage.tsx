import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Sparkles,
  Dices,
  ArrowRight,
  ShieldCheck,
  HardHat,
  Pickaxe,
  Truck,
  Award,
} from "lucide-react";
import { getSocket } from "../services/socket";

const DEFAULT_AVATARS = [
  { id: "hardhat", icon: HardHat, label: "Casco" },
  { id: "pickaxe", icon: Pickaxe, label: "Pico" },
  { id: "truck", icon: Truck, label: "Camión" },
  { id: "shield", icon: ShieldCheck, label: "Seguridad" },
  { id: "award", icon: Award, label: "Líder" },
];

const RANDOM_NICKNAMES = [
  "Explorador Epiroc",
  "Perforador Pro",
  "Operador Smart",
  "Líder Cero Daño",
  "Experto Hidráulico",
  "Maestro Minero",
  "Innovador Andino",
  "Especialista Rig",
];

export default function JoinPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [pin, setPin] = useState(searchParams.get("pin") || "");
  const [nickname, setNickname] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("hardhat");
  const [department, setDepartment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Generar un nickname sugerido al inicio
    const randomNick =
      RANDOM_NICKNAMES[Math.floor(Math.random() * RANDOM_NICKNAMES.length)];
    setNickname(randomNick);
  }, []);

  const handleRandomizeNick = () => {
    const randomNick =
      RANDOM_NICKNAMES[Math.floor(Math.random() * RANDOM_NICKNAMES.length)];
    setNickname(randomNick);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim() || pin.length < 6) {
      setError("Por favor ingresa un código PIN válido de 6 dígitos.");
      return;
    }
    if (!nickname.trim()) {
      setError("Por favor ingresa un nombre o apodo.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    const socket = getSocket();
    socket.emit("participant:join", {
      pin: pin.trim(),
      nickname: nickname.trim(),
      avatarSeed: selectedAvatar,
      department: department.trim() || undefined,
    });

    socket.once(
      "participant:joined",
      (data: {
        participant: { id: number; nickname: string; score: number };
        session: { pin: string };
      }) => {
        setIsSubmitting(false);
        // Guardar en sessionStorage para reconexiones
        sessionStorage.setItem(
          "epivox_participant",
          JSON.stringify(data.participant),
        );
        sessionStorage.setItem("epivox_session_pin", data.session.pin);
        navigate(`/live/${data.session.pin}`);
      },
    );

    socket.once("error:message", (err: { message: string }) => {
      setIsSubmitting(false);
      setError(err.message || "Error al unirse a la sesión.");
    });
  };

  return (
    <div className="min-h-screen bg-[#001E32] text-white flex flex-col justify-between p-4 selection:bg-[#FFC72C] selection:text-[#001E32]">
      {/* Header Institucional Epiroc */}
      <header className="flex items-center justify-between py-2 border-b border-[#425563]">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-[#FFC72C] text-[#001E32] rounded-lg shadow">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="font-extrabold tracking-wider text-xl text-white">
            EPIVOX
          </span>
        </div>
        <span className="text-xs uppercase tracking-widest text-[#ECEBE4] font-semibold bg-[#193750] px-3 py-1 rounded-full border border-[#425563]">
          Epiroc Participante
        </span>
      </header>

      {/* Tarjeta de Ingreso */}
      <main className="max-w-md w-full mx-auto my-auto bg-[#193750] border border-[#425563] rounded-2xl p-6 shadow-2xl space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-white">Unirse a la Sesión</h1>
          <p className="text-sm text-[#ECEBE4] opacity-80">
            Ingresa el PIN que ves en la pantalla grande
          </p>
        </div>

        {error && (
          <div className="bg-[#B7312C]/20 border border-[#B7312C] text-white text-sm p-3 rounded-xl text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* PIN Input */}
          <div>
            <label
              htmlFor="pin-input"
              className="block text-xs uppercase tracking-wider text-[#ECEBE4] font-bold mb-1"
            >
              Código PIN (6 dígitos)
            </label>
            <input
              id="pin-input"
              type="text"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
              className="w-full text-center text-3xl font-mono tracking-widest py-3 px-4 rounded-xl bg-[#001E32] border-2 border-[#425563] focus:border-[#FFC72C] text-white focus:outline-none transition"
              required
            />
          </div>

          {/* Nickname Input con botón aleatorio */}
          <div>
            <label
              htmlFor="nickname-input"
              className="block text-xs uppercase tracking-wider text-[#ECEBE4] font-bold mb-1"
            >
              Tu Nombre o Apodo
            </label>
            <div className="flex space-x-2">
              <input
                id="nickname-input"
                type="text"
                maxLength={25}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Ej. Juan Pérez"
                className="flex-1 py-3 px-4 rounded-xl bg-[#001E32] border border-[#425563] focus:border-[#FFC72C] text-white focus:outline-none text-base"
                required
              />
              <button
                type="button"
                onClick={handleRandomizeNick}
                title="Sugerir nombre aleatorio"
                className="p-3 bg-[#425563] hover:bg-[#536B7C] text-[#FFC72C] rounded-xl transition"
              >
                <Dices className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Selector de Avatar */}
          <div>
            <span className="block text-xs uppercase tracking-wider text-[#ECEBE4] font-bold mb-2">
              Elige tu Avatar
            </span>
            <div className="grid grid-cols-5 gap-2">
              {DEFAULT_AVATARS.map((av) => {
                const IconComponent = av.icon;
                const isSelected = selectedAvatar === av.id;
                return (
                  <button
                    key={av.id}
                    type="button"
                    onClick={() => setSelectedAvatar(av.id)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border transition ${
                      isSelected
                        ? "bg-[#FFC72C] text-[#001E32] border-[#FFC72C] shadow-lg scale-105"
                        : "bg-[#001E32] text-[#ECEBE4] border-[#425563] hover:border-[#FFC72C]"
                    }`}
                  >
                    <IconComponent className="w-6 h-6" />
                    <span className="text-[10px] mt-1 font-semibold truncate">
                      {av.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Departamento Opcional */}
          <div>
            <label
              htmlFor="dept-input"
              className="block text-xs uppercase tracking-wider text-[#ECEBE4] font-bold mb-1"
            >
              Área / Faena (Opcional)
            </label>
            <input
              id="dept-input"
              type="text"
              maxLength={30}
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="Ej. Taller Central / Mina Subterránea"
              className="w-full py-2.5 px-3 rounded-xl bg-[#001E32] border border-[#425563] focus:border-[#FFC72C] text-sm text-white focus:outline-none"
            />
          </div>

          {/* Botón de Enviar */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 flex items-center justify-center space-x-2 bg-[#FFC72C] hover:bg-[#E6B327] text-[#001E32] font-extrabold text-lg py-4 px-6 rounded-xl transition duration-200 shadow-xl disabled:opacity-50"
          >
            <span>{isSubmitting ? "Conectando..." : "Entrar a la Sala"}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>
      </main>

      {/* Footer */}
      <footer className="text-center py-2 text-xs text-[#ECEBE4] opacity-70">
        Epiroc Chile S.A.C. &bull; Herramienta de Participación Corporativa
      </footer>
    </div>
  );
}
