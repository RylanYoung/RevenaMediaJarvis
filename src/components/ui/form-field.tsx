import type { ReactNode } from "react";

export function FormField({
  label,
  className = "",
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={`flex flex-col gap-2 ${className}`}>
      <span className="text-sm font-medium text-muted">{label}</span>
      {children}
    </label>
  );
}

export const inputClass =
  "w-full rounded-lg border border-border bg-background px-4 py-3 text-base text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/15";

export const selectClass = inputClass;

export const primaryButtonClass =
  "rounded-lg bg-accent px-5 py-3 text-base font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60";
