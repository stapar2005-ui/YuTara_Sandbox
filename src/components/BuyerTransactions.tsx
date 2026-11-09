"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown, Handshake, ShieldCheck } from "lucide-react";
import { PromptModal } from "./PromptModal";
import { formatMoney } from "@/lib/marketplace";
import {
  cancelTransaction,
  isTransactionBuyer,
  readTransactions,
  recordSigning,
  TRANSACTIONS_EVENT,
  Transaction,
  STAGE_LABEL,
} from "@/lib/transactions";
import {
  TransactionFacts,
  TransactionProgress,
  TransactionRecords,
} from "./TransactionDetails";

export function BuyerTransactions({ email }: { email: string }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [cancelId, setCancelId] = useState<string | null>(null);

  useEffect(() => {
    const sync = async () => {
      const data = await readTransactions();
      setTransactions(data);
    };
    sync();
    window.addEventListener(TRANSACTIONS_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(TRANSACTIONS_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const mine = transactions.filter((tx) => isTransactionBuyer(tx, email));

  if (!mine.length) {
    return (
      <div className="table-wrap empty-dashboard">
        <ShieldCheck size={26} />
        <h3>No bookings yet</h3>
        <p className="muted">
          Reserve a property and your booking will appear here. The agency will
          coordinate the purchase with the seller.
        </p>
        <Link className="button button-ghost" href="/marketplace/map">
          Open map
        </Link>
      </div>
    );
  }

  return (
    <div className="tx-list">
      {mine.map((tx) => {
        const expanded = openId === tx.id;
        const canCancel =
          tx.stage !== "COMPLETED" && tx.stage !== "CANCELLED";
        const signedByBuyer = tx.signedBy.includes("BUYER");
        const bothSigned = tx.signedBy.length === 2;
        return (
          <article className="tx-card" key={tx.id}>
            <div className="tx-card-head">
              <div
                className="tx-card-image"
                style={{
                  backgroundImage: `url(${tx.image})`,
                  backgroundPosition: "center",
                }}
              />
              <div className="tx-card-main">
                <div className="badge-row">
                  <span
                    className={`status ${
                      tx.stage === "COMPLETED"
                        ? "verified"
                        : tx.stage === "CANCELLED"
                          ? "correction"
                          : "review"
                    }`}
                  >
                    {STAGE_LABEL[tx.stage]}
                  </span>
                </div>
                <h3>{tx.propertyTitle}</h3>
                <p className="property-location">
                  {tx.barangay}, {tx.city}
                </p>
                <p className="tx-seller">Seller · {tx.sellerName}</p>
              </div>
              <div className="tx-card-amount">
                <span className="muted">Sale price</span>
                <strong>{formatMoney(tx.salePrice)}</strong>
              </div>
            </div>

            <TransactionProgress transaction={tx} />

            {expanded && (
              <>
                <TransactionFacts transaction={tx} />
                <TransactionRecords transaction={tx} />
              </>
            )}

            <div className="tx-card-actions">
              <button
                className="button button-ghost"
                onClick={() => setOpenId(expanded ? null : tx.id)}
              >
                {expanded ? "Hide details" : "View records"}
                <ChevronDown
                  size={15}
                  style={{ transform: expanded ? "rotate(180deg)" : "none" }}
                />
              </button>

              {tx.stage === "BOOKING_REQUESTED" && (
                <span className="tx-note">
                  Waiting for the agency to review your booking.
                </span>
              )}

              {tx.stage === "AGENCY_REVIEW" && (
                <span className="tx-note">
                  The agency is reviewing your booking. You will be notified
                  once it is accepted.
                </span>
              )}

              {tx.stage === "PAYMENT_HELD" && (
                <span className="tx-note">
                  Your reservation fee is held in agency escrow. The agency will
                  prepare the transfer documents next.
                </span>
              )}

              {tx.stage === "DOCUMENTS_PREPARED" && !signedByBuyer && (
                <button
                  className="button button-primary"
                  onClick={async () => {
                    await recordSigning(tx.id, "AGENCY", "BUYER");
                  }}
                >
                  <Handshake size={15} /> Sign transfer documents
                </button>
              )}

              {tx.stage === "DOCUMENTS_PREPARED" && signedByBuyer && !bothSigned && (
                <span className="tx-note">
                  You have signed. Awaiting the seller&apos;s signature.
                </span>
              )}

              {tx.stage === "PARTIES_SIGNED" && (
                <span className="tx-note tx-note-ok">
                  Both parties have signed. The agency will release funds to
                  the seller.
                </span>
              )}

              {tx.stage === "FUNDS_RELEASED" && (
                <span className="tx-note tx-note-ok">
                  <ShieldCheck size={14} />
                  Funds released to the seller. Transfer is being recorded.
                </span>
              )}

              {tx.stage === "COMPLETED" && (
                <span className="tx-note tx-note-ok">
                  <ShieldCheck size={14} /> Transaction complete.
                </span>
              )}

              {canCancel && (
                <button
                  className="button button-danger"
                  onClick={() => setCancelId(tx.id)}
                >
                  Cancel
                </button>
              )}
            </div>
          </article>
        );
      })}

      {cancelId && (
        <PromptModal
          title="Cancel booking"
          label="Reason for cancelling (shared with the seller)"
          placeholder="e.g. I found another property."
          confirmLabel="Cancel booking"
          onConfirm={(reason) => cancelTransaction(cancelId, "BUYER", reason)}
          onClose={() => setCancelId(null)}
        />
      )}
    </div>
  );
}
