import { SupabaseAdapter } from "./storage-adapter";
import { supabase } from "./supabase";

export type NotificationType =
  | "BOOKING_APPROVED"
  | "BOOKING_REJECTED"
  | "NEW_TRANSACTION"
  | "AGENCY_ACCEPTED_TRANSACTION"
  | "DOCUMENT_REQUESTED"
  | "DOCUMENT_SUBMITTED"
  | "DOCUMENT_ACCEPTED"
  | "DOCUMENT_REJECTED"
  | "ADDITIONAL_DOCUMENT_REQUIRED"
  | "DOCUMENTS_FORWARDED"
  | "OFFICE_RESPONSE_RECORDED"
  | "STAGE_CHANGED"
  | "TRANSACTION_ON_HOLD"
  | "NEW_TITLE_ISSUED"
  | "TRANSACTION_COMPLETED"
  | "INQUIRY_RECEIVED"
  | "INQUIRY_REPLIED"
  | "SAVED_PROPERTY_STATUS_CHANGED";

export type Notification = {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  description: string;
  transactionReference?: string;
  transactionId?: string;
  actionUrl?: string;
  isRead: boolean;
  createdAt: string;
};

export const NOTIFICATIONS_KEY = "yutara-notifications";
export const NOTIFICATIONS_EVENT = "yutara-notifications-change";

const storage = new SupabaseAdapter(supabase, NOTIFICATIONS_KEY);

function emit(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(NOTIFICATIONS_EVENT));
}

export async function readNotifications(
  userId?: string
): Promise<Notification[]> {
  if (typeof window === "undefined") return [];
  try {
    const stored = await storage.getItem<Notification[]>(NOTIFICATIONS_KEY);
    if (!stored) return [];
    const filtered = userId
      ? stored.filter((item) => item.userId === userId)
      : stored;
    return [...filtered].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch {
    return [];
  }
}

export async function createNotification(input: {
  userId: string;
  type: NotificationType;
  title: string;
  description: string;
  transactionReference?: string;
  transactionId?: string;
  actionUrl?: string;
}): Promise<Notification> {
  if (typeof window === "undefined") {
    throw new Error("createNotification requires browser environment");
  }
  const all = await readNotifications();
  const notification: Notification = {
    id: `YT-NTF-${String(Date.now()).slice(-6)}`,
    userId: input.userId,
    type: input.type,
    title: input.title,
    description: input.description,
    transactionReference: input.transactionReference,
    transactionId: input.transactionId,
    actionUrl: input.actionUrl,
    isRead: false,
    createdAt: new Date().toISOString(),
  };
  await storage.setItem(NOTIFICATIONS_KEY, [notification, ...all]);
  emit();
  return notification;
}

export async function markNotificationRead(id: string): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const all = await readNotifications();
  const index = all.findIndex((item) => item.id === id);
  if (index < 0) return false;
  all[index] = { ...all[index], isRead: true };
  await storage.setItem(NOTIFICATIONS_KEY, all);
  emit();
  return true;
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  if (typeof window === "undefined") return;
  const all = await readNotifications();
  const next = all.map((item) =>
    item.userId === userId ? { ...item, isRead: true } : item,
  );
  await storage.setItem(NOTIFICATIONS_KEY, next);
  emit();
}

export async function unreadCount(userId: string): Promise<number> {
  const all = await readNotifications(userId);
  return all.filter((item) => !item.isRead).length;
}

export const NOTIFICATION_CONFIG: Record<
  NotificationType,
  { title: string; description: (ctx: Record<string, string>) => string }
> = {
  BOOKING_APPROVED: {
    title: "Booking Approved",
    description: (ctx) => `The seller approved your booking request for ${ctx.propertyTitle || "a property"}.`,
  },
  BOOKING_REJECTED: {
    title: "Booking Rejected",
    description: (ctx) => `The seller rejected your booking request for ${ctx.propertyTitle || "a property"}. Reason: ${ctx.reason || "No reason provided"}.`,
  },
  NEW_TRANSACTION: {
    title: "New Transaction Created",
    description: (ctx) => `A new transaction has been created for ${ctx.propertyTitle || "a property"}.`,
  },
  AGENCY_ACCEPTED_TRANSACTION: {
    title: "Transaction Accepted by Agency",
    description: (ctx) => `The affiliated agency has accepted your transaction (${ctx.transactionReference}).`,
  },
  DOCUMENT_REQUESTED: {
    title: "Document Requested",
    description: (ctx) => `The agency has requested a document: ${ctx.requirementName || ""}.`,
  },
  DOCUMENT_SUBMITTED: {
    title: "Document Submitted",
    description: (ctx) => `A document has been submitted: ${ctx.fileName || ""}.`,
  },
  DOCUMENT_ACCEPTED: {
    title: "Document Accepted",
    description: (ctx) => `Your document ${ctx.fileName || ""} has been accepted by the agency.`,
  },
  DOCUMENT_REJECTED: {
    title: "Document Rejected",
    description: (ctx) => `Your document ${ctx.fileName || ""} was rejected. Reason: ${ctx.reason || ""}.`,
  },
  ADDITIONAL_DOCUMENT_REQUIRED: {
    title: "Additional Document Required",
    description: (ctx) => `The agency requires an additional document: ${ctx.requirementName || ""}.`,
  },
  DOCUMENTS_FORWARDED: {
    title: "Documents Forwarded",
    description: (ctx) => `Documents have been forwarded to ${ctx.office || "a government office"} for processing.`,
  },
  OFFICE_RESPONSE_RECORDED: {
    title: "Office Response Recorded",
    description: (ctx) => `A response has been recorded from ${ctx.office || "a government office"}.`,
  },
  STAGE_CHANGED: {
    title: "Processing Stage Updated",
    description: (ctx) => `Transaction stage changed to: ${ctx.stageName || ""}.`,
  },
  TRANSACTION_ON_HOLD: {
    title: "Transaction On Hold",
    description: (ctx) => `Your transaction has been placed on hold. Reason: ${ctx.reason || ""}.`,
  },
  NEW_TITLE_ISSUED: {
    title: "New Title Issued",
    description: () => `A new title has been issued for your property transaction.`,
  },
  TRANSACTION_COMPLETED: {
    title: "Transaction Completed",
    description: () => `Your land transfer transaction has been completed.`,
  },
  INQUIRY_RECEIVED: {
    title: "New Inquiry",
    description: (ctx) => `You received a new inquiry about ${ctx.propertyTitle || "a property"}.`,
  },
  INQUIRY_REPLIED: {
    title: "Inquiry Replied",
    description: (ctx) => `The seller has replied to your inquiry about ${ctx.propertyTitle || "a property"}.`,
  },
  SAVED_PROPERTY_STATUS_CHANGED: {
    title: "Saved Property Status Changed",
    description: (ctx) => `A saved property's status has changed to ${ctx.newStatus || ""}.`,
  },
};
