import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { MoreHorizontal } from "lucide-react";
import type { ReactNode } from "react";
import { twMerge } from "tailwind-merge";
import { buttonVariants } from "./button";

export interface RowAction {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  danger?: boolean;
}

interface RowActionsProps {
  actions: RowAction[];
}

export function RowActions({ actions }: RowActionsProps) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      )
        return;
      setOpen(false);
    }
    function onScroll() {
      setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open]);

  function handleOpen(e: React.MouseEvent) {
    e.stopPropagation();
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setCoords({ top: rect.bottom + 4, left: rect.right });
    setOpen((v) => !v);
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        data-slot="row-actions-trigger"
        aria-label="Ações"
        onClick={handleOpen}
        className={twMerge(buttonVariants({ variant: "ghost", size: "sm" }))}
      >
        <MoreHorizontal className="size-3" />
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            data-slot="row-actions-menu"
            style={{ top: coords.top, left: coords.left }}
            className="fixed z-9999 -translate-x-full min-w-40 rounded-md border border-border-subtle bg-surface shadow-lg py-1"
          >
            {actions.map((action) => (
              <button
                key={action.label}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  action.onClick();
                  setOpen(false);
                }}
                className={twMerge(
                  "flex w-full items-center gap-2 px-3 py-2 text-xs transition-colors cursor-pointer",
                  "hover:bg-surface-input focus-visible:outline-none focus-visible:bg-surface-input",
                  action.danger
                    ? "text-error"
                    : "text-text-muted hover:text-text",
                )}
              >
                {action.icon && (
                  <span className="[&_svg]:size-3 shrink-0">{action.icon}</span>
                )}
                {action.label}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </>
  );
}
