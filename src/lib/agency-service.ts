import { SupabaseAdapter } from "./storage-adapter";
import { supabase } from "./supabase";

export type AgencyPersonnel = {
  id: string;
  email: string;
  name: string;
  role: "AGENCY_ADMIN" | "AGENCY_OFFICER" | "AGENCY_PROCESSOR" | "AGENCY_VIEWER";
  assignedTransactions: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export const AGENCY_PERSONNEL_KEY = "yutara-agency-personnel";
export const AGENCY_PERSONNEL_EVENT = "yutara-agency-personnel-change";

const storage = new SupabaseAdapter(supabase, AGENCY_PERSONNEL_KEY);

function emit(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(AGENCY_PERSONNEL_EVENT));
}

export async function readAgencyPersonnel(): Promise<AgencyPersonnel[]> {
  if (typeof window === "undefined") return [];
  try {
    const stored = await storage.getItem<AgencyPersonnel[]>(AGENCY_PERSONNEL_KEY);
    if (!stored) return [];
    return stored;
  } catch {
    return [];
  }
}

export async function getAgencyPersonnelByEmail(
  email: string
): Promise<AgencyPersonnel | null> {
  const all = await readAgencyPersonnel();
  return all.find((item) => item.email === email.toLowerCase()) ?? null;
}

export async function createAgencyPersonnel(input: {
  email: string;
  name: string;
  role: AgencyPersonnel["role"];
}): Promise<AgencyPersonnel> {
  const all = await readAgencyPersonnel();
  const existing = all.find((item) => item.email === input.email.toLowerCase());
  if (existing) return existing;

  const person: AgencyPersonnel = {
    id: `YT-AGY-${String(Date.now()).slice(-6)}`,
    email: input.email.toLowerCase(),
    name: input.name,
    role: input.role,
    assignedTransactions: [],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await storage.setItem(AGENCY_PERSONNEL_KEY, [...all, person]);
  emit();
  return person;
}

export async function assignTransactionToPersonnel(
  personnelId: string,
  transactionId: string
): Promise<boolean> {
  const all = await readAgencyPersonnel();
  const index = all.findIndex((item) => item.id === personnelId);
  if (index < 0) return false;
  if (all[index].assignedTransactions.includes(transactionId)) return true;
  all[index].assignedTransactions = [
    ...all[index].assignedTransactions,
    transactionId,
  ];
  all[index].updatedAt = new Date().toISOString();
  await storage.setItem(AGENCY_PERSONNEL_KEY, all);
  emit();
  return true;
}

export function isAgencyRole(role: string): boolean {
  return [
    "AGENCY_ADMIN",
    "AGENCY_OFFICER",
    "AGENCY_PROCESSOR",
    "AGENCY_VIEWER",
  ].includes(role);
}

export function canManageTransactions(role: string): boolean {
  return [
    "AGENCY_ADMIN",
    "AGENCY_OFFICER",
    "AGENCY_PROCESSOR",
  ].includes(role);
}

export function canReviewDocuments(role: string): boolean {
  return ["AGENCY_ADMIN", "AGENCY_OFFICER", "AGENCY_PROCESSOR"].includes(role);
}
