import { SupabaseAdapter } from "./storage-adapter";
import { supabase } from "./supabase";

export type UserProfile = {
  name?: string;
  bio?: string;
  avatar?: string;
};

export const PROFILE_EVENT = "yutara-profile-change";
const TABLE = "yutara-profiles";

export function readProfile(email: string): Promise<UserProfile> {
  return (async () => {
    if (typeof window === "undefined" || !email) return {};
    const storage = new SupabaseAdapter(supabase, TABLE);
    try {
      const stored = await storage.getItem<UserProfile>(`profile:${email.toLowerCase()}`);
      return stored ?? {};
    } catch {
      return {};
    }
  })();
}

export function writeProfile(email: string, profile: UserProfile): Promise<void> {
  return (async () => {
    if (typeof window === "undefined" || !email) return;
    const storage = new SupabaseAdapter(supabase, TABLE);
    try {
      await storage.setItem(`profile:${email.toLowerCase()}`, profile);
    } catch {
      // ignore
    }
    window.dispatchEvent(new Event(PROFILE_EVENT));
  })();
}
