import { readInquiries } from "./inquiries";
import { readTransactions } from "./transactions";
import type { Property } from "./marketplace";

export type NotificationCounts = {
  inquiries: number;
  bookings: number;
  total: number;
};

/**
 * Notifications for a seller: new buyer inquiries and new booking requests on
 * the listings this account owns.
 */
export function notificationsFor(
  email: string | null | undefined,
  properties: Property[],
): NotificationCounts {
  if (!email) return { inquiries: 0, bookings: 0, total: 0 };
  const myIds = new Set(
    properties
      .filter((property) => property.sellerEmail === email)
      .map((property) => property.id),
  );
  const inquiries = readInquiries().filter(
    (inquiry) => inquiry.status === "NEW" && myIds.has(inquiry.propertyId),
  ).length;
  const bookings = readTransactions().filter(
    (tx) => tx.sellerId === email && tx.stage === "BOOKING_REQUESTED",
  ).length;
  return { inquiries, bookings, total: inquiries + bookings };
}
