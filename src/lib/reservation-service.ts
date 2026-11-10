import type { MarketplaceProperty } from "./marketplace";
import { SupabaseAdapter } from "./storage-adapter";
import { supabase } from "./supabase";

const KEY = "yutara-reservations";
export const RESERVATIONS_KEY = KEY;
export const RESERVATION_FEE = 25000;

const storage = new SupabaseAdapter(supabase, KEY);

export type ReservationStatus =
  | "PENDING_PAYMENT"
  | "RESERVED"
  | "PAYMENT_FAILED"
  | "EXPIRED"
  | "CANCELLED"
  | "COMPLETED";

export type Reservation = {
  id: string;
  propertyId: number;
  buyerId: string;
  status: ReservationStatus;
  reservationFee: number;
  paymentId?: string;
  paymentMethod?: string;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
};

export async function readReservations(): Promise<Reservation[]> {
  if (typeof window === "undefined") return [];
  const stored = await storage.getItem<Reservation[]>(KEY);
  if (!stored) return [];
  try {
    const now = new Date();
    const filtered = stored.filter(
      (item): item is Reservation =>
        Boolean(
          item &&
          typeof item === "object" &&
          typeof item.id === "string" &&
          typeof item.propertyId === "number" &&
          typeof item.buyerId === "string" &&
          typeof item.status === "string" &&
          typeof item.reservationFee === "number",
        ),
    );

    // Auto-expire reservations past their expiresAt timestamp
    const next: Reservation[] = filtered.map((item) => {
      if (
        item.status === "PENDING_PAYMENT" &&
        item.expiresAt &&
        new Date(item.expiresAt).getTime() <= now.getTime()
      ) {
        return {
          ...item,
          status: "EXPIRED" as ReservationStatus,
          updatedAt: now.toISOString(),
        };
      }
      return item;
    });

    // Persist status changes so expiry is reflected across tabs/sessions
    if (next.some((item, i) => item.status !== filtered[i].status)) {
      await writeReservations(next);
    }

    return next;
  } catch {
    return [];
  }
}

async function writeReservations(reservations: Reservation[]) {
  if (typeof window === "undefined") return;
  await storage.setItem(KEY, reservations);
}

export async function createReservation(
  property: MarketplaceProperty,
  buyerId: string,
): Promise<{ reservation?: Reservation; error?: string }> {
  if (!buyerId) return { error: "You must be signed in to reserve a property." };
  const isVerified = property.listingStatus === "OPEN_FOR_OFFERS";

  if (!isVerified || property.listingStatus !== "OPEN_FOR_OFFERS") {
    return { error: "This property is no longer available for reservation." };
  }
  const reservations = await readReservations();
  const active = reservations.filter(
    (item) =>
      item.propertyId === property.id &&
      ["PENDING_PAYMENT", "RESERVED", "COMPLETED"].includes(item.status),
  );

  const own = active.find((item) => item.buyerId === buyerId);
  if (own) return { reservation: own };

  const taken = active.find(
    (item) => item.status === "RESERVED" || item.status === "COMPLETED",
  );
  const otherPending = active.find((item) => item.status === "PENDING_PAYMENT");
  if (taken || otherPending) {
    return {
      error:
        "This property is currently reserved and is no longer available for reservation.",
    };
  }
  const now = new Date();
  const reservation: Reservation = {
    id: `YTR-RES-${String(Date.now()).slice(-6)}`,
    propertyId: property.id,
    buyerId,
    status: "PENDING_PAYMENT",
    reservationFee: RESERVATION_FEE,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString(),
  };
  await writeReservations([...reservations, reservation]);
  return { reservation };
}

export async function confirmSimulatedPayment(
  reservationId: string,
  method: string,
): Promise<Reservation | null> {
  const reservations = await readReservations();
  const index = reservations.findIndex((item) => item.id === reservationId);
  if (index < 0 || reservations[index].status !== "PENDING_PAYMENT") return null;
  const updated: Reservation = {
    ...reservations[index],
    status: "RESERVED",
    paymentId: `SIM-${Date.now()}`,
    paymentMethod: method,
    updatedAt: new Date().toISOString(),
  };
  reservations[index] = updated;
  await writeReservations(reservations);
  return updated;
}

export async function cancelReservation(
  reservationId: string,
): Promise<Reservation | null> {
  const reservations = await readReservations();
  const index = reservations.findIndex((item) => item.id === reservationId);
  if (index < 0) return null;
  const updated: Reservation = {
    ...reservations[index],
    status: "CANCELLED",
    updatedAt: new Date().toISOString(),
  };
  reservations[index] = updated;
  await writeReservations(reservations);
  return updated;
}
