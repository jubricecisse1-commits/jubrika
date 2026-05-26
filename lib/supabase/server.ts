// Client Supabase côté serveur (Server Components / Route Handlers)
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

// Pour les Server Components
export const createServerClient = () =>
  createServerComponentClient({ cookies });

// Pour les API routes avec droits admin (service role)
export const createAdminClient = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
