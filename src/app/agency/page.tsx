"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  Clock,
  FileText,
  ShieldCheck,
  Users,
} from "lucide-react";
import { formatMoney } from "@/lib/marketplace";
import type { Property } from "@/lib/marketplace";
import {
  readTransactions,
  createTransactionFromReservation,
  agencyReview,
  holdPayment,
  prepareDocuments,
  releaseFunds,
  completeTransaction,
  Transaction,
  TRANSACTIONS_EVENT,
} from "@/lib/transactions";
import { readProperties } from "@/lib/property-store";
import { readBookingRequests, BookingRequest } from "@/lib/booking-service";
import type { Reservation } from "@/lib/reservation-service";
import { readDocumentRequirements, DocumentRequirement, updateDocumentRequirement } from "@/lib/document-service";
import { readAgencyPersonnel, AgencyPersonnel } from "@/lib/agency-service";
import { readNotifications, Notification } from "@/lib/notification-service";
import { DemoUser, getStoredSession } from "@/lib/demo-auth";
import { AgencyLayout } from "@/components/AgencyLayout";

const STAGE_LABELS: Record<string, string> = {
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
  COMPLETED: "Completed",
  ON_HOLD: "On Hold",
  CANCELLED: "Cancelled",
  TERMINATED: "Terminated",
};

const STAGE_COLOR: Record<string, string> = {
  AGREEMENT_CONFIRMED: "#166534",
  AGENCY_INTAKE: "#166534",
  DOCUMENT_COLLECTION: "#d97706",
  DOCUMENT_REVIEW: "#d97706",
  DOCUMENT_COMPLETION: "#d97706",
  DEED_PREPARATION: "#15803d",
  DEED_EXECUTION: "#15803d",
  BIR_PROCESSING: "#15803d",
  LOCAL_GOVERNMENT_PROCESSING: "#15803d",
  REGISTRY_OF_DEEDS_PROCESSING: "#15803d",
  NEW_TITLE_ISSUANCE: "#166534",
  TAX_DECLARATION_UPDATE: "#16653d",
  COMPLETED: "#166534",
  ON_HOLD: "#d97706",
  CANCELLED: "#b91c1c",
  TERMINATED: "#b91c1c",
};

interface AgencyOverviewProps {
  transactions: Transaction[];
  pendingIntake: Transaction[];
  activeTransactions: Transaction[];
  completedTransactions: Transaction[];
  pendingDocs: DocumentRequirement[];
  bookingRequests: BookingRequest[];
  notifications: Notification[];
  agencyPersonnel: AgencyPersonnel[];
  formatMoney: (value: number) => string;
  setActiveSection: (key: string) => void;
}

interface AllTransactionsProps {
  transactions: Transaction[];
  formatMoney: (value: number) => string;
  router: ReturnType<typeof useRouter>;
}

interface TransactionIntakeProps {
  properties: Property[];
  bookingRequests: BookingRequest[];
  formatMoney: (value: number) => string;
  setActiveSection: (key: string) => void;
}

interface DocumentManagementProps {
  documentRequirements: DocumentRequirement[];
  properties: Property[];
  formatMoney: (value: number) => string;
  setActiveSection: (key: string) => void;
}

interface DocumentReviewProps {
  documentRequirements: DocumentRequirement[];
  formatMoney: (value: number) => string;
}

interface ProcessingQueueProps {
  transactions: Transaction[];
  formatMoney: (value: number) => string;
}

interface ClientManagementProps {
  transactions: Transaction[];
  formatMoney: (value: number) => string;
  setActiveSection: (key: string) => void;
}

interface CompletedTransfersProps {
  transactions: Transaction[];
  formatMoney: (value: number) => string;
}

interface AgencyReportsProps {
  transactions: Transaction[];
  formatMoney: (value: number) => string;
}

interface AgencySettingsProps {
  personnel: AgencyPersonnel[];
  formatMoney: (value: number) => string;
}

