import { supabase } from "./supabase";

export const STORAGE_KEYS = [
  "yutara-properties",
  "yutara-reservations",
  "yutara-transactions",
  "yutara-verifications",
  "yutara-session",
  "yutara-theme",
  "yutara-saved",
  "yutara-inquiries",
  "yutara-profiles",
  "yutara-pending-users",
];

export async function resetAllData(): Promise<void> {
  if (typeof window === "undefined") return;

  // Clear Supabase tables
  for (const table of STORAGE_KEYS) {
    try {
      await supabase.from(table).delete().neq("id", "00000000-0000-0000-0000-000000000000");
    } catch {
      // ignore per-table errors
    }
  }

  // Clear localStorage
  try {
    STORAGE_KEYS.forEach((key) => {
      window.localStorage.removeItem(key);
    });
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith("yutara-profile:")) {
        window.localStorage.removeItem(key);
      }
    }
  } catch {
    // ignore
  }

  // Dispatch all known events so UI re-syncs
  const events = [
    "yutara-properties-change",
    "yutara-reservations-change",
    "yutara-transactions-change",
    "yutara-verifications-change",
    "yutara-session-change",
    "yutara-inquiries-change",
    "yutara-profile-change",
    "yutara-pending-users-change",
  ];
  events.forEach((eventName) => {
    window.dispatchEvent(new Event(eventName));
  });
}
