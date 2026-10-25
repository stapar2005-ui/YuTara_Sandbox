"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  ChevronDown,
  FileText,
  Handshake,
  Truck,
  Wallet,
} from "lucide-react";
import { formatMoney } from "@/lib/marketplace";
import { PromptModal } from "./PromptModal";
import {
  acceptBooking,
  cancelTransaction,
  completeTransaction,
  isTransactionSeller,
  readTransactions,
  TRANSACTIONS_EVENT,
  Transaction,
  STAGE_LABEL,
} from "@/lib/transactions";
import {
  TransactionFacts,
  TransactionProgress,
  TransactionRecords,
} from "./TransactionDetails";

export function SellerTransactions({ email }: { email: string }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [declineId, setDeclineId] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => setTransactions(readTransactions());
    sync();
    window.addEventListener(TRANSACTIONS_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(TRANSACTIONS_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const mine = transactions.filter((tx) => isTransactionSeller(tx, email));

  if (!mine.length) {
    return (
      <div className="table-wrap empty-dashboard">
        <Wallet size={26} />
        <h3>No bookings yet</h3>
        <p className="muted">
          When a buyer books one of your listings, the booking appears here for
          you to review.
        </p>
        <Link className="button button-ghost" href="/marketplace">
          View your listings
        </Link>
      </div>
    );
  }

  return (
    <div className="tx-list">
      {mine.map((tx) => {
        const expanded = openId === tx.id;
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
                    className={`status ${tx.stage === "COMPLETED" || tx.stage === "VERIFIED" ? "verified" : tx.stage === "CANCELLED" ? "correction" : "review"}`}
                  >
                    {STAGE_LABEL[tx.stage]}
                  </span>
                </div>
                <h3>{tx.propertyTitle}</h3>
                <p className="property-location">Buyer · {tx.buyerName}</p>
                <p className="tx-seller">Transaction · {tx.id}</p>
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
                <>
                  <button
                    className="button button-primary"
                    onClick={() => acceptBooking(tx.id, "SELLER")}
                  >
                    <Handshake size={15} /> Agree &amp; request documents
                  </button>
                  <button
                    className="button button-danger"
                    onClick={() => setDeclineId(tx.id)}
                  >
                    Decline
                  </button>
                </>
              )}

              {tx.stage === "DOCUMENTS_REQUESTED" && (
                <span className="tx-note">
                  <FileText size={13} /> Waiting for the buyer to provide
                  documents.
                </span>
              )}

              {tx.stage === "DOCUMENTS_SUBMITTED" && (
                <span className="tx-note">
                  <FileText size={13} /> Documents submitted — awaiting YuTara
                  verification.
                </span>
              )}

              {tx.stage === "VERIFIED" && (
                <button
                  className="button button-primary"
                  onClick={() => completeTransaction(tx.id, "SELLER")}
                >
                  <Truck size={15} /> Complete transaction
                </button>
              )}

              {tx.stage === "COMPLETED" && (
                <span className="tx-note tx-note-ok">
                  <BadgeCheck size={14} /> Transaction complete.
                </span>
              )}
            </div>
          </article>
        );
      })}

      {declineId && (
        <PromptModal
          title="Decline booking"
          label="Reason for declining (shared with the buyer)"
          placeholder="e.g. The offered price is below our agreed range."
          confirmLabel="Decline booking"
          onConfirm={(reason) => cancelTransaction(declineId, "SELLER", reason)}
          onClose={() => setDeclineId(null)}
        />
      )}
    </div>
  );
}
