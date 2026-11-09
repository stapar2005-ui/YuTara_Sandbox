import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Storage adapter interface.
 *
 * Current default: LocalStorageAdapter (browser localStorage).
 * To migrate to Supabase: implement SupabaseAdapter with the same interface
 * and swap it in at each store layer. No UI or business logic changes needed
 * beyond making store calls awaitable.
 */

export type StorageAdapter = {
  getItem: <T>(key: string) => Promise<T | null>;
  setItem: <T>(key: string, value: T) => Promise<boolean>;
  removeItem: (key: string) => Promise<boolean>;
  clear: () => Promise<void>;
  onChange: (callback: (key: string) => void) => () => void;
};

/** Browser localStorage implementation (current fallback). */
export class LocalStorageAdapter implements StorageAdapter {
  async getItem<T>(key: string): Promise<T | null> {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  async setItem<T>(key: string, value: T): Promise<boolean> {
    if (typeof window === "undefined") return false;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }

  async removeItem(key: string): Promise<boolean> {
    if (typeof window === "undefined") return false;
    try {
      window.localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  }

  async clear(): Promise<void> {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.clear();
    } catch {
      // ignore
    }
  }

  onChange(callback: (key: string) => void): () => void {
    const handler = (event: StorageEvent) => {
      if (event.key) callback(event.key);
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }
}

/**
 * Supabase adapter. Uses a single "store" table with columns:
 *   id (text, primary key), value (jsonb), updated_at (timestamptz)
 *
 * Each store (properties, transactions, reservations, etc.) is a separate
 * Supabase table. When migrating, change the table name passed to the
 * constructor in each store file.
 */
export class SupabaseAdapter implements StorageAdapter {
  constructor(private supabaseClient: SupabaseClient, private table: string) {}

  async getItem<T>(key: string): Promise<T | null> {
    const { data, error } = await this.supabaseClient
      .from(this.table)
      .select("value")
      .eq("id", key)
      .single();
    if (error || !data) return null;
    return (data.value as T) ?? null;
  }

  async setItem<T>(key: string, value: T): Promise<boolean> {
    const { error } = await this.supabaseClient.from(this.table).upsert({
      id: key,
      value,
      updated_at: new Date().toISOString(),
    });
    return !error;
  }

  async removeItem(key: string): Promise<boolean> {
    const { error } = await this.supabaseClient
      .from(this.table)
      .delete()
      .eq("id", key);
    return !error;
  }

  async clear(): Promise<void> {
    await this.supabaseClient
      .from(this.table)
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
  }

  onChange(callback: (key: string) => void): () => void {
    const channel = this.supabaseClient
      .channel(this.table)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: this.table,
        },
        (payload: Record<string, unknown>) =>
          callback(
            String(
              (payload.new as Record<string, unknown> | undefined)?.id ||
                (payload.old as Record<string, unknown> | undefined)?.id ||
                "",
            ),
          ),
      )
      .subscribe();
    return () => this.supabaseClient.removeChannel(channel);
  }
}

/**
 * Supabase adapter for profile storage (keyed by email).
 * Table: profiles(id text primary key, value jsonb, updated_at timestamptz)
 */
export class ProfileAdapter implements StorageAdapter {
  constructor(
    private supabaseClient: SupabaseClient,
    private table: string,
    private email: string,
  ) {}

  private get key(): string {
    return `profile:${this.email.toLowerCase()}`;
  }

  async getItem<T>(_key: string): Promise<T | null> {
    const { data, error } = await this.supabaseClient
      .from(this.table)
      .select("value")
      .eq("id", this.key)
      .single();
    if (error || !data) return null;
    return (data.value as T) ?? null;
  }

  async setItem<T>(key: string, value: T): Promise<boolean> {
    const { error } = await this.supabaseClient.from(this.table).upsert({
      id: this.key,
      value,
      updated_at: new Date().toISOString(),
    });
    return !error;
  }

  async removeItem(_key: string): Promise<boolean> {
    const { error } = await this.supabaseClient
      .from(this.table)
      .delete()
      .eq("id", this.key);
    return !error;
  }

  async clear(): Promise<void> {
    await this.supabaseClient.from(this.table).delete().eq("id", this.key);
  }

  onChange(callback: (key: string) => void): () => void {
    const channel = this.supabaseClient
      .channel(`${this.table}:${this.key}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: this.table,
          filter: `id=eq.${this.key}`,
        },
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        (payload: Record<string, unknown>) => callback(this.key),
      )
      .subscribe();
    return () => this.supabaseClient.removeChannel(channel);
  }
}
