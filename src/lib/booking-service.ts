import { SupabaseAdapter } from "./storage-adapter";
import { supabase } from "./supabase";

export type BookingStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

export type BookingRequest = {
  id: string;
  propertyId: number;
  propertyTitle: string;
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  sellerId: string;
  sellerName: string;
  message: string;
  proposedPrice?: number;
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
  respondedAt?: string;
  responseNote?: string;
  reservationId?: string;
};

export const BOOKING_REQUESTS_KEY = "yutara-booking-requests";
export const BOOKING_REQUESTS_EVENT = "yutara-booking-requests-change";

const storage = new SupabaseAdapter(supabase, BOOKING_REQUESTS_KEY);

function emit(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(BOOKING_REQUESTS_EVENT));
}

export async function readBookingRequests(): Promise<BookingRequest[]> {
  if (typeof window === "undefined") return [];
  try {
    const stored = await storage.getItem<BookingRequest[]>(
      BOOKING_REQUESTS_KEY
    );
    if (!stored) return [];
    return stored.filter(
      (item): item is BookingRequest =>
        Boolean(
          item &&
          typeof item.id === "string" &&
          typeof item.propertyId === "number" &&
          typeof item.buyerId === "string" &&
          typeof item.status === "string",
        ),
    );
  } catch {
    return [];
  }
}

export async function createBookingRequest(input: {
  propertyId: number;
  propertyTitle: string;
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  sellerId: string;
  sellerName: string;
  message: string;
  proposedPrice?: number;
}): Promise<BookingRequest> {
  const all = await readBookingRequests();

  // Prevent duplicate pending booking requests from the same buyer for the same property
  const exists = all.find(
    (item) =>
      item.propertyId === input.propertyId &&
      item.buyerId === input.buyerId &&
      item.status === "PENDING",
  );
  if (exists) return exists;

  // Prevent booking own property
  if (input.buyerId === input.sellerId) {
    throw new Error("You cannot book your own property.");
  }

  const booking: BookingRequest = {
    id: `YT-BOK-${String(Date.now()).slice(-6)}`,
    propertyId: input.propertyId,
    propertyTitle: input.propertyTitle,
    buyerId: input.buyerId,
    buyerName: input.buyerName,
    buyerEmail: input.buyerEmail,
    sellerId: input.sellerId,
    sellerName: input.sellerName,
    message: input.message,
    proposedPrice: input.proposedPrice,
    status: "PENDING",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await storage.setItem(BOOKING_REQUESTS_KEY, [booking, ...all]);
  emit();
  return booking;
}

export async function respondToBookingRequest(
  id: string,
  decision: "APPROVED" | "REJECTED",
  responderId: string,
  note?: string,
): Promise<BookingRequest | null> {
  const all = await readBookingRequests();
  const index = all.findIndex((item) => item.id === id);
  if (index < 0) return null;

  const booking = all[index];
  if (booking.status !== "PENDING") return booking;

  const updated: BookingRequest = {
    ...booking,
    status: decision,
    respondedAt: new Date().toISOString(),
    responseNote: note,
    updatedAt: new Date().toISOString(),
  };
  all[index] = updated;
  await storage.setItem(BOOKING_REQUESTS_KEY, all);
  emit();
  return updated;
}

export async function cancelBookingRequest(
  id: string,
  buyerId: string,
): Promise<BookingRequest | null> {
  const all = await readBookingRequests();
  const index = all.findIndex((item) => item.id === id);
  if (index < 0) return null;

  const booking = all[index];
  if (booking.buyerId !== buyerId) return null;
  if (booking.status !== "PENDING") return booking;

  const updated: BookingRequest = {
    ...booking,
    status: "CANCELLED",
    updatedAt: new Date().toISOString(),
  };
  all[index] = updated;
  await storage.setItem(BOOKING_REQUESTS_KEY, all);
  emit();
  return updated;
}

export async function getBookingRequestsForSeller(
  sellerId: string,
): Promise<BookingRequest[]> {
  const all = await readBookingRequests();
  return all.filter((item) => item.sellerId === sellerId);
}

export async function getBookingRequestsForBuyer(
  buyerId: string,
): Promise<BookingRequest[]> {
  const all = await readBookingRequests();
  return all.filter((item) => item.buyerId === buyerId);
}

export async function getPendingBookingRequestsForProperty(
  propertyId: number,
): Promise<BookingRequest[]> {
  const all = await readBookingRequests();
  return all.filter(
    (item) => item.propertyId === propertyId && item.status === "PENDING",
  );
}

export async function hasActiveReservation(
  propertyId: number,
): Promise<boolean> {
  // Check reservations via reservation-service
  const { readReservations } = await import("./reservation-service");
  const reservations = await readReservations();
  return reservations.some(
    (item) =>
      item.propertyId === propertyId &&
      (item.status === "PENDING_PAYMENT" ||
        item.status === "RESERVED" ||
        item.status === "COMPLETED"),
  );
}
