import { MarketplaceProperty } from "./marketplace";

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

export function readInquiries(): Inquiry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(INQUIRIES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
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

function writeInquiries(inquiries: Inquiry[]): Inquiry[] {
  if (typeof window === "undefined") return inquiries;
  try {
    window.localStorage.setItem(INQUIRIES_KEY, JSON.stringify(inquiries));
    window.dispatchEvent(new Event(INQUIRIES_EVENT));
  } catch {
    // ignore
  }
  return inquiries;
}

export function addInquiry(input: {
  propertyId: number;
  propertyTitle: string;
  buyerName: string;
  buyerEmail: string;
  message: string;
}): Inquiry {
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
  writeInquiries([inquiry, ...readInquiries()]);
  return inquiry;
}

export function markInquiryReplied(id: string): Inquiry[] {
  const next = readInquiries().map((inquiry) =>
    inquiry.id === id ? { ...inquiry, status: "REPLIED" as InquiryStatus } : inquiry,
  );
  return writeInquiries(next);
}

/** Send a seller reply and mark the inquiry as replied. */
export function replyToInquiry(id: string, reply: string): Inquiry[] {
  const trimmed = reply.trim();
  const next = readInquiries().map((inquiry) =>
    inquiry.id === id
      ? {
          ...inquiry,
          status: "REPLIED" as InquiryStatus,
          reply: trimmed || inquiry.reply,
        }
      : inquiry,
  );
  return writeInquiries(next);
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
    const buyer = SIMULATED_BUYERS[(property.id + index) % SIMULATED_BUYERS.length];
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
