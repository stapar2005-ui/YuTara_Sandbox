import { getInitialProperties, Property } from "./marketplace";
import { SupabaseAdapter } from "./storage-adapter";
import { supabase } from "./supabase";

const KEY = "yutara-properties";
export const PROPERTIES_EVENT = "yutara-properties-change";

const storage = new SupabaseAdapter(supabase, KEY);

function emit(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(PROPERTIES_EVENT));
}

/**
 * The full property list, seeded from the marketplace catalog and persisted in
 * Supabase so seller submissions and admin decisions are shared across users.
 */
export async function readProperties(): Promise<Property[]> {
  if (typeof window === "undefined") return getInitialProperties();
  try {
    const stored = await storage.getItem<Property[]>(KEY);
    if (!stored || !Array.isArray(stored) || stored.length === 0) {
      return getInitialProperties();
    }
    return stored as Property[];
  } catch {
    return getInitialProperties();
  }
}

export async function writeProperties(list: Property[]): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const saved = await storage.setItem(KEY, list);
  emit();
  return saved;
}

export async function updateProperty(
  id: number,
  patch: Partial<Property>,
): Promise<boolean> {
  const list = await readProperties();
  const index = list.findIndex((property) => property.id === id);
  if (index < 0) return false;
  list[index] = { ...list[index], ...patch };
  return writeProperties(list);
}

export async function resetProperties(): Promise<void> {
  if (typeof window === "undefined") return;
  await storage.removeItem(KEY);
  emit();
}
