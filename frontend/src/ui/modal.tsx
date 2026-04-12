import { twMerge } from "tailwind-merge";
import type { ComponentProps, ReactNode } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeClass = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-3xl",
};

export function Modal({
  open,
  onClose,
  title,
  children,
  size = "sm",
}: ModalProps) {
  if (!open) return null;
  return (
    <div
      data-slot="modal-backdrop"
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        data-slot="modal"
        className={twMerge(
          "bg-brand-deepest border border-border-subtle rounded p-6 w-full space-y-4",
          sizeClass[size],
        )}
      >
        {title && <ModalTitle>{title}</ModalTitle>}
        {children}
      </div>
    </div>
  );
}

export function ModalTitle({ className, ...props }: ComponentProps<"h2">) {
  return (
    <h2
      data-slot="modal-title"
      className={twMerge(
        "text-xs tracking-widest uppercase text-text-muted",
        className,
      )}
      {...props}
    />
  );
}

export function ModalFooter({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="modal-footer"
      className={twMerge("flex gap-3 justify-end pt-2", className)}
      {...props}
    />
  );
}
