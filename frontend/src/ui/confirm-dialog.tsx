import { twMerge } from "tailwind-merge";
import { Modal, ModalFooter } from "./modal";

interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  danger?: boolean;
}

export function ConfirmDialog({
  open,
  title = "Confirmar",
  message,
  confirmLabel = "Confirmar",
  onConfirm,
  onCancel,
  loading = false,
  danger = true,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onCancel} title={title}>
      <p data-slot="confirm-message" className="text-[10px] text-text-subtle">
        {message}
      </p>
      <ModalFooter>
        <button
          type="button"
          data-slot="cancel-button"
          onClick={onCancel}
          className="text-[10px] tracking-widest uppercase text-text-subtle hover:text-text transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus"
        >
          Cancelar
        </button>
        <button
          type="button"
          data-slot="confirm-button"
          onClick={onConfirm}
          disabled={loading}
          className={twMerge(
            "text-[10px] tracking-widest uppercase border border-border-subtle px-3 py-1.5 rounded transition-colors disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus",
            danger
              ? "hover:border-error-bg text-error"
              : "hover:border-border text-text",
          )}
        >
          {loading ? "Aguarde..." : confirmLabel}
        </button>
      </ModalFooter>
    </Modal>
  );
}
