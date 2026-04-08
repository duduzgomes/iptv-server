import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "default" | "primary" | "danger" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: ReactNode;
}

const variantClass: Record<Variant, string> = {
  default:
    "text-[10px] tracking-widest uppercase border border-[#1f1f1f] px-3 py-1.5 rounded hover:border-[#333] transition-colors disabled:opacity-40",
  primary:
    "text-[10px] tracking-widest uppercase bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded transition-colors disabled:opacity-40",
  danger:
    "text-[10px] tracking-widest uppercase border border-[#1f1f1f] px-3 py-1.5 rounded hover:border-red-900 text-red-500 transition-colors disabled:opacity-40",
  ghost:
    "text-[10px] tracking-widest uppercase text-[#444] hover:text-[#ccc] transition-colors disabled:opacity-40",
};

export function Button({ variant = "default", children, className, ...props }: ButtonProps) {
  return (
    <button {...props} className={`${variantClass[variant]} ${className ?? ""}`}>
      {children}
    </button>
  );
}
