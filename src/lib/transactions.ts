import type { MarketplaceProperty } from "./marketplace";
import type { Reservation } from "./reservation-service";
import { cancelReservation } from "./reservation-service";
import { SupabaseAdapter } from "./storage-adapter";
import { supabase } from "./supabase";
import { STAGE_ORDER as MODERN_STAGE_ORDER } from "./transaction-stage-service";

export type TransactionStage =
  | "AGREEMENT_CONFIRMED"
  | "AGENCY_INTAKE"
  | "DOCUMENT_COLLECTION"
  | "DOCUMENT_REVIEW"
  | "DOCUMENT_COMPLETION"
  | "DEED_PREPARATION"
  | "DEED_EXECUTION"
  | "BIR_PROCESSING"
  | "LOCAL_GOVERNMENT_PROCESSING"
  | "REGISTRY_OF_DEEDS_PROCESSING"
  | "NEW_TITLE_ISSUANCE"
  | "TAX_DECLARATION_UPDATE"
  | "COMPLETED"
  | "ON_HOLD"
  | "CANCELLED"
  | "TERMINATED"
  // Backward compatibility aliases
  | "BOOKING_REQUESTED"
  | "AGENCY_REVIEW"
  | "PAYMENT_HELD"
  | "DOCUMENTS_PREPARED"
  | "PARTIES_SIGNED"
  | "FUNDS_RELEASED";

export type TransactionActor = "BUYER" | "SELLER" | "AGENCY" | "SYSTEM";

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
  agencyFee: number;
  stage: TransactionStage;
  payments: PaymentRecord[];
  documentsPrepared: string[];
  signedBy: string[];
  fundsReleasedAt?: string;
  events: TransactionEvent[];
  createdAt: string;
  updatedAt: string;
};

export const TRANSACTIONS_KEY = "yutara-transactions";
export const TRANSACTIONS_EVENT = "yutara-transactions-change";

export const STAGE_ORDER: TransactionStage[] = [...MODERN_STAGE_ORDER];

export const STAGE_LABEL: Record<TransactionStage, string> = {
  AGREEMENT_CONFIRMED: "Agreement Confirmed",
  AGENCY_INTAKE: "Agency Intake",
  DOCUMENT_COLLECTION: "Document Collection",
  DOCUMENT_REVIEW: "Document Review",
  DOCUMENT_COMPLETION: "Document Completion",
  DEED_PREPARATION: "Deed Preparation",
  DEED_EXECUTION: "Deed Execution",
  BIR_PROCESSING: "BIR Processing",
  LOCAL_GOVERNMENT_PROCESSING: "Local Government Processing",
  REGISTRY_OF_DEEDS_PROCESSING: "Registry of Deeds Processing",
  NEW_TITLE_ISSUANCE: "New Title Issuance",
  TAX_DECLARATION_UPDATE: "Tax Declaration Update",
  COMPLETED: "Transaction complete",
  ON_HOLD: "On Hold",
  CANCELLED: "Cancelled",
  TERMINATED: "Terminated",
  // Backward compatibility aliases
  BOOKING_REQUESTED: "Booking requested",
  AGENCY_REVIEW: "Agency review",
  PAYMENT_HELD: "Payment held in escrow",
  DOCUMENTS_PREPARED: "Documents prepared",
  PARTIES_SIGNED: "Parties signed",
  FUNDS_RELEASED: "Funds released",
};

const LEGACY_STAGE_ALIASES: TransactionStage[] = [
  "BOOKING_REQUESTED",
  "AGENCY_REVIEW",
  "PAYMENT_HELD",
  "DOCUMENTS_PREPARED",
  "PARTIES_SIGNED",
  "FUNDS_RELEASED",
];

const VALID_STAGES: TransactionStage[] = [
  ...STAGE_ORDER,
  "ON_HOLD",
  "CANCELLED",
  "TERMINATED",
  ...LEGACY_STAGE_ALIASES,
];

