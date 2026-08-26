import Image from "next/image";
import { login } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; from?: string }>;
}) {
  const { error, from } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-6 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.6)]">
        <Image src="/revena-logo.png" alt="Revena Media" width={1398} height={600} priority className="h-8 w-auto" />
        <p className="mt-2 text-xs text-muted">Private dashboard — sign in to continue.</p>

        <form action={login} className="mt-6 flex flex-col gap-3">
          <input type="hidden" name="from" value={from ?? "/"} />
          <input
            type="text"
            name="username"
            placeholder="Username"
            autoFocus
            required
            autoComplete="username"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            required
            autoComplete="current-password"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
          />
          {error && (
            <p className="text-xs text-negative">Incorrect username or password. Try again.</p>
          )}
          <button
            type="submit"
            className="mt-1 rounded-md bg-accent px-3 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            Unlock
          </button>
        </form>
      </div>
    </div>
  );
}
