export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-start gap-1 rounded-lg border border-dashed border-border px-4 py-6">
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="text-xs text-muted">{description}</p>
    </div>
  );
}
