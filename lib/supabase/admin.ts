import { createClient } from "@supabase/supabase-js";

// SOLO servidor: usa la service role key. NUNCA importar en componentes cliente.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
