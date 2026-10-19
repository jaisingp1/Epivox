import React from "react";
import Modal from "../../../components/Modal";

interface QrCodeModalProps {
  qrModalUrl: string | null;
  onClose: () => void;
}

export const QrCodeModal: React.FC<QrCodeModalProps> = ({
  qrModalUrl,
  onClose,
}) => {
  return (
    <Modal
      isOpen={Boolean(qrModalUrl)}
      onClose={onClose}
      title="Código QR del Sondeo"
      maxWidth="sm"
    >
      <div className="flex flex-col items-center justify-center p-4 space-y-4 text-center">
        {qrModalUrl && (
          <img
            src={qrModalUrl}
            alt="QR del Sondeo"
            className="w-64 h-64 rounded-2xl border-4 border-[#FFC72C] shadow-lg"
          />
        )}
        <p className="text-xs text-[var(--text-subtle)]">
          Los participantes se conectan una sola vez y van respondiendo todo el
          set de preguntas en vivo.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="w-full bg-[#FFC72C] hover:bg-[#E6B327] text-[#001E32] font-black py-2.5 rounded-xl text-xs transition cursor-pointer shadow-sm"
        >
          Cerrar
        </button>
      </div>
    </Modal>
  );
};
