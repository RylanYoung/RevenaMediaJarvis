export function SectionLabel({ children }: { children: string }) {
  return (
    <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted">
      {children}
    </p>
  );
}
