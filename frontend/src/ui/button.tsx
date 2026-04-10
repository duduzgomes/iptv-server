import { tv, type VariantProps } from "tailwind-variants";
import { twMerge } from "tailwind-merge";
import type { ComponentProps } from "react";

export const buttonVariants = tv({
  base: [
    "inline-flex cursor-pointer items-center justify-center",
    "text-[10px] tracking-widest uppercase rounded transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus",
    "disabled:pointer-events-none disabled:opacity-40",
  ],
  variants: {
    variant: {
      default: "border border-border-subtle hover:border-border",
      primary: "bg-primary hover:bg-primary-hover text-primary-fg",
      danger: "border border-border-subtle text-error hover:border-error-bg",
      ghost: "text-text-subtle hover:text-text",
    },
    size: {
      sm: "h-6 px-2 gap-1.5 [&_svg]:size-3",
      md: "h-7 px-3 gap-2 [&_svg]:size-3.5",
      lg: "h-9 px-4 gap-2.5 [&_svg]:size-4",
    },
  },
  defaultVariants: { variant: "default", size: "md" },
});

export interface ButtonProps
  extends ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {}

export function Button({
  className,
  variant,
  size,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      data-slot="button"
      data-disabled={disabled ? "" : undefined}
      disabled={disabled}
      className={twMerge(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {children}
    </button>
  );
}
