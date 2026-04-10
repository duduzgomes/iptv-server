import { twMerge } from "tailwind-merge";
import type { ComponentProps, ReactNode } from "react";

const inputClass =
  "w-full bg-surface-input rounded px-3 py-2 text-sm text-text outline-none placeholder:text-text-ghost";

const labelClass = "text-sm tracking-widest uppercase text-text-subtle";

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
    <p data-slot="form-error" className="text-xs text-error">
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

interface FieldProps {
  label: string;
  error?: string;
  children: ReactNode;
}

export function Field({ label, error, children }: FieldProps) {
  return (
    <div data-slot="field" className="space-y-2">
      <FormLabel>{label}</FormLabel>
      {children}
      <FormError message={error} />
    </div>
  );
}
