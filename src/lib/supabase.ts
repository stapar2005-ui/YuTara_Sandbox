import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let _client: ReturnType<typeof createClient> | null = null;

export function getSupabase() {
  if (!_client) {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error(
        "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Add them to .env.local",
      );
    }
    _client = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        fetch: (...args) => globalThis.fetch(...args),
      },
    });
  }
  return _client;
}

/**
 * Lazy proxy so existing stores that do `new SupabaseAdapter(supabase, KEY)`
 * at module load time don't trigger a build failure when env vars are absent.
 * The real client is only created when a Supabase method is actually invoked.
 */
const handler = {
  get(_: unknown, prop: string) {
    return getSupabase()[
      prop as keyof ReturnType<typeof createClient>
    ];
  },
};

export const supabase = new Proxy(
  {},
  handler,
) as unknown as ReturnType<typeof createClient>;
