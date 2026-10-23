import { MarketplaceProperty } from "./marketplace";

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

export const RESERVATIONS_KEY = "yutara-reservations";
export const RESERVATION_FEE = 25000;

export function readReservations(): Reservation[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(RESERVATIONS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
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
  } catch {
    return [];
  }
}

function writeReservations(reservations: Reservation[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(RESERVATIONS_KEY, JSON.stringify(reservations));
  } catch {
    // ignore
  }
}

export function createReservation(
  property: MarketplaceProperty,
  buyerId: string,
): { reservation?: Reservation; error?: string } {
  if (!buyerId) return { error: "You must be signed in to reserve a property." };
  const isVerified =
    property.verificationStatus === "VERIFIED" ||
    property.status === "PUBLISHED" ||
    property.status === "VERIFIED";

  if (!isVerified || property.listingStatus !== "OPEN_FOR_OFFERS") {
    return { error: "This property is no longer available for reservation." };
  }
  const reservations = readReservations();
  const active = reservations.filter(
    (item) =>
      item.propertyId === property.id &&
      ["PENDING_PAYMENT", "RESERVED", "COMPLETED"].includes(item.status),
  );

  // Resume the buyer's own reservation (also keeps this idempotent when
  // effects run twice in development).
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
  writeReservations([...reservations, reservation]);
  return { reservation };
}

export function confirmSimulatedPayment(
  reservationId: string,
  method: string,
): Reservation | null {
  const reservations = readReservations();
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
  writeReservations(reservations);
  return updated;
}
