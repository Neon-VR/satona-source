import { createClient } from "@supabase/supabase-js";
export const accountClient =
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
    ? createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY,
        {
          auth: {
            storageKey: "satona-account",
            persistSession: false,
            detectSessionInUrl: false,
          },
        },
      )
    : null;
