import { useState, useEffect, useRef, Children, isValidElement } from "react";
import { twMerge } from "tailwind-merge";
import { ChevronDown } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

interface SelectOption {
  value: string;
  label: string;
}

function parseOptions(children: ReactNode): SelectOption[] {
  const options: SelectOption[] = [];
  Children.forEach(children, (child) => {
    if (isValidElement(child) && child.type === "option") {
      const props = child.props as { value?: unknown; children?: ReactNode };
      options.push({
        value: String(props.value ?? ""),
        label: String(props.children ?? ""),
      });
    }
  });
  return options;
}

const triggerClass =
  "w-full bg-surface-input rounded px-3 py-2 text-sm text-text outline-none flex items-center justify-between gap-2 cursor-pointer";

export function FormSelect({
  className,
  children,
  value,
  defaultValue,
  onChange,
  ref,
  ...restProps
}: ComponentProps<"select">) {
  const [open, setOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(
    String(defaultValue ?? ""),
  );
  const containerRef = useRef<HTMLDivElement>(null);

  const options = parseOptions(children);
  const currentValue = value !== undefined ? String(value) : internalValue;
  const selectedOption = options.find((o) => o.value === currentValue);

  useEffect(() => {
    if (value !== undefined) setInternalValue(String(value));
  }, [value]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function handleSelect(val: string) {
    setInternalValue(val);
    setOpen(false);
    onChange?.({
      target: { value: val, name: restProps.name ?? "" },
    } as React.ChangeEvent<HTMLSelectElement>);
  }

  return (
    <div ref={containerRef} data-slot="form-select" className="relative">
      <select
        ref={ref}
        value={currentValue}
        onChange={() => {}}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        {...restProps}
      >
        {children}
      </select>

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={twMerge(triggerClass, className)}
      >
        <span className={selectedOption ? "text-text" : "text-text-ghost"}>
          {selectedOption?.label ?? "Selecione..."}
        </span>
        <ChevronDown
          className={twMerge(
            "size-3.5 shrink-0 text-text-subtle transition-transform duration-150",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="absolute z-50 top-full left-0 w-full mt-1 bg-surface border border-border-subtle rounded overflow-hidden">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleSelect(opt.value)}
              className={twMerge(
                "w-full text-left px-3 py-2 text-sm transition-colors cursor-pointer",
                opt.value === currentValue
                  ? "bg-surface-raised text-text"
                  : "text-text-muted hover:bg-surface-raised hover:text-text",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
