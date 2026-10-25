"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown, FileText, Lock, ShieldCheck } from "lucide-react";
import { Modal } from "./Modal";
import { PromptModal } from "./PromptModal";
import { formatMoney } from "@/lib/marketplace";
import {
  BUYER_DOCUMENT_OPTIONS,
  cancelTransaction,
  isTransactionBuyer,
  readTransactions,
  submitTransactionDocuments,
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
  const [documentsId, setDocumentsId] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [cancelId, setCancelId] = useState<string | null>(null);

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

  const mine = transactions.filter((tx) => isTransactionBuyer(tx, email));

  if (!mine.length) {
    return (
      <div className="table-wrap empty-dashboard">
        <ShieldCheck size={26} />
        <h3>No bookings yet</h3>
        <p className="muted">
          Reserve a verified property and your booking will appear here.
        </p>
        <Link className="button button-ghost" href="/marketplace/map">
          Open verified map
        </Link>
      </div>
    );
  }

  const docTx = mine.find((tx) => tx.id === documentsId) || null;

  function toggleDoc(name: string) {
    setSelected((current) =>
      current.includes(name)
        ? current.filter((item) => item !== name)
        : [...current, name],
    );
  }

  return (
    <div className="tx-list">
      {mine.map((tx) => {
        const expanded = openId === tx.id;
        const canCancel =
          tx.stage !== "COMPLETED" && tx.stage !== "CANCELLED";
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
                  Waiting for the seller to agree to your booking.
                </span>
              )}

              {tx.stage === "DOCUMENTS_REQUESTED" && (
                <button
                  className="button button-primary"
                  onClick={() => {
                    setSelected(tx.documents);
                    setDocumentsId(tx.id);
                  }}
                >
                  <FileText size={15} /> Provide documents
                </button>
              )}

              {tx.stage === "DOCUMENTS_SUBMITTED" && (
                <span className="tx-note">
                  <Lock size={13} /> Documents submitted — awaiting YuTara
                  verification.
                </span>
              )}

              {tx.stage === "VERIFIED" && (
                <span className="tx-note tx-note-ok">
                  <ShieldCheck size={14} /> Verified — the seller will complete
                  the transfer.
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

      {docTx && (
        <Modal
          title="Provide documents"
          onClose={() => setDocumentsId(null)}
        >
          <p className="muted">
            Select the documents you are providing for{" "}
            <strong>{docTx.propertyTitle}</strong>. YuTara will review them.
          </p>
          <div className="verify-docs">
            {BUYER_DOCUMENT_OPTIONS.map((option) => (
              <label className="check-label" key={option} style={{ padding: 10 }}>
                <input
                  type="checkbox"
                  checked={selected.includes(option)}
                  onChange={() => toggleDoc(option)}
                />{" "}
                {option}
              </label>
            ))}
          </div>
          <div className="modal-foot">
            <button
              className="button button-ghost"
              onClick={() => setDocumentsId(null)}
            >
              Cancel
            </button>
            <button
              className="button button-primary"
              disabled={selected.length === 0}
              onClick={() => {
                submitTransactionDocuments(docTx.id, selected);
                setDocumentsId(null);
              }}
            >
              <FileText size={15} /> Submit documents
            </button>
          </div>
        </Modal>
      )}

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
