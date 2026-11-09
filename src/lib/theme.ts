import { SupabaseAdapter } from "./storage-adapter";
import { supabase } from "./supabase";

export type Theme = "light" | "dark";

export const THEME_KEY = "yutara-theme";
const TABLE = "yutara-theme";

export function getStoredTheme(): Promise<Theme> {
  return (async () => {
    if (typeof window === "undefined") return "light";
    const storage = new SupabaseAdapter(supabase, TABLE);
    try {
      const stored = await storage.getItem<Theme>(THEME_KEY);
      return stored === "dark" ? "dark" : "light";
    } catch {
      return "light";
    }
  })();
}

export function applyTheme(theme: Theme): void {
  if (typeof document === "undefined") return;
  if (theme === "dark") {
    document.documentElement.dataset.theme = "dark";
  } else {
    delete document.documentElement.dataset.theme;
  }
}

export function setStoredTheme(theme: Theme): Promise<void> {
  return (async () => {
    if (typeof window === "undefined") return;
    const storage = new SupabaseAdapter(supabase, TABLE);
    try {
      await storage.setItem(THEME_KEY, theme);
    } catch {
      // ignore
    }
    applyTheme(theme);
  })();
}
