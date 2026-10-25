import { getInitialProperties, Property } from "./marketplace";

const KEY = "yutara-properties";
export const PROPERTIES_EVENT = "yutara-properties-change";

function emit(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(PROPERTIES_EVENT));
}

/**
 * The full property list, seeded from the marketplace catalog and persisted in
 * the browser so seller submissions and admin decisions survive reloads and are
 * shared across the marketplace, seller, and admin views.
 */
export function readProperties(): Property[] {
  if (typeof window === "undefined") return getInitialProperties();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return getInitialProperties();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return getInitialProperties();
    }
    return parsed as Property[];
  } catch {
    return getInitialProperties();
  }
}

export function writeProperties(list: Property[]): boolean {
  if (typeof window === "undefined") return false;
  let saved = true;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // quota exceeded (e.g. very large images) — report so the UI can warn
    saved = false;
  }
  emit();
  return saved;
}

export function updateProperty(
  id: number,
  patch: Partial<Property>,
): boolean {
  const list = readProperties();
  const index = list.findIndex((property) => property.id === id);
  if (index < 0) return false;
  list[index] = { ...list[index], ...patch };
  return writeProperties(list);
}

export function resetProperties(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
  emit();
}
