import { twMerge } from "tailwind-merge";
import type { ComponentProps, ReactNode } from "react";

const inputClass =
  "w-full bg-surface-input border border-border-subtle rounded px-3 py-2 text-xs text-text outline-none focus:border-border placeholder:text-text-ghost focus-visible:ring-2 focus-visible:ring-border-focus";

const labelClass = "text-[10px] tracking-widest uppercase text-text-subtle";

export function FormLabel({ className, ...props }: ComponentProps<"label">) {
  return (
    <label
      data-slot="form-label"
      className={twMerge(labelClass, className)}
      {...props}
    />
  );
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p data-slot="form-error" className="text-[10px] text-error">
      {message}
    </p>
  );
}

export function FormInput({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      data-slot="form-input"
      className={twMerge(inputClass, className)}
      {...props}
    />
  );
}

export function FormSelect({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <select
      data-slot="form-select"
      className={twMerge(inputClass, className)}
      {...props}
    >
      {children}
    </select>
  );
}

interface FieldProps {
  label: string;
  error?: string;
  children: ReactNode;
}

export function Field({ label, error, children }: FieldProps) {
  return (
    <div data-slot="field" className="space-y-1">
      <FormLabel>{label}</FormLabel>
      {children}
      <FormError message={error} />
    </div>
  );
}
