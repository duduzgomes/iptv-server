import type { ReactNode, SelectHTMLAttributes, InputHTMLAttributes } from "react";
import { forwardRef } from "react";

const inputClass =
  "w-full bg-[#141414] border border-[#1f1f1f] rounded px-3 py-2 text-xs text-[#ccc] outline-none focus:border-[#333] placeholder:text-[#333]";

const labelClass = "text-[10px] tracking-widest uppercase text-[#444]";

export function FormLabel({ children }: { children: ReactNode }) {
  return <label className={labelClass}>{children}</label>;
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-[10px] text-red-500">{message}</p>;
}

export const FormInput = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(function FormInput(props, ref) {
  return <input ref={ref} {...props} className={`${inputClass} ${props.className ?? ""}`} />;
});

export const FormSelect = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement>
>(function FormSelect({ children, ...props }, ref) {
  return (
    <select ref={ref} {...props} className={`${inputClass} ${props.className ?? ""}`}>
      {children}
    </select>
  );
});

interface FieldProps {
  label: string;
  error?: string;
  children: ReactNode;
}

export function Field({ label, error, children }: FieldProps) {
  return (
    <div className="space-y-1">
      <FormLabel>{label}</FormLabel>
      {children}
      <FormError message={error} />
    </div>
  );
}
