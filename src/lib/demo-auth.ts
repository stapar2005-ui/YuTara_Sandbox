import { isDemoMode } from "./runtime-config";

export type DemoRole = "ADMIN" | "USER";

export type DemoUser = {
  email: string;
  role: DemoRole;
  name: string;
};

export const DEMO_ACCOUNTS: Record<string, DemoUser & { password: string }> = {
  "admin@yutara.com": {
    email: "admin@yutara.com",
    password: "12345",
    role: "ADMIN",
    name: "YuTara Admin",
  },
  "user@yutara.com": {
    email: "user@yutara.com",
    password: "12345",
    role: "USER",
    name: "YuTara User",
  },
  "buyer@yutara.com": {
    email: "buyer@yutara.com",
    password: "12345",
    role: "USER",
    name: "YuTara Buyer",
  },
  "seller@yutara.com": {
    email: "seller@yutara.com",
    password: "12345",
    role: "USER",
    name: "YuTara Seller",
  },
};

export const SESSION_KEY = "yutara-session";
export const SESSION_EVENT = "yutara-session-change";

function emitSessionChange(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(SESSION_EVENT));
}

export function authenticate(email: string, password: string): DemoUser | null {
  if (!isDemoMode) return null;
  const account = DEMO_ACCOUNTS[email.trim().toLowerCase()];
  if (!account || account.password !== password) return null;
  return { email: account.email, role: account.role, name: account.name };
}

export function getStoredSession(): DemoUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === "object" &&
      typeof parsed.email === "string" &&
      (parsed.role === "ADMIN" || parsed.role === "USER")
    ) {
      return {
        email: parsed.email,
        role: parsed.role,
        name: typeof parsed.name === "string" ? parsed.name : "YuTara User",
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function setStoredSession(user: DemoUser): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    emitSessionChange();
  } catch {
    // ignore
  }
}

export function clearStoredSession(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(SESSION_KEY);
    emitSessionChange();
  } catch {
    // ignore
  }
}
