import { createClient } from "@supabase/supabase-js";

// Server-only client using the service role key, which bypasses RLS.
// Never import this from a client component or expose the key to the browser.
export function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set — add them in Settings / .env.local."
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
}
