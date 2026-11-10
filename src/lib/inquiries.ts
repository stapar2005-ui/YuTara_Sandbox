import type { MarketplaceProperty } from "./marketplace";
import { SupabaseAdapter } from "./storage-adapter";
import { supabase } from "./supabase";

export type InquiryStatus = "NEW" | "REPLIED";

export type Inquiry = {
  id: string;
  propertyId: number;
  propertyTitle: string;
  buyerName: string;
  buyerEmail: string;
  message: string;
  createdAt: string;
  status: InquiryStatus;
  reply?: string;
};

export const INQUIRIES_KEY = "yutara-inquiries";
export const INQUIRIES_EVENT = "yutara-inquiries-change";

const storage = new SupabaseAdapter(supabase, INQUIRIES_KEY);

export async function readInquiries(): Promise<Inquiry[]> {
  if (typeof window === "undefined") return [];
  try {
    const stored = await storage.getItem<Inquiry[]>(INQUIRIES_KEY);
    if (!stored) return [];
    return stored.filter(
      (item): item is Inquiry =>
        Boolean(
          item &&
            typeof item === "object" &&
            typeof item.id === "string" &&
            typeof item.propertyId === "number" &&
            typeof item.message === "string",
        ),
    );
  } catch {
    return [];
  }
}

async function writeInquiries(inquiries: Inquiry[]): Promise<void> {
  if (typeof window === "undefined") return;
  await storage.setItem(INQUIRIES_KEY, inquiries);
  window.dispatchEvent(new Event(INQUIRIES_EVENT));
}

export async function addInquiry(input: {
  propertyId: number;
  propertyTitle: string;
  buyerName: string;
  buyerEmail: string;
  message: string;
}): Promise<Inquiry> {
  const inquiry: Inquiry = {
    id: `YTQ-${Date.now()}`,
    propertyId: input.propertyId,
    propertyTitle: input.propertyTitle,
    buyerName: input.buyerName || "YuTara buyer",
    buyerEmail: input.buyerEmail || "buyer@yutara.com",
    message: input.message,
    createdAt: new Date().toISOString(),
    status: "NEW",
  };
  const all = await readInquiries();
  await writeInquiries([inquiry, ...all]);
  return inquiry;
}

export async function markInquiryReplied(id: string): Promise<Inquiry[]> {
  const next = (await readInquiries()).map((inquiry) =>
    inquiry.id === id ? { ...inquiry, status: "REPLIED" as InquiryStatus } : inquiry,
  );
  await writeInquiries(next);
  return next;
}

/** Send a seller reply and mark the inquiry as replied. */
export async function replyToInquiry(id: string, reply: string): Promise<Inquiry[]> {
  const trimmed = reply.trim();
  const next = (await readInquiries()).map((inquiry) =>
    inquiry.id === id
      ? {
          ...inquiry,
          status: "REPLIED" as InquiryStatus,
          reply: trimmed || inquiry.reply,
        }
      : inquiry,
  );
  await writeInquiries(next);
  return next;
}

const SIMULATED_BUYERS = [
  { name: "Jonas P.", email: "jonas.p@example.com" },
  { name: "Aileen R.", email: "aileen.r@example.com" },
  { name: "Marco D.", email: "marco.d@example.com" },
  { name: "Bea T.", email: "bea.t@example.com" },
  { name: "Ryan C.", email: "ryan.c@example.com" },
];

const SIMULATED_MESSAGES = [
  "Hi! Is this lot still available? Can we schedule a viewing this weekend?",
  "Good day, is the price negotiable? Are the ownership papers clean?",
  "Interested. May I know if there is road access and a nearby water source?",
  "Hello, could you share the exact location and the lot dimensions?",
];

export function simulatedInquiries(
  property: MarketplaceProperty,
): Inquiry[] {
  const count = 1 + (property.id % 3);
  return Array.from({ length: count }, (_, index) => {
    const buyer =
      SIMULATED_BUYERS[(property.id + index) % SIMULATED_BUYERS.length];
    return {
      id: `sim-${property.id}-${index}`,
      propertyId: property.id,
      propertyTitle: property.title,
      buyerName: buyer.name,
      buyerEmail: buyer.email,
      message:
        SIMULATED_MESSAGES[(property.id + index) % SIMULATED_MESSAGES.length],
      createdAt: new Date(
        Date.now() - (index + 1) * 36 * 60 * 60 * 1000,
      ).toISOString(),
      status: "NEW" as InquiryStatus,
    };
  });
}

export function inquiriesForProperty(
  property: MarketplaceProperty,
  stored: Inquiry[],
): Inquiry[] {
  const real = stored.filter((inquiry) => inquiry.propertyId === property.id);
  return [...real, ...simulatedInquiries(property)];
}

export function formatInquiryDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";
  return date.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
