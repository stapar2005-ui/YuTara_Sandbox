"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  Clock,
  FileText,
  Handshake,
  ShieldCheck,
  Truck,
  Wallet,
} from "lucide-react";
import { formatMoney } from "@/lib/marketplace";
import {
  agencyReview,
  cancelTransaction,
  holdPayment,
  prepareDocuments,
  readTransactions,
  recordSigning,
  releaseFunds,
  TRANSACTIONS_EVENT,
  Transaction,
} from "@/lib/transactions";
import { PromptModal } from "@/components/PromptModal";
import { Modal } from "@/components/Modal";
import { getStoredSession } from "@/lib/demo-auth";

const STAGE_LABELS: Record<string, string> = {
  BOOKING_REQUESTED: "Booking requested",
  AGENCY_REVIEW: "Agency review",
  PAYMENT_HELD: "Payment held in escrow",
  DOCUMENTS_PREPARED: "Documents prepared",
  PARTIES_SIGNED: "Parties signed",
  FUNDS_RELEASED: "Funds released",
  COMPLETED: "Transaction complete",
  CANCELLED: "Cancelled",
};

export default function AgencyPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [reviewId, setReviewId] = useState<string | null>(null);
  const [reviewDecision, setReviewDecision] = useState<"APPROVED" | "REJECTED">("APPROVED");
  const [reviewNote, setReviewNote] = useState("");
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [docsId, setDocsId] = useState<string | null>(null);
  const [docs, setDocs] = useState<string[]>([]);
  const [signId, setSignId] = useState<string | null>(null);
  const [signParty, setSignParty] = useState<"BUYER" | "SELLER">("BUYER");
  const [releaseId, setReleaseId] = useState<string | null>(null);
  const [cancelId, setCancelId] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    window.setTimeout(() => {
      const current = getStoredSession();
      if (!current) {
        router.replace("/login?next=/agency");
        return;
      }
    }, 0);
  }, [router]);

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

  const agency = transactions.filter(
    (tx) => tx.stage !== "COMPLETED" && tx.stage !== "CANCELLED",
  );
  const completed = transactions.filter((tx) => tx.stage === "COMPLETED");

  const totalEscrow = agency.reduce(
    (sum, tx) => sum + tx.escrowHeld,
    0,
  );
  const totalFees = agency.reduce((sum, tx) => sum + tx.agencyFee, 0);

  return (
    <div className="app-shell">
      <main className="workspace">
        <div className="container">
          <div className="eyebrow">Partner agency</div>
          <h1 className="display">Transaction desk</h1>

          <div className="stats">
            <div className="stat">
              <span>Active transactions</span>
              <strong>{agency.length}</strong>
            </div>
            <div className="stat">
              <span>Completed</span>
              <strong>{completed.length}</strong>
            </div>
            <div className="stat">
              <span>Held in escrow</span>
              <strong>{formatMoney(totalEscrow)}</strong>
            </div>
            <div className="stat">
              <span>Agency fees</span>
              <strong>{formatMoney(totalFees)}</strong>
            </div>
          </div>

          <div className="dashboard-heading" style={{ marginTop: 40 }}>
            <div>
              <div className="eyebrow">Active transactions</div>
              <h2 className="display">
                <Clock size={20} style={{ verticalAlign: "-3px" }} />
                In progress
              </h2>
            </div>
          </div>

          {agency.length === 0 ? (
            <div className="table-wrap empty-dashboard">
              <ShieldCheck size={24} />
              <h3>No active transactions</h3>
              <p className="muted">
                When a buyer requests a booking, it appears here for agency
                review and coordination.
              </p>
            </div>
          ) : (
            <div className="dashboard-grid">
              {agency.map((tx) => (
                <article className="asset-card" key={tx.id}>
                  <div
                    className="asset-image"
                    style={{
                      backgroundImage: `url(${tx.image})`,
                      backgroundPosition: "center",
                    }}
                  />
                  <div className="property-body">
                    <span
                      className={`badge badge-status`}
                    >
                      {STAGE_LABELS[tx.stage]}
                    </span>
                    <h3>{tx.propertyTitle}</h3>
                    <p className="property-location">
                      {tx.buyerName} → {tx.sellerName}
                    </p>
                    <div className="property-meta">
                      <strong className="price">
                        {formatMoney(tx.salePrice)}
                      </strong>
                      <span className="area">
                        Agency fee · {formatMoney(tx.agencyFee)}
                      </span>
                    </div>
                    <div style={{ marginTop: 14, display: "grid", gap: 8 }}>
                      {tx.stage === "BOOKING_REQUESTED" && (
                        <button
                          className="button button-primary"
                          onClick={() => {
                            setReviewId(tx.id);
                            setReviewDecision("APPROVED");
                            setReviewNote("");
                          }}
                        >
                          <Handshake size={14} /> Accept booking
                        </button>
                      )}
                      {tx.stage === "AGENCY_REVIEW" && (
                        <button
                          className="button button-primary"
                          onClick={() => {
                            setPaymentId(tx.id);
                            setPaymentMethod("");
                          }}
                        >
                          <Wallet size={14} /> Record payment held
                        </button>
                      )}
                      {tx.stage === "PAYMENT_HELD" && (
                        <button
                          className="button button-primary"
                          onClick={() => {
                            setDocsId(tx.id);
                            setDocs([]);
                          }}
                        >
                          <FileText size={14} /> Prepare documents
                        </button>
                      )}
                      {tx.stage === "DOCUMENTS_PREPARED" && (
                        <button
                          className="button button-primary"
                          onClick={() => {
                            setSignId(tx.id);
                            setSignParty("BUYER");
                          }}
                        >
                          <Handshake size={14} /> Record signature
                        </button>
                      )}
                      {tx.stage === "PARTIES_SIGNED" && (
                        <button
                          className="button button-primary"
                          onClick={() => setReleaseId(tx.id)}
                        >
                          <Truck size={14} /> Release funds
                        </button>
                      )}
                      {tx.stage === "FUNDS_RELEASED" && (
                        <button
                          className="button button-primary"
                          onClick={async () => {
                            await releaseFunds(tx.id, "AGENCY");
                          }}
                        >
                          <BadgeCheck size={14} /> Complete
                        </button>
                      )}
                      <button
                        className="button button-danger"
                        onClick={() => {
                          setCancelId(tx.id);
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
          <div>
            {completed.length > 0 && (
              <>
                <div className="dashboard-heading" style={{ marginTop: 46 }}>
                  <div>
                    <div className="eyebrow">Completed</div>
                    <h2 className="display">
                      <BadgeCheck size={20} style={{ verticalAlign: "-3px" }} />
                      Finished transactions
                    </h2>
                  </div>
                </div>
                <div className="dashboard-grid">
              {completed.map((tx) => (
                <article className="asset-card" key={tx.id}>
                  <div
                    className="asset-image"
                    style={{
                      backgroundImage: `url(${tx.image})`,
                      backgroundPosition: "center",
                    }}
                  />
                  <div className="property-body">
                    <span className="badge badge-verified">
                      <BadgeCheck size={12} /> Complete
                    </span>
                    <h3>{tx.propertyTitle}</h3>
                    <p className="property-location">
                      {tx.buyerName} → {tx.sellerName}
                    </p>
                    <div className="property-meta">
                      <strong className="price">
                        {formatMoney(tx.salePrice)}
                      </strong>
                    </div>
                    <small className="muted">
                      {formatTimestamp(tx.updatedAt)}
                    </small>
                  </div>
                </article>
              ))}
            </div>
            </>
          )}
          </div>

          {reviewId && (
            <Modal
              title="Agency review"
              onClose={() => setReviewId(null)}
            >
              <p className="muted">
                Accept or reject this booking request. Accepted bookings move to
                payment hold in agency escrow.
              </p>
              <label className="form-label">
                Decision
                <select
                  className="form-input"
                  value={reviewDecision}
                  onChange={(event) =>
                    setReviewDecision(event.target.value as "APPROVED" | "REJECTED")
                  }
                >
                  <option value="APPROVED">Accept booking</option>
                  <option value="REJECTED">Reject booking</option>
                </select>
              </label>
              {reviewDecision === "REJECTED" && (
                <label style={{ gridColumn: "1 / -1" }}>
                  Reason
                  <textarea
                    className="form-input form-textarea"
                    value={reviewNote}
                    onChange={(event) => setReviewNote(event.target.value)}
                    placeholder="Reason for rejection"
                  />
                </label>
              )}
              <div className="modal-foot">
                <button
                  className="button button-ghost"
                  onClick={() => setReviewId(null)}
                >
                  Cancel
                </button>
                <button
                  className="button button-primary"
                  disabled={
                    reviewDecision === "REJECTED" && !reviewNote.trim()
                  }
                  onClick={async () => {
                    await agencyReview(
                      reviewId,
                      "AGENCY",
                      reviewDecision,
                      reviewNote.trim() || undefined,
                    );
                    setReviewId(null);
                  }}
                >
                  {reviewDecision === "APPROVED"
                    ? "Accept booking"
                    : "Reject booking"}
                </button>
              </div>
            </Modal>
          )}

          {paymentId && (
            <Modal title="Record payment" onClose={() => setPaymentId(null)}>
              <p className="muted">
                Record the buyer&apos;s reservation fee held in agency escrow.
              </p>
              <label className="form-label">
                Payment method
                <select
                  className="form-input"
                  value={paymentMethod}
                  onChange={(event) => setPaymentMethod(event.target.value)}
                >
                  <option value="">Select method</option>
                  <option value="GCash">GCash</option>
                  <option value="Maya">Maya</option>
                  <option value="Bank transfer">Bank transfer</option>
                  <option value="Card">Card</option>
                </select>
              </label>
              <div className="modal-foot">
                <button
                  className="button button-ghost"
                  onClick={() => setPaymentId(null)}
                >
                  Cancel
                </button>
                <button
                  className="button button-primary"
                  disabled={!paymentMethod.trim()}
                  onClick={async () => {
                    await holdPayment(paymentId, "AGENCY", paymentMethod);
                    setPaymentId(null);
                  }}
                >
                  Record payment
                </button>
              </div>
            </Modal>
          )}

          {docsId && (
            <Modal
              title="Prepare transfer documents"
              onClose={() => {
                setDocsId(null);
                setDocs([]);
              }}
            >
              <p className="muted">
                List the transfer documents the agency prepares for this
                transaction.
              </p>
              <div className="form-grid">
                {docs.map((doc, index) => (
                  <label key={index} style={{ gridColumn: "1 / -1" }}>
                    Document {index + 1}
                    <input
                      className="form-input"
                      value={doc}
                      onChange={(event) => {
                        const next = [...docs];
                        next[index] = event.target.value;
                        setDocs(next);
                      }}
                      placeholder="e.g. Deed of sale"
                    />
                  </label>
                ))}
                <label style={{ gridColumn: "1 / -1" }}>
                  <button
                    className="button button-ghost"
                    type="button"
                    onClick={() => setDocs([...docs, ""])}
                  >
                    <ArrowRight size={14} /> Add document
                  </button>
                </label>
              </div>
              <div className="modal-foot">
                <button
                  className="button button-ghost"
                  onClick={() => {
                    setDocsId(null);
                    setDocs([]);
                  }}
                >
                  Cancel
                </button>
                <button
                  className="button button-primary"
                  disabled={docs.some((d) => !d.trim())}
                  onClick={async () => {
                    await prepareDocuments(
                      docsId,
                      "AGENCY",
                      docs.filter((d) => d.trim()),
                    );
                    setDocsId(null);
                    setDocs([]);
                  }}
                >
                  Prepare documents
                </button>
              </div>
            </Modal>
          )}

          {signId && (
            <Modal title="Record signature" onClose={() => setSignId(null)}>
              <p className="muted">
                Record which party has signed the transfer documents.
              </p>
              <label className="form-label">
                Signing party
                <select
                  className="form-input"
                  value={signParty}
                  onChange={(event) =>
                    setSignParty(event.target.value as "BUYER" | "SELLER")
                  }
                >
                  <option value="BUYER">Buyer</option>
                  <option value="SELLER">Seller</option>
                </select>
              </label>
              <div className="modal-foot">
                <button
                  className="button button-ghost"
                  onClick={() => setSignId(null)}
                >
                  Cancel
                </button>
                <button
                  className="button button-primary"
                  onClick={async () => {
                    await recordSigning(signId, "AGENCY", signParty);
                    setSignId(null);
                  }}
                >
                  Record signature
                </button>
              </div>
            </Modal>
          )}

          {releaseId && (
            <Modal title="Release funds" onClose={() => setReleaseId(null)}>
              <p className="muted">
                Release the escrow funds to the seller and complete the
                transaction.
              </p>
              <div className="review-panel">
                <div className="review-row">
                  <span>Property</span>
                  <strong>
                    {transactions.find((tx) => tx.id === releaseId)?.propertyTitle}
                  </strong>
                </div>
                <div className="review-row">
                  <span>Sale price</span>
                  <strong>
                    {formatMoney(
                      transactions.find((tx) => tx.id === releaseId)?.salePrice ||
                        0,
                    )}
                  </strong>
                </div>
                <div className="review-row">
                  <span>Agency fee</span>
                  <strong>
                    {formatMoney(
                      transactions.find((tx) => tx.id === releaseId)?.agencyFee ||
                        0,
                    )}
                  </strong>
                </div>
              </div>
              <div className="modal-foot">
                <button
                  className="button button-ghost"
                  onClick={() => setReleaseId(null)}
                >
                  Cancel
                </button>
                <button
                  className="button button-primary"
                  onClick={async () => {
                    await releaseFunds(releaseId, "AGENCY");
                    setReleaseId(null);
                  }}
                >
                  Release funds
                </button>
              </div>
            </Modal>
          )}

          {cancelId && (
            <PromptModal
              title="Cancel transaction"
              label="Reason for cancellation"
              placeholder="e.g. Buyer withdrew the offer."
              confirmLabel="Cancel transaction"
              onConfirm={async (reason) => {
                await cancelTransaction(cancelId, "AGENCY", reason);
                setCancelId(null);
              }}
              onClose={() => setCancelId(null)}
            />
          )}
        </div>
      </main>
    </div>
  );
}

function formatTimestamp(value: string): string {
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
