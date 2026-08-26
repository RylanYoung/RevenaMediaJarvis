import { login } from "./actions";
import { Logo } from "@/components/logo";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; from?: string }>;
}) {
  const { error, from } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="card-shadow w-full max-w-sm rounded-xl border border-border bg-surface p-6">
        <Logo className="h-8 w-auto" />
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
          <label className="flex items-center gap-2 text-xs text-muted">
            <input
              type="checkbox"
              name="remember"
              defaultChecked
              className="h-3.5 w-3.5 rounded border-border accent-accent"
            />
            Remember this device
          </label>
          {error && (
            <p className="text-xs text-negative">Incorrect username or password. Try again.</p>
          )}
          <button
            type="submit"
            className="mt-1 rounded-md bg-accent px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            Unlock
          </button>
        </form>
      </div>
    </div>
  );
}