const storage = new SupabaseAdapter(supabase, TRANSACTIONS_KEY);

function emit(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(TRANSACTIONS_EVENT));
}

export async function readTransactions(): Promise<Transaction[]> {
  if (typeof window === "undefined") return [];
  try {
    const stored = await storage.getItem<Transaction[]>(TRANSACTIONS_KEY);
    if (!stored) return [];
    return stored
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
        documentsPrepared: Array.isArray(item.documentsPrepared)
          ? item.documentsPrepared
          : [],
        signedBy: Array.isArray(item.signedBy) ? item.signedBy : [],
      }));
  } catch {
    return [];
  }
}

async function writeTransactions(transactions: Transaction[]): Promise<void> {
  if (typeof window === "undefined") return;
  await storage.setItem(TRANSACTIONS_KEY, transactions);
  emit();
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
export async function createTransactionFromReservation(input: {
  reservation: Reservation;
  property: MarketplaceProperty;
  buyerName: string;
  sellerName?: string;
}): Promise<Transaction> {
  const { reservation, property } = input;
  const existing = (await readTransactions()).find(
    (tx) => tx.reservationId === reservation.id,
  );
  if (existing) return existing;

  const now = new Date().toISOString();
  const agencyFee = Math.round(property.price * 0.025);
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
    agencyFee,
    stage: "AGREEMENT_CONFIRMED",
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
    documentsPrepared: [],
    signedBy: [],
    events: [
      event("SYSTEM", "Booking requested", `Reservation ${reservation.id}`),
      event(
        "BUYER",
        "Buyer requested to book this land through the agency",
        "Awaiting agency review",
      ),
    ],
    createdAt: now,
    updatedAt: now,
  };
  const all = await readTransactions();
  await writeTransactions([transaction, ...all]);
  return transaction;
}

async function updateTransaction(
  id: string,
  updater: (tx: Transaction) => Transaction,
): Promise<Transaction | null> {
  const transactions = await readTransactions();
  const index = transactions.findIndex((tx) => tx.id === id);
  if (index < 0) return null;
  const updated: Transaction = {
    ...updater(transactions[index]),
    updatedAt: new Date().toISOString(),
  };
  transactions[index] = updated;
  await writeTransactions(transactions);
  return updated;
}

