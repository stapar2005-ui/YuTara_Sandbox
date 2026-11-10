import { SupabaseAdapter } from "./storage-adapter";
import { supabase } from "./supabase";

export type SavedProperty = {
  id: string;
  userId: string;
  propertyId: number;
  savedAt: string;
  notes?: string;
};

export const SAVED_PROPERTIES_KEY = "yutara-saved-properties";
export const SAVED_PROPERTIES_EVENT = "yutara-saved-properties-change";

const storage = new SupabaseAdapter(supabase, SAVED_PROPERTIES_KEY);

function emit(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(SAVED_PROPERTIES_EVENT));
}

export async function readSavedProperties(
  userId?: string
): Promise<SavedProperty[]> {
  if (typeof window === "undefined") return [];
  try {
    const stored = await storage.getItem<SavedProperty[]>(
      SAVED_PROPERTIES_KEY
    );
    if (!stored) return [];
    const filtered = userId
      ? stored.filter((item) => item.userId === userId)
      : stored;
    return filtered;
  } catch {
    return [];
  }
}

export async function saveProperty(input: {
  userId: string;
  propertyId: number;
  notes?: string;
}): Promise<SavedProperty | null> {
  if (typeof window === "undefined") return null;
  const all = await readSavedProperties();
  const exists = all.find(
    (item) => item.userId === input.userId && item.propertyId === input.propertyId
  );
  if (exists) return exists;

  const saved: SavedProperty = {
    id: `YT-SAV-${String(Date.now()).slice(-6)}`,
    userId: input.userId,
    propertyId: input.propertyId,
    savedAt: new Date().toISOString(),
    notes: input.notes,
  };
  await storage.setItem(SAVED_PROPERTIES_KEY, [...all, saved]);
  emit();
  return saved;
}

export async function unsaveProperty(userId: string, propertyId: number): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const all = await readSavedProperties();
  const next = all.filter(
    (item) => !(item.userId === userId && item.propertyId === propertyId)
  );
  await storage.setItem(SAVED_PROPERTIES_KEY, next);
  emit();
  return next.length !== all.length;
}

export async function isPropertySaved(userId: string, propertyId: number): Promise<boolean> {
  const all = await readSavedProperties(userId);
  return all.some((item) => item.propertyId === propertyId);
}
