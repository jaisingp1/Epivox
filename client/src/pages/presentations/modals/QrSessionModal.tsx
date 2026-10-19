import Modal from "../../../components/Modal";

interface QrSessionModalProps {
  qrModalUrl: string | null;
  onClose: () => void;
}

export default function QrSessionModal({
  qrModalUrl,
  onClose,
}: QrSessionModalProps) {
  return (
    <Modal
      isOpen={Boolean(qrModalUrl)}
      onClose={onClose}
      title="Escanear Código QR para Unirse"
      maxWidth="sm"
    >
      <div className="flex flex-col items-center justify-center p-4 space-y-4 text-center">
        {qrModalUrl && (
          <img
            src={qrModalUrl}
            alt="Código QR de la Sesión"
            className="w-64 h-64 rounded-2xl border-4 border-[#FFC72C] shadow-2xl"
          />
        )}
        <p className="text-xs text-[var(--text-subtle)]">
          Pide a los asistentes apuntar la cámara de su teléfono para unirse
          directamente sin escribir el PIN.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="w-full bg-[#FFC72C] text-[#001E32] font-black py-2 rounded-xl text-xs cursor-pointer"
        >
          Cerrar
        </button>
      </div>
    </Modal>
  );
}