export default function AgencyPage() {
  const router = useRouter();
  const [session, setSession] = useState<DemoUser | null>(null);
  const [activeSection, setActiveSection] = useState("overview");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [bookingRequests, setBookingRequests] = useState<BookingRequest[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [documentRequirements, setDocumentRequirements] = useState<DocumentRequirement[]>([]);
  const [agencyPersonnel, setAgencyPersonnel] = useState<AgencyPersonnel[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const current = getStoredSession();
      if (!current) {
        router.push("/login?next=/agency");
        return;
      }
      setSession(current);
      const [txs, bookings, props, docs, personnel, notifs] =
        await Promise.all([
          readTransactions(),
          readBookingRequests(),
          readProperties(),
          readDocumentRequirements(),
          readAgencyPersonnel(),
          readNotifications(current.email),
        ]);
      setTransactions(txs);
      setBookingRequests(bookings);
      setProperties(props);
      setDocumentRequirements(docs);
      setAgencyPersonnel(personnel);
      setNotifications(notifs);
      setLoading(false);
    };
    load();

    const timer = window.setTimeout(() => {
      window.addEventListener(TRANSACTIONS_EVENT, load);
      window.addEventListener("storage", load);
    }, 0);
    return () => {
      window.removeEventListener(TRANSACTIONS_EVENT, load);
      window.removeEventListener("storage", load);
      clearTimeout(timer);
    };
  }, [router]);

  const isAgency = session && session.role.startsWith("AGENCY");

  const pendingIntake = transactions.filter(
    (tx) =>
      (tx.stage as string) === "AGREEMENT_CONFIRMED" ||
      (tx.stage as string) === "BOOKING_REQUESTED",
  );
  const activeTransactions = transactions.filter(
    (tx) =>
      (tx.stage as string) !== "COMPLETED" &&
      (tx.stage as string) !== "CANCELLED" &&
      (tx.stage as string) !== "TERMINATED",
  );
  const completedTransactions = transactions.filter(
    (tx) => (tx.stage as string) === "COMPLETED",
  );
  const pendingDocs = documentRequirements.filter(
    (doc) =>
      doc.status === "SUBMITTED" ||
      doc.status === "UNDER_REVIEW" ||
      doc.status === "RESUBMISSION_REQUIRED",
  );

  if (!isAgency) {
    return (
      <div className="app-shell">
        <main className="workspace">
          <div className="container">
            <h1>Access Denied</h1>
            <p>Agency portal access is restricted to agency personnel.</p>
          </div>
        </main>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="app-shell">
      <AgencyLayout
        session={session}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
      >
          <div className="container">
            <h1 className="display">Loading Agency Portal…</h1>
          </div>
        </AgencyLayout>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <AgencyLayout
        session={session}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
      >
        <div className="agency-content">
          {activeSection === "overview" && (
            <AgencyOverview
              transactions={transactions}
              pendingIntake={pendingIntake}
              activeTransactions={activeTransactions}
              completedTransactions={completedTransactions}
              pendingDocs={pendingDocs}
              bookingRequests={bookingRequests}
              notifications={notifications}
              agencyPersonnel={agencyPersonnel}
              formatMoney={formatMoney}
              setActiveSection={setActiveSection}
            />
          )}
          {activeSection === "transactions" && (
            <AllTransactions
              transactions={transactions}
              formatMoney={formatMoney}
              router={router}
            />
          )}
          {activeSection === "intake" && (
            <TransactionIntake
              properties={properties}
              bookingRequests={bookingRequests}
              formatMoney={formatMoney}
              setActiveSection={setActiveSection}
            />
          )}
          {activeSection === "documents" && (
            <DocumentManagement
              documentRequirements={documentRequirements}
              properties={properties}
              formatMoney={formatMoney}
              setActiveSection={setActiveSection}
            />
          )}
          {activeSection === "review" && (
            <DocumentReview
              documentRequirements={documentRequirements}
              formatMoney={formatMoney}
            />
          )}
          {activeSection === "queue" && (
            <ProcessingQueue
              transactions={transactions}
              formatMoney={formatMoney}
            />
          )}
          {activeSection === "clients" && (
            <ClientManagement
              transactions={transactions}
              formatMoney={formatMoney}
              setActiveSection={setActiveSection}
            />
          )}
          {activeSection === "completed" && (
            <CompletedTransfers
              transactions={completedTransactions}
              formatMoney={formatMoney}
            />
          )}
          {activeSection === "reports" && (
            <AgencyReports
              transactions={transactions}
              formatMoney={formatMoney}
            />
          )}
          {activeSection === "settings" && (
            <AgencySettings
              personnel={agencyPersonnel}
              formatMoney={formatMoney}
            />
          )}
        </div>
      </AgencyLayout>
    </div>
  );
}

