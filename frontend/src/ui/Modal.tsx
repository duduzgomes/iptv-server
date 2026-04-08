import type { ReactNode } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg";
}

const sizeClass = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
};

export function Modal({ open, onClose, title, children, size = "sm" }: ModalProps) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={`bg-[#0d0d0d] border border-[#1f1f1f] rounded p-6 w-full ${sizeClass[size]} space-y-4`}>
        {title && (
          <h2 className="text-xs tracking-widest uppercase text-[#666]">
            {title}
          </h2>
        )}
        {children}
      </div>
    </div>
  );
}
