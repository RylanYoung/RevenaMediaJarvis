export function SyncStatus({ syncedAt }: { syncedAt?: string | null }) {
  if (!syncedAt) {
    return (
      <span className="flex items-center gap-1.5 text-[11px] text-muted">
        <span className="h-1.5 w-1.5 rounded-full bg-muted/50" />
        Not synced yet
      </span>
    );
  }

  const formatted = new Date(syncedAt).toLocaleString("en-AU", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <span className="flex items-center gap-1.5 text-[11px] text-muted">
      <span className="h-1.5 w-1.5 rounded-full bg-positive" />
      Synced {formatted}
    </span>
  );
}