/* ---------- Overview ---------- */

function AgencyOverview({
  transactions,
  pendingIntake,
  activeTransactions,
  completedTransactions,
  pendingDocs,
  bookingRequests,
  notifications,
  agencyPersonnel,
  formatMoney,
  setActiveSection,
}: AgencyOverviewProps) {
  const totalEscrow = activeTransactions.reduce(
    (sum: number, tx: Transaction) => sum + (tx.escrowHeld || 0),
    0,
  );
  const totalFees = activeTransactions.reduce(
    (sum: number, tx: Transaction) => sum + (tx.agencyFee || 0),
    0,
  );
  const unread = notifications.filter((n: Notification) => !n.isRead).length;

  return (
    <div className="container">
      <div className="agency-page-header">
        <h1 className="display">Agency Overview</h1>
        <p className="muted">
          Manage land transfer transactions for the affiliated agency.
        </p>
      </div>

      <div className="agency-stats">
        <div className="stat-card">
          <span>Active Transactions</span>
          <strong>{activeTransactions.length}</strong>
        </div>
        <div className="stat-card">
          <span>Awaiting Intake</span>
          <strong>{pendingIntake.length}</strong>
        </div>
        <div className="stat-card">
          <span>Pending Documents</span>
          <strong>{pendingDocs.length}</strong>
        </div>
        <div className="stat-card">
          <span>Completed</span>
          <strong>{completedTransactions.length}</strong>
        </div>
        <div className="stat-card">
          <span>Held in Escrow</span>
          <strong>{formatMoney(totalEscrow)}</strong>
        </div>
        <div className="stat-card">
          <span>Agency Fees</span>
          <strong>{formatMoney(totalFees)}</strong>
        </div>
      </div>

      <div className="agency-grid two-col">
        <div className="agency-card">
          <h3>New Transaction Intake</h3>
          <p className="muted">
            {pendingIntake.length} transaction(s) awaiting agency intake.
          </p>
          <button className="button button-primary" onClick={() => setActiveSection("intake")}>
            View Intake Queue
          </button>
        </div>
        <div className="agency-card">
          <h3>Document Review</h3>
          <p className="muted">
            {pendingDocs.length} document(s) requiring attention.
          </p>
          <button className="button button-primary" onClick={() => setActiveSection("review")}>
            Review Documents
          </button>
        </div>
      </div>

      {unread > 0 && (
        <div className="agency-card" style={{ marginTop: 16 }}>
          <h3>Recent Notifications</h3>
          <div className="notification-list">
            {notifications
              .slice(0, 5)
              .map((n: Notification) => (
                <div
                  key={n.id}
                  className={`notification-item ${n.isRead ? "" : "unread"}`}
                >
                  <div>
                    <strong>{n.title}</strong>
                    <p className="muted" style={{ margin: "4px 0 0", fontSize: ".85rem" }}>
                      {n.description}
                    </p>
                  </div>
                  <span className="muted" style={{ fontSize: ".75rem" }}>
                    {new Date(n.createdAt).toLocaleString()}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- All Transactions ---------- */

function AllTransactions({ transactions, formatMoney, router }: AllTransactionsProps) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ id: string; text: string; error?: boolean } | null>(null);

  const actionFor = (tx: Transaction) => {
    if (tx.stage === "AGREEMENT_CONFIRMED" || tx.stage === "BOOKING_REQUESTED") {
      return { label: "Approve transaction", success: "Transaction accepted by the agency." };
    }
    if (tx.stage === "AGENCY_INTAKE" || tx.stage === "AGENCY_REVIEW") {
      return { label: "Record escrow", success: "Reservation fee recorded in escrow." };
    }
    if (tx.stage === "PAYMENT_HELD") {
      return { label: "Prepare transfer documents", success: "Transfer documents are ready for both parties." };
    }
    if (tx.stage === "PARTIES_SIGNED") {
      return { label: "Release escrow", success: "Escrow released to the seller." };
    }
    if (tx.stage === "FUNDS_RELEASED") {
      return { label: "Complete transfer", success: "Transaction marked complete." };
    }
    return null;
  };

  const runStageAction = async (tx: Transaction) => {
    const action = actionFor(tx);
    if (!action) return;
    setBusyId(tx.id);
    setNotice(null);
    try {
      let updated: Transaction | null = null;
      if (tx.stage === "AGREEMENT_CONFIRMED" || tx.stage === "BOOKING_REQUESTED") {
        updated = await agencyReview(tx.id, "AGENCY", "APPROVED");
      } else if (tx.stage === "AGENCY_INTAKE" || tx.stage === "AGENCY_REVIEW") {
        updated = await holdPayment(tx.id, "AGENCY", "Simulated reservation fee");
      } else if (tx.stage === "PAYMENT_HELD") {
        updated = await prepareDocuments(
          tx.id,
          "AGENCY",
          ["Certificate of Title", "Tax Declaration", "Deed of Absolute Sale"],
        );
      } else if (tx.stage === "PARTIES_SIGNED") {
        updated = await releaseFunds(tx.id, "AGENCY");
      } else if (tx.stage === "FUNDS_RELEASED") {
        updated = await completeTransaction(tx.id, "AGENCY");
      }
      if (!updated) throw new Error("The transaction could not be updated. Refresh and try again.");
      setNotice({ id: tx.id, text: action.success });
    } catch (error) {
      setNotice({
        id: tx.id,
        text: error instanceof Error ? error.message : "The transaction could not be updated.",
        error: true,
      });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="container">
      <div className="agency-page-header">
        <h1 className="display">All Transactions</h1>
        <p className="muted">View and manage all land transfer transactions.</p>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Reference</th>
              <th>Property</th>
              <th>Buyer</th>
              <th>Seller</th>
              <th>Stage</th>
              <th>Sale Price</th>
              <th>Agency Fee</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx: Transaction) => (
              <tr key={tx.id}>
                <td>
                  <code className="tx-ref">{tx.id}</code>
                </td>
                <td>
                  <strong>{tx.propertyTitle}</strong>
                  <br />
                  <span className="muted">{tx.barangay}, {tx.city}</span>
                </td>
                <td>
                  <strong>{tx.buyerName}</strong>
                </td>
                <td>
                  <strong>{tx.sellerName}</strong>
                </td>
                <td>
                  <span
                    className="badge badge-status"
                    style={{
                      backgroundColor:
                        STAGE_COLOR[tx.stage] || "#166534",
                      color: "#ffffff",
                    }}
                  >
                    {STAGE_LABELS[tx.stage] || tx.stage}
                  </span>
                </td>
                <td>{formatMoney(tx.salePrice || 0)}</td>
                <td>{formatMoney(tx.agencyFee || 0)}</td>
                <td>
                  {actionFor(tx) && (
                    <button
                      className="button button-primary"
                      data-transaction-action={tx.stage}
                      disabled={busyId === tx.id}
                      onClick={() => runStageAction(tx)}
                    >
                      {busyId === tx.id ? "Saving…" : actionFor(tx)!.label}
                    </button>
                  )}
                  {notice?.id === tx.id && (
                    <p role="status" style={{ color: notice.error ? "#b91c1c" : "#166534", margin: "6px 0" }}>
                      {notice.text}
                    </p>
                  )}
                  <button className="button button-ghost" onClick={() => router.push(`/marketplace/${tx.propertyId}`)}>
                    Manage
                  </button>
                </td>
              </tr>
            ))}
            {transactions.length === 0 && (
              <tr>
                <td colSpan={8}>
                  <div className="empty-dashboard">
                    <FileText size={24} />
                    <p className="muted">No transactions found.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------- Transaction Intake ---------- */

function TransactionIntake({ properties, bookingRequests, formatMoney, setActiveSection }: TransactionIntakeProps) {
  const [selectedPropId, setSelectedPropId] = useState<number>(properties[0]?.id || 1);
  const [buyerEmail, setBuyerEmail] = useState("");
  const [sellerEmail, setSellerEmail] = useState("");
  const [agreedPrice, setAgreedPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [msg, setMsg] = useState("");

  const handleManualCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const prop = properties.find((p) => p.id === Number(selectedPropId));
    if (!prop) {
      setMsg("Please select a property.");
      return;
    }
    if (!buyerEmail.trim() || !buyerEmail.includes("@")) {
      setMsg("Please enter a valid buyer email address.");
      return;
    }
    try {
      await createTransactionFromReservation({
        reservation: {
          id: `YTR-RES-${Date.now()}`,
          propertyId: prop.id,
          buyerId: buyerEmail.trim().toLowerCase(),
          status: "RESERVED",
          reservationFee: 25000,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
        },
        property: prop,
        buyerName: buyerEmail.split("@")[0],
        sellerName: sellerEmail.trim() || prop.seller,
      });
      setMsg("Transaction created successfully!");
      setTimeout(() => {
        setActiveSection("transactions");
      }, 1000);
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : "Failed to create transaction.");
    }
  };
  return (
    <div className="container">
      <div className="agency-page-header">
        <h1 className="display">New Transaction Intake</h1>
        <p className="muted">
          Create new agency-managed transactions from approved booking requests.
        </p>
      </div>

      <div className="agency-card">
        <h3>Approved Booking Requests</h3>
        <p className="muted">
          Booking requests approved by sellers that are ready for agency intake.
        </p>
        {bookingRequests.length > 0 ? (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Property</th>
                  <th>Buyer</th>
                  <th>Proposed Price</th>
                  <th>Requested</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {bookingRequests.map((b: BookingRequest) => (
                  <tr key={b.id}>
                    <td>
                      <strong>{b.propertyTitle}</strong>
                    </td>
                    <td>{b.buyerName}</td>
                    <td>
                      {b.proposedPrice ? formatMoney(b.proposedPrice) : "—"}
                    </td>
                    <td>{new Date(b.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button
                        className="button button-primary"
                        onClick={() => {
                          const prop = properties.find((p) => p.id === b.propertyId)!;
                          createTransactionFromReservation({
                            reservation: {
                              id: `YTR-RES-${b.id}`,
                              propertyId: b.propertyId,
                              buyerId: b.buyerId,
                              status: "PENDING_PAYMENT",
                              reservationFee: 25000,
                              createdAt: b.createdAt,
                              updatedAt: b.createdAt,
                              expiresAt: b.createdAt,
                            } satisfies Reservation,
                            property: prop,
                            buyerName: b.buyerName,
                          });
                          setActiveSection("transactions");
                        }}
                      >
                        Create Transaction
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-dashboard">
            <ShieldCheck size={24} />
            <p className="muted">No approved booking requests awaiting intake.</p>
          </div>
        )}
      </div>

      <div className="agency-card" style={{ marginTop: 16 }}>
        <h3>Manual Transaction Creation</h3>
        <p className="muted">
          Create a new transaction directly for a property already agreed upon
          by buyer and seller.
        </p>
        {msg && (
          <div style={{ padding: "10px 14px", marginBottom: 16, borderRadius: 6, background: msg.includes("success") ? "#e8f5e9" : "#ffebee", color: msg.includes("success") ? "#2e7d32" : "#c62828", fontSize: "0.875rem", fontWeight: 500 }}>
            {msg}
          </div>
        )}
        <form onSubmit={handleManualCreate} className="form-grid" style={{ gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
          <label style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: "6px" }}>
            <span>Property</span>
            <select
              className="form-input"
              style={{ width: "100%", height: "auto", minHeight: "44px", textOverflow: "ellipsis" }}
              value={selectedPropId}
              onChange={(e) => setSelectedPropId(Number(e.target.value))}
            >
              {properties.map((p: Property) => (
                <option key={p.id} value={p.id}>
                  {p.title} — {p.barangay}, {p.city}
                </option>
              ))}
            </select>
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <span>Buyer Email</span>
            <input
              className="form-input"
              type="email"
              placeholder="buyer@example.com"
              value={buyerEmail}
              onChange={(e) => setBuyerEmail(e.target.value)}
              required
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <span>Seller Email</span>
            <input
              className="form-input"
              type="email"
              placeholder="seller@example.com"
              value={sellerEmail}
              onChange={(e) => setSellerEmail(e.target.value)}
            />
          </label>
          <label style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: "6px" }}>
            <span>Agreed Sale Price (PHP)</span>
            <input
              className="form-input"
              inputMode="numeric"
              placeholder="0"
              value={agreedPrice}
              onChange={(e) => setAgreedPrice(e.target.value)}
            />
          </label>
          <label style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: "6px" }}>
            <span>Notes</span>
            <textarea
              className="form-input form-textarea"
              placeholder="Agency notes for this transaction"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>
          <div style={{ gridColumn: "1 / -1", marginTop: 8 }}>
            <button className="button button-primary" type="submit">
              Create Transaction
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ---------- Document Management ---------- */

function DocumentManagement({ documentRequirements, properties, formatMoney, setActiveSection }: DocumentManagementProps) {
  return (
    <div className="container">
      <div className="agency-page-header">
        <h1 className="display">Document Management</h1>
        <p className="muted">
          Manage document requirements and submissions for all transactions.
        </p>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Requirement</th>
              <th>Transaction</th>
              <th>Responsible Party</th>
              <th>Status</th>
              <th>Deadline</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {documentRequirements.map((doc: DocumentRequirement) => (
              <tr key={doc.id}>
                <td>
                  <strong>{doc.requirementName}</strong>
                  <br />
                  <span className="muted" style={{ fontSize: ".8rem" }}>
                    {doc.description}
                  </span>
                </td>
                <td>{doc.transactionId}</td>
                <td>{doc.responsibleParty}</td>
                <td>
                  <span
                    className="badge badge-status"
                    style={{
                      backgroundColor:
                        doc.status === "ACCEPTED"
                          ? "#166534"
                          : doc.status === "REJECTED"
                            ? "#b91c1c"
                            : doc.status === "SUBMITTED" ||
                              doc.status === "UNDER_REVIEW"
                              ? "#d97706"
                              : "#6b7280",
                      color: "#ffffff",
                    }}
                  >
                    {doc.status.replaceAll("_", " ")}
                  </span>
                </td>
                <td>
                  {doc.submissionDeadline || "—"}
                </td>
                <td>
                  <button className="button button-ghost" onClick={() => setActiveSection("review")}>
                    View
                  </button>
                </td>
              </tr>
            ))}
            {documentRequirements.length === 0 && (
              <tr>
                <td colSpan={6}>
                  <div className="empty-dashboard">
                    <FileText size={24} />
                    <p className="muted">No document requirements found.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------- Document Review ---------- */

function DocumentReview({ documentRequirements, formatMoney }: DocumentReviewProps) {
  const pendingReview = documentRequirements.filter(
    (doc: DocumentRequirement) =>
      doc.status === "SUBMITTED" || doc.status === "UNDER_REVIEW",
  );

  const handleDocDecision = async (docId: string, status: "ACCEPTED" | "REJECTED", remarks?: string) => {
    await updateDocumentRequirement(docId, { status: status as DocumentRequirement["status"], agencyRemarks: remarks });
    const docs = await readDocumentRequirements();
    // Refresh via state is handled by storage event listener; force re-read not needed here
  };

  return (
    <div className="container">
      <div className="agency-page-header">
        <h1 className="display">Document Review</h1>
        <p className="muted">
          Review submitted documents and make accept/reject decisions.
        </p>
      </div>

      {pendingReview.length > 0 ? (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Document</th>
                <th>Requirement</th>
                <th>Submitted By</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingReview.map((doc: DocumentRequirement) => (
                <tr key={doc.id}>
                  <td>
                    <strong>{doc.requirementName}</strong>
                    <br />
                    <span className="muted" style={{ fontSize: ".8rem" }}>
                      {doc.transactionId}
                    </span>
                  </td>
                  <td>{doc.responsibleParty}</td>
                  <td>
                    <span className="badge badge-status">
                      {doc.status.replaceAll("_", " ")}
                    </span>
                  </td>
                  <td>
                      <div style={{ display: "flex", gap: 6 }}>
                      <button
                        className="button button-primary"
                        onClick={() => handleDocDecision(doc.id, "ACCEPTED", "Document requirements met")}
                      >
                        Accept
                      </button>
                      <button
                        className="button button-danger"
                        onClick={() => handleDocDecision(doc.id, "REJECTED", "Document requirements not met")}
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-dashboard">
          <BadgeCheck size={24} />
          <p className="muted">No documents pending review.</p>
        </div>
      )}
    </div>
  );
}

/* ---------- Processing Queue ---------- */

function ProcessingQueue({ transactions, formatMoney }: ProcessingQueueProps) {
  const queue = transactions.filter(
    (tx: Transaction) =>
      (tx.stage as string) !== "COMPLETED" &&
      (tx.stage as string) !== "CANCELLED" &&
      (tx.stage as string) !== "TERMINATED",
  );

  return (
    <div className="container">
      <div className="agency-page-header">
        <h1 className="display">Processing Queue</h1>
        <p className="muted">
          Track transactions currently being processed by the agency.
        </p>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Reference</th>
              <th>Property</th>
              <th>Current Stage</th>
              <th>Next Action</th>
              <th>Deadline</th>
              <th>Assigned</th>
            </tr>
          </thead>
          <tbody>
            {queue.map((tx: Transaction) => (
              <tr key={tx.id}>
                <td>
                  <code className="tx-ref">{tx.id}</code>
                </td>
                <td>{tx.propertyTitle}</td>
                <td>
                  <span
                    className="badge badge-status"
                    style={{
                      backgroundColor: STAGE_COLOR[tx.stage] || "#166534",
                      color: "#ffffff",
                    }}
                  >
                    {STAGE_LABELS[tx.stage] || tx.stage}
                  </span>
                </td>
                <td>Continue processing</td>
                <td>—</td>
                <td>Agency Officer</td>
              </tr>
            ))}
            {queue.length === 0 && (
              <tr>
                <td colSpan={6}>
                  <div className="empty-dashboard">
                    <Clock size={24} />
                    <p className="muted">No transactions in the processing queue.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------- Client Management ---------- */

function ClientManagement({ transactions, formatMoney, setActiveSection }: ClientManagementProps) {
  const buyerClients = transactions.map((tx: Transaction) => ({
    name: tx.buyerName,
    email: tx.buyerId,
    role: "BUYER",
  }));
  const sellerClients = transactions.map((tx: Transaction) => ({
    name: tx.sellerName,
    email: tx.sellerId,
    role: "SELLER",
  }));
  const clients = [...new Set([...buyerClients, ...sellerClients])];

  return (
    <div className="container">
      <div className="agency-page-header">
        <h1 className="display">Client Management</h1>
        <p className="muted">
          Manage buyers and sellers involved in agency transactions.
        </p>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Client</th>
              <th>Email</th>
              <th>Role</th>
              <th>Transactions</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((c: { name: string; email: string; role: string }, i: number) => (
              <tr key={i}>
                <td><strong>{c.name}</strong></td>
                <td>{c.email}</td>
                <td>{c.role}</td>
                <td>{transactions.filter(
                  (tx: Transaction) =>
                    tx.buyerId === c.email || tx.sellerId === c.email,
                ).length}</td>
                <td>
                  <button className="button button-ghost" onClick={() => setActiveSection("transactions")}>
                    View
                  </button>
                </td>
              </tr>
            ))}
            {clients.length === 0 && (
              <tr>
                <td colSpan={5}>
                  <div className="empty-dashboard">
                    <Users size={24} />
                    <p className="muted">No clients found.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------- Completed Transfers ---------- */

function CompletedTransfers({ transactions, formatMoney }: CompletedTransfersProps) {
  return (
    <div className="container">
      <div className="agency-page-header">
        <h1 className="display">Completed Transfers</h1>
        <p className="muted">
          View all completed land transfer transactions.
        </p>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Reference</th>
              <th>Property</th>
              <th>Buyer</th>
              <th>Seller</th>
              <th>Sale Price</th>
              <th>Completed</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx: Transaction) => (
              <tr key={tx.id}>
                <td>
                  <code className="tx-ref">{tx.id}</code>
                </td>
                <td>{tx.propertyTitle}</td>
                <td>{tx.buyerName}</td>
                <td>{tx.sellerName}</td>
                <td>{formatMoney(tx.salePrice || 0)}</td>
                <td>
                  {new Date(tx.updatedAt || tx.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {transactions.length === 0 && (
              <tr>
                <td colSpan={6}>
                  <div className="empty-dashboard">
                    <AwardIcon />
                    <p className="muted">No completed transfers yet.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------- Agency Reports ---------- */

function AgencyReports({ transactions, formatMoney }: AgencyReportsProps) {
  const totalValue = transactions.reduce(
    (sum: number, tx: Transaction) => sum + (tx.salePrice || 0),
    0,
  );
  const totalFees = transactions.reduce(
    (sum: number, tx: Transaction) => sum + (tx.agencyFee || 0),
    0,
  );

  return (
    <div className="container">
      <div className="agency-page-header">
        <h1 className="display">Reports</h1>
        <p className="muted">Agency transaction reports and analytics.</p>
      </div>

      <div className="agency-stats">
        <div className="stat-card">
          <span>Total Transactions</span>
          <strong>{transactions.length}</strong>
        </div>
        <div className="stat-card">
          <span>Total Value</span>
          <strong>{formatMoney(totalValue)}</strong>
        </div>
        <div className="stat-card">
          <span>Total Agency Fees</span>
          <strong>{formatMoney(totalFees)}</strong>
        </div>
      </div>
    </div>
  );
}

/* ---------- Agency Settings ---------- */

function AgencySettings({ personnel, formatMoney }: AgencySettingsProps) {
  return (
    <div className="container">
      <div className="agency-page-header">
        <h1 className="display">Agency Settings</h1>
        <p className="muted">
          Configure agency personnel and operational settings.
        </p>
      </div>

      <div className="agency-card">
        <h3>Agency Personnel</h3>
        <p className="muted">
          Manage agency staff who can process transactions and review documents.
        </p>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {personnel.map((p: AgencyPersonnel) => (
                <tr key={p.id}>
                  <td><strong>{p.name}</strong></td>
                  <td>{p.email}</td>
                  <td>{p.role}</td>
                  <td>
                    <span className="badge badge-status">
                      {p.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
              ))}
              {personnel.length === 0 && (
                <tr>
                  <td colSpan={4}>
                    <div className="empty-dashboard">
                      <Users size={24} />
                      <p className="muted">No agency personnel configured.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ---------- Helper Icons ---------- */

function AwardIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" y1="8" r="7" />
      <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.89" />
    </svg>
  );
}
