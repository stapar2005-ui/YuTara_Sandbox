import { MarketplaceProperty } from "./marketplace";
import { Reservation } from "./reservation-service";

export type TransactionStage =
  | "BOOKING_REQUESTED"
  | "DOCUMENTS_REQUESTED"
  | "DOCUMENTS_SUBMITTED"
  | "VERIFIED"
  | "COMPLETED"
  | "CANCELLED";

export type TransactionActor = "BUYER" | "SELLER" | "YUTARA" | "SYSTEM";

export type PaymentRecord = {
  id: string;
  label: string;
  amount: number;
  method: string;
  status: "PAID" | "PENDING" | "REFUNDED" | "RELEASED";
  reference: string;
  paidAt: string;
};

export type TransactionEvent = {
  id: string;
  at: string;
  actor: TransactionActor;
  title: string;
  detail?: string;
};

export type Transaction = {
  id: string;
  reservationId: string;
  propertyId: number;
  propertyTitle: string;
  barangay: string;
  city: string;
  image: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  salePrice: number;
  reservationFee: number;
  balance: number;
  escrowHeld: number;
  stage: TransactionStage;
  payments: PaymentRecord[];
  documents: string[];
  events: TransactionEvent[];
  createdAt: string;
  updatedAt: string;
};

export const TRANSACTIONS_KEY = "yutara-transactions";
export const TRANSACTIONS_EVENT = "yutara-transactions-change";

export const STAGE_ORDER: TransactionStage[] = [
  "BOOKING_REQUESTED",
  "DOCUMENTS_REQUESTED",
  "DOCUMENTS_SUBMITTED",
  "VERIFIED",
  "COMPLETED",
];

export const STAGE_LABEL: Record<TransactionStage, string> = {
  BOOKING_REQUESTED: "Booking requested",
  DOCUMENTS_REQUESTED: "Documents requested",
  DOCUMENTS_SUBMITTED: "Documents submitted",
  VERIFIED: "Verified by YuTara",
  COMPLETED: "Transaction complete",
  CANCELLED: "Cancelled",
};

/** Documents the buyer is asked to provide for verification. */
export const BUYER_DOCUMENT_OPTIONS = [
  "Valid government ID",
  "Proof of funds / bank statement",
  "Signed letter of intent",
  "Proof of billing / address",
];

const VALID_STAGES: TransactionStage[] = [
  ...STAGE_ORDER,
  "CANCELLED",
];

function emit(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(TRANSACTIONS_EVENT));
}

export function readTransactions(): Transaction[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(TRANSACTIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item): item is Transaction =>
          Boolean(
            item &&
              typeof item === "object" &&
              typeof item.id === "string" &&
              typeof item.propertyId === "number" &&
              Array.isArray(item.payments) &&
              VALID_STAGES.includes(item.stage),
          ),
      )
      .map((item) => ({
        ...item,
        documents: Array.isArray(item.documents) ? item.documents : [],
      }));
  } catch {
    return [];
  }
}

function writeTransactions(transactions: Transaction[]): Transaction[] {
  if (typeof window === "undefined") return transactions;
  try {
    window.localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
  } catch {
    // ignore
  }
  emit();
  return transactions;
}

