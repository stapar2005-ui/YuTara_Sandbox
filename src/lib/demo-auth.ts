import { isDemoMode } from "./runtime-config";

export type DemoRole =
  | "USER"
  | "ADMIN"
  | "AGENCY_ADMIN"
  | "AGENCY_OFFICER"
  | "AGENCY_PROCESSOR"
  | "AGENCY_VIEWER";

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
    name: "YuTara Admin 1",
  },
  "buyer@yutara.com": {
    email: "buyer@yutara.com",
    password: "12345",
    role: "USER",
    name: "Juan Buyer",
  },
  "seller@yutara.com": {
    email: "seller@yutara.com",
    password: "12345",
    role: "USER",
    name: "Maria Seller",
  },
  "agency.admin@yutara.com": {
    email: "agency.admin@yutara.com",
    password: "12345",
    role: "AGENCY_ADMIN",
    name: "Agency Admin",
  },
  "agency.officer@yutara.com": {
    email: "agency.officer@yutara.com",
    password: "12345",
    role: "AGENCY_OFFICER",
    name: "Agency Officer",
  },
  "agency.processor@yutara.com": {
    email: "agency.processor@yutara.com",
    password: "12345",
    role: "AGENCY_PROCESSOR",
    name: "Agency Processor",
  },
};

export type PendingUser = {
  id: string;
  email: string;
  name: string;
  password: string;
  id1: string; // filename of first valid ID
  id2?: string; // filename of second valid ID (optional)
  id1Url?: string;
  id2Url?: string;
  faceScanUrl?: string;
  mobile?: string;
  status: "PENDING" | "APPROVED" | "DENIED";
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  denialReason?: string;
};

export const PENDING_USERS_KEY = "yutara-pending-users";
export const PENDING_USERS_EVENT = "yutara-pending-users-change";

export const SESSION_KEY = "yutara-session";
export const SESSION_EVENT = "yutara-session-change";

function emitSessionChange(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(SESSION_EVENT));
}

export function authenticate(email: string, password: string): DemoUser | null {
  if (!isDemoMode) return null;
  const normalizedEmail = email.trim().toLowerCase();
  const account = DEMO_ACCOUNTS[normalizedEmail];
  if (account && account.password === password) {
    return { email: account.email, role: account.role, name: account.name };
  }

  const approvedUser = readPendingUsers().find(
    (user) =>
      user.email === normalizedEmail &&
      user.status === "APPROVED" &&
      user.password === password,
  );
  if (approvedUser) {
    return {
      email: approvedUser.email,
      role: "USER",
      name: approvedUser.name,
    };
  }

  return null;
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
      (parsed.role === "ADMIN" ||
        parsed.role === "USER" ||
        parsed.role === "AGENCY_ADMIN" ||
        parsed.role === "AGENCY_OFFICER" ||
        parsed.role === "AGENCY_PROCESSOR" ||
        parsed.role === "AGENCY_VIEWER")
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

/** Pending user registration management */

export function readPendingUsers(): PendingUser[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(PENDING_USERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function writePendingUsers(users: PendingUser[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PENDING_USERS_KEY, JSON.stringify(users));
  } catch {
    // ignore
  }
  window.dispatchEvent(new Event(PENDING_USERS_EVENT));
}

export function createPendingUser(input: {
  email: string;
  name: string;
  password: string;
  id1: string;
  id2?: string;
  mobile?: string;
}): PendingUser {
  const user: PendingUser = {
    id: `PEND-${Date.now()}`,
    email: input.email.toLowerCase(),
    name: input.name,
    password: input.password,
    id1: input.id1,
    id2: input.id2,
    mobile: input.mobile,
    status: "PENDING",
    createdAt: new Date().toISOString(),
  };
  const existing = readPendingUsers();
  writePendingUsers([user, ...existing]);
  return user;
}

export function approvePendingUser(
  id: string,
  reviewedBy: string,
): PendingUser | null {
  const users = readPendingUsers();
  const index = users.findIndex((u) => u.id === id);
  if (index < 0) return null;
  users[index] = {
    ...users[index],
    status: "APPROVED",
    reviewedAt: new Date().toISOString(),
    reviewedBy,
  };
  writePendingUsers(users);
  return users[index];
}

export function denyPendingUser(
  id: string,
  reviewedBy: string,
  reason?: string,
): PendingUser | null {
  const users = readPendingUsers();
  const index = users.findIndex((u) => u.id === id);
  if (index < 0) return null;
  users[index] = {
    ...users[index],
    status: "DENIED",
    reviewedAt: new Date().toISOString(),
    reviewedBy,
    denialReason: reason,
  };
  writePendingUsers(users);
  return users[index];
}

export function isEmailRegisteredOrPending(email: string): boolean {
  const lower = email.toLowerCase();
  if (DEMO_ACCOUNTS[lower]) return true;
  const pending = readPendingUsers();
  return pending.some(
    (u) =>
      u.email === lower &&
      (u.status === "PENDING" || u.status === "APPROVED"),
  );
}