/** Record the reservation-fee payment once the buyer pays. */
export async function markBookingPaid(
  reservationId: string,
  method: string,
): Promise<Transaction | null> {
  const transactions = await readTransactions();
  const transaction = transactions.find(
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

export async function agencyReview(
  id: string,
  actor: TransactionActor,
  decision: "APPROVED" | "REJECTED",
  note?: string,
): Promise<Transaction | null> {
  return updateTransaction(id, (tx) => {
    if (tx.stage !== "AGREEMENT_CONFIRMED" && tx.stage !== "BOOKING_REQUESTED") return tx;
    if (decision === "APPROVED") {
      return {
        ...tx,
        stage: "AGENCY_INTAKE",
        events: [
          ...tx.events,
          event(
            actor,
            "Agency accepted the booking",
            note || "Booking accepted and under agency review",
          ),
        ],
      };
    }
    return {
      ...tx,
      stage: "CANCELLED",
      events: [
        ...tx.events,
        event(
          actor,
          "Booking cancelled by agency",
          note || "No reason provided",
        ),
      ],
    };
  });
}

export async function holdPayment(
  id: string,
  actor: TransactionActor,
  method: string,
): Promise<Transaction | null> {
  return updateTransaction(id, (tx) => {
    if (tx.stage !== "AGENCY_INTAKE" && tx.stage !== "AGENCY_REVIEW") return tx;
    return {
      ...tx,
      stage: "PAYMENT_HELD",
      payments: tx.payments.map((payment) =>
        payment.label === "Reservation fee"
          ? { ...payment, status: "PAID", method }
          : payment,
      ),
      events: [
        ...tx.events,
        event(
          actor,
          "Reservation fee held in agency escrow",
          `Payment method: ${method}`,
        ),
      ],
    };
  });
}

export async function prepareDocuments(
  id: string,
  actor: TransactionActor,
  documents: string[],
  note?: string,
): Promise<Transaction | null> {
  return updateTransaction(id, (tx) => {
    if (tx.stage !== "PAYMENT_HELD") return tx;
    if (!documents || documents.length === 0) return tx;
    return {
      ...tx,
      stage: "DOCUMENT_COLLECTION",
      documentsPrepared: documents,
      events: [
        ...tx.events,
        event(
          actor,
          "Transfer documents prepared",
          note || `${documents.length} document(s) prepared for signing`,
        ),
      ],
    };
  });
}

export async function recordSigning(
  id: string,
  actor: TransactionActor,
  party: "BUYER" | "SELLER",
): Promise<Transaction | null> {
  return updateTransaction(id, (tx) => {
    if (tx.stage !== "DOCUMENT_COLLECTION" && tx.stage !== "DOCUMENTS_PREPARED") return tx;
    if (tx.documentsPrepared.length === 0) return tx;
    const alreadySigned = tx.signedBy.includes(party);
    if (alreadySigned) return tx;
    const nextSigned = [...tx.signedBy, party];
    const nextStage =
      nextSigned.length === 2 ? "PARTIES_SIGNED" : tx.stage;
    return {
      ...tx,
      stage: nextStage,
      signedBy: nextSigned,
      events: [
        ...tx.events,
        event(
          actor,
          `${party.toLowerCase()} signed the transfer documents`,
          nextSigned.length === 2
            ? "Both parties have signed. Ready for funds release."
            : "Awaiting the other party's signature.",
        ),
      ],
    };
  });
}

export async function releaseFunds(
  id: string,
  actor: TransactionActor,
): Promise<Transaction | null> {
  return updateTransaction(id, (tx) => {
    if (tx.stage !== "PARTIES_SIGNED") return tx;
    return {
      ...tx,
      stage: "FUNDS_RELEASED",
      fundsReleasedAt: new Date().toISOString(),
      payments: tx.payments.map((payment) => ({
        ...payment,
        status: payment.status === "PAID" ? "RELEASED" : payment.status,
      })),
      events: [
        ...tx.events,
        event(actor, "Funds released to seller from escrow"),
      ],
    };
  });
}

export async function completeTransaction(
  id: string,
  actor: TransactionActor,
): Promise<Transaction | null> {
  return updateTransaction(id, (tx) => {
    if (tx.stage !== "FUNDS_RELEASED") return tx;
    return {
      ...tx,
      stage: "COMPLETED",
      events: [
        ...tx.events,
        event(actor, "Transaction completed by the agency"),
      ],
    };
  });
}

export async function cancelTransaction(
  id: string,
  actor: TransactionActor,
  reason: string,
): Promise<Transaction | null> {
  const transaction = await readTransactions().then((txs) =>
    txs.find((tx) => tx.id === id),
  );
  if (!transaction) return null;
  if (transaction.stage === "COMPLETED") return transaction;
  // Cancel the reservation as well
  await cancelReservation(transaction.reservationId);
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
  const legacyStageMap: Partial<Record<TransactionStage, TransactionStage>> = {
    BOOKING_REQUESTED: "AGREEMENT_CONFIRMED",
    AGENCY_REVIEW: "AGENCY_INTAKE",
    PAYMENT_HELD: "DOCUMENT_COLLECTION",
    DOCUMENTS_PREPARED: "DEED_PREPARATION",
    PARTIES_SIGNED: "BIR_PROCESSING",
    FUNDS_RELEASED: "TAX_DECLARATION_UPDATE",
  };
  const canonicalStage = legacyStageMap[stage] ?? stage;
  const index = STAGE_ORDER.indexOf(canonicalStage);
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