function event(
  actor: TransactionActor,
  title: string,
  detail?: string,
): TransactionEvent {
  return {
    id: `EVT-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    at: new Date().toISOString(),
    actor,
    title,
    detail,
  };
}

function sellerIdFor(property: MarketplaceProperty): string {
  return property.sellerEmail || "seller@yutara.com";
}

/** Create the transaction as soon as the buyer books the land. */
export function createTransactionFromReservation(input: {
  reservation: Reservation;
  property: MarketplaceProperty;
  buyerName: string;
  sellerName?: string;
}): Transaction {
  const { reservation, property } = input;
  const existing = readTransactions().find(
    (tx) => tx.reservationId === reservation.id,
  );
  if (existing) return existing;

  const now = new Date().toISOString();
  const transaction: Transaction = {
    id: `YTR-TX-${String(Date.now()).slice(-6)}`,
    reservationId: reservation.id,
    propertyId: property.id,
    propertyTitle: property.title,
    barangay: property.barangay,
    city: property.city,
    image: property.image,
    buyerId: reservation.buyerId,
    buyerName: input.buyerName,
    sellerId: sellerIdFor(property),
    sellerName: input.sellerName || property.seller,
    salePrice: property.price,
    reservationFee: reservation.reservationFee,
    balance: Math.max(property.price - reservation.reservationFee, 0),
    escrowHeld: reservation.reservationFee,
    stage: "BOOKING_REQUESTED",
    payments: [
      {
        id: `PAY-${Date.now()}-RES`,
        label: "Reservation fee",
        amount: reservation.reservationFee,
        method: reservation.paymentMethod || "Pending",
        status: reservation.status === "RESERVED" ? "PAID" : "PENDING",
        reference: reservation.paymentId || reservation.id,
        paidAt: now,
      },
    ],
    documents: [],
    events: [
      event("SYSTEM", "Booking requested", `Reservation ${reservation.id}`),
      event(
        "BUYER",
        "Buyer requested to book this land",
        "Awaiting the seller's agreement",
      ),
    ],
    createdAt: now,
    updatedAt: now,
  };
  writeTransactions([transaction, ...readTransactions()]);
  return transaction;
}

function updateTransaction(
  id: string,
  updater: (tx: Transaction) => Transaction,
): Transaction | null {
  const transactions = readTransactions();
  const index = transactions.findIndex((tx) => tx.id === id);
  if (index < 0) return null;
  const updated: Transaction = {
    ...updater(transactions[index]),
    updatedAt: new Date().toISOString(),
  };
  transactions[index] = updated;
  writeTransactions(transactions);
  return updated;
}

/** Record the reservation-fee payment once the buyer pays. */
export function markBookingPaid(
  reservationId: string,
  method: string,
): Transaction | null {
  const transaction = readTransactions().find(
    (tx) => tx.reservationId === reservationId,
  );
  if (!transaction) return null;
  return updateTransaction(transaction.id, (tx) => ({
    ...tx,
    payments: tx.payments.map((payment) =>
      payment.label === "Reservation fee"
        ? { ...payment, status: "PAID", method }
        : payment,
    ),
    events: [...tx.events, event("BUYER", "Reservation fee paid", method)],
  }));
}

export function acceptBooking(
  id: string,
  actor: TransactionActor,
  detail?: string,
): Transaction | null {
  return updateTransaction(id, (tx) => {
    if (tx.stage !== "BOOKING_REQUESTED") return tx;
    return {
      ...tx,
      stage: "DOCUMENTS_REQUESTED",
      events: [
        ...tx.events,
        event(
          actor,
          "Seller agreed to the transaction",
          detail || "Documents requested from the buyer",
        ),
      ],
    };
  });
}

export function submitTransactionDocuments(
  id: string,
  documents: string[],
): Transaction | null {
  return updateTransaction(id, (tx) => {
    if (tx.stage !== "DOCUMENTS_REQUESTED") return tx;
    return {
      ...tx,
      stage: "DOCUMENTS_SUBMITTED",
      documents,
      events: [
        ...tx.events,
        event(
          "BUYER",
          "Buyer submitted documents",
          `${documents.length} document(s) submitted for verification`,
        ),
      ],
    };
  });
}

export function verifyTransaction(
  id: string,
  actor: TransactionActor,
  note?: string,
): Transaction | null {
  return updateTransaction(id, (tx) => {
    if (tx.stage !== "DOCUMENTS_SUBMITTED") return tx;
    return {
      ...tx,
      stage: "VERIFIED",
      events: [
        ...tx.events,
        event(actor, "Documents verified", note || "You may proceed to completion"),
      ],
    };
  });
}

export function completeTransaction(
  id: string,
  actor: TransactionActor,
): Transaction | null {
  return updateTransaction(id, (tx) => {
    if (tx.stage !== "VERIFIED") return tx;
    return {
      ...tx,
      stage: "COMPLETED",
      payments: tx.payments.map((payment) => ({
        ...payment,
        status: payment.status === "PAID" ? "RELEASED" : payment.status,
      })),
      events: [...tx.events, event(actor, "Transaction completed")],
    };
  });
}

export function cancelTransaction(
  id: string,
  actor: TransactionActor,
  reason: string,
): Transaction | null {
  return updateTransaction(id, (tx) => {
    if (tx.stage === "COMPLETED") return tx;
    return {
      ...tx,
      stage: "CANCELLED",
      events: [
        ...tx.events,
        event(actor, "Transaction cancelled", reason || "No reason provided"),
      ],
    };
  });
}

export function stageIndex(stage: TransactionStage): number {
  const index = STAGE_ORDER.indexOf(stage);
  return index < 0 ? 0 : index;
}

export function isTransactionBuyer(tx: Transaction, email: string): boolean {
  return tx.buyerId === email;
}

export function isTransactionSeller(tx: Transaction, email: string): boolean {
  return tx.sellerId === email;
}

export function formatTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
