"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  Check,
  ClipboardCheck,
  FileCheck2,
  Lock,
  MessageSquare,
  Send,
  ShieldCheck,
  X,
} from "lucide-react";
import {
  getListingStatus,
  ListingStatus,
  Property,
  VerificationStatus,
} from "@/lib/marketplace";
import { YUTARA_SERVICE_AREA } from "@/lib/yutara-config";
import {
  DocumentStatus,
  formatCheckDate,
  getVerificationRecord,
  isReadyForApproval,
  OfficeCheckStatus,
  readVerificationRecords,
  saveVerificationRecord,
  VerificationDecision,
  VerificationRecord,
  verificationProgress,
  VERIFICATION_EVENT,
} from "@/lib/verification";

type Decision = VerificationDecision;

export function AdminView({
  properties,
  onApprove,
  onSetListingStatus,
  onSetVerification,
}: {
  properties: Property[];
  onApprove: (id: number) => void;
  onSetListingStatus: (
    id: number,
    status: ListingStatus,
    reason?: string,
  ) => void;
  onSetVerification: (
    id: number,
    status: VerificationStatus,
    note: string,
  ) => void;
}) {
  const [records, setRecords] = useState<VerificationRecord[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [draft, setDraft] = useState<VerificationRecord | null>(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const sync = () => setRecords(readVerificationRecords());
    sync();
    window.addEventListener(VERIFICATION_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(VERIFICATION_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const select = (id: number | null) => {
    setSelectedId(id);
    setDraft(id === null ? null : getVerificationRecord(id));
  };

  const pending = properties.filter(
    (item) =>
      item.status !== "PUBLISHED" && item.verificationStatus !== "VERIFIED",
  );

  const selected = properties.find((item) => item.id === selectedId) || null;

  const flash = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2600);
  };

  const persist = (next: VerificationRecord) => {
    const saved = saveVerificationRecord(next);
    setDraft(saved);
    setRecords(readVerificationRecords());
    return saved;
  };

  const setDocument = (key: string, status: DocumentStatus) => {
    if (!draft) return;
    persist({
      ...draft,
      documents: draft.documents.map((document) =>
        document.key === key ? { ...document, status } : document,
      ),
    });
  };

  const verifyAll = () => {
    if (!draft) return;
    persist({
      ...draft,
      documents: draft.documents.map((document) => ({
        ...document,
        status: "VERIFIED" as DocumentStatus,
      })),
    });
    flash("All required documents marked verified.");
  };

  const patchCheck = (
    checkId: string,
    patch: Partial<VerificationRecord["checks"][number]>,
  ) => {
    if (!draft) return;
    setDraft({
      ...draft,
      checks: draft.checks.map((check) =>
        check.id === checkId ? { ...check, ...patch } : check,
      ),
    });
  };

  const sendRequest = (checkId: string) => {
    if (!draft) return;
    const next: VerificationRecord = {
      ...draft,
      checks: draft.checks.map((check) =>
        check.id === checkId
          ? {
              ...check,
              status: "PENDING",
              requestedAt: new Date().toISOString(),
              checkedAt: undefined,
            }
          : check,
      ),
    };
    persist(next);
    flash("Verification request sent to the office.");
  };

  const logResponse = (checkId: string) => {
    if (!draft) return;
    persist({
      ...draft,
      checks: draft.checks.map((check) =>
        check.id === checkId
          ? { ...check, checkedAt: new Date().toISOString() }
          : check,
      ),
    });
    flash("Office response recorded.");
  };

  const decide = (decision: Decision) => {
    if (!draft || !selected) return;
    if (decision === "APPROVED") {
      if (!isReadyForApproval(draft)) return;
      persist({ ...draft, decision, decisionNote: "" });
      onApprove(selected.id);
      flash("Documents and office checks cleared. Property published.");
      select(null);
      return;
    }
    const note = window.prompt(
      decision === "REJECTED"
        ? "Reason for rejection (required):"
        : "What correction is needed? (required):",
    );
    if (!note?.trim()) return;
    persist({ ...draft, decision, decisionNote: note.trim() });
    onSetVerification(
      selected.id,
      decision === "REJECTED" ? "REJECTED" : "NEEDS_CORRECTION",
      note.trim(),
    );
    flash(
      decision === "REJECTED"
        ? "Submission rejected with a recorded reason."
        : "Correction requested from the seller.",
    );
    select(null);
  };

  return (
    <main className="workspace">
      <div className="container">
        <div className="eyebrow">YuTara operations</div>
        <h1 className="display">Verification desk</h1>

        {notice && <div className="admin-notice">{notice}</div>}

        {selected && draft ? (
          <section className="verify-detail">
            <button
              className="back-button"
              onClick={() => select(null)}
            >
              <ArrowLeft size={16} /> Back to queue
            </button>

            <div className="verify-detail-head">
              <div>
                <div className="eyebrow">Reviewing submission</div>
                <h2 className="display">{selected.title}</h2>
                <p className="muted">
                  {selected.barangay}, {selected.city} · Seller:{" "}
                  {selected.seller} · {selected.type || selected.propertyType}
                </p>
              </div>
              <div className="verify-progress-box">
                <span className="muted">Verification progress</span>
                <div className="verify-progress">
                  <span style={{ width: `${verificationProgress(draft)}%` }} />
                </div>
                <strong>{verificationProgress(draft)}%</strong>
              </div>
            </div>

            {selected.submittedDocuments &&
              selected.submittedDocuments.length > 0 && (
                <div className="verification-box" style={{ marginBottom: 18 }}>
                  <strong>Files provided by the seller</strong>
                  <ul style={{ margin: "8px 0 0", paddingLeft: 18 }}>
                    {selected.submittedDocuments.map((name, index) => (
                      <li key={`${name}-${index}`}>{name}</li>
                    ))}
                  </ul>
                </div>
              )}

            <div className="verify-grid">
              <div className="table-wrap verify-block">
                <div className="verify-block-head">
                  <h3>
                    <FileCheck2 size={16} /> Document review
                  </h3>
                  <div style={{ display: "grid", gap: 6, justifyItems: "end" }}>
                    <span className="muted">
                      Mark each submitted document as verified or rejected.
                    </span>
                    <button className="button button-ghost" onClick={verifyAll}>
                      <Check size={14} /> Verify all documents
                    </button>
                  </div>
                </div>
                <div className="verify-docs">
                  {draft.documents.map((document) => (
                    <div className="verify-doc" key={document.key}>
                      <div>
                        <strong>{document.name}</strong>
                        <span className="document-label">
                          {document.required ? "Required" : "Optional"}
                        </span>
                      </div>
                      <div className="verify-doc-actions">
                        <button
                          className={`button ${document.status === "VERIFIED" ? "button-primary" : "button-ghost"}`}
                          onClick={() => setDocument(document.key, "VERIFIED")}
                        >
                          <Check size={14} /> Verified
                        </button>
                        <button
                          className={`button ${document.status === "REJECTED" ? "button-danger" : "button-ghost"}`}
                          onClick={() => setDocument(document.key, "REJECTED")}
                        >
                          <X size={14} /> Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="table-wrap verify-block">
                <div className="verify-block-head">
                  <h3>
                    <Building2 size={16} /> Government verification
                  </h3>
                  <span className="muted">
                    Request and record responses from the relevant offices.
                  </span>
                </div>
                <div className="verify-offices">
                  {draft.checks.map((check) => (
                    <div className="verify-office" key={check.id}>
                      <div className="verify-office-head">
                        <div>
                          <strong>{check.office}</strong>
                          <span className="muted">{check.scope}</span>
                        </div>
                        <span
                          className={`status ${
                            check.status === "CLEARED"
                              ? "verified"
                              : check.status === "PENDING"
                                ? "review"
                                : "correction"
                          }`}
                        >
                          {check.status.replace("_", " ")}
                        </span>
                      </div>
                      <textarea
                        className="form-input form-textarea verify-response"
                        placeholder="Paste the office response or officer feedback…"
                        value={check.response}
                        onChange={(event) =>
                          patchCheck(check.id, { response: event.target.value })
                        }
                      />
                      <div className="verify-office-foot">
                        <span className="muted verify-office-meta">
                          <MessageSquare size={13} />
                          {check.checkedAt
                            ? `Response ${formatCheckDate(check.checkedAt)}`
                            : check.requestedAt
                              ? `Requested ${formatCheckDate(check.requestedAt)}`
                              : "Not yet requested"}
                        </span>
                        <div className="verify-office-actions">
                          <select
                            className="form-input verify-status-select"
                            value={check.status}
                            onChange={(event) =>
                              patchCheck(check.id, {
                                status: event.target
                                  .value as OfficeCheckStatus,
                              })
                            }
                          >
                            <option value="PENDING">Pending</option>
                            <option value="CLEARED">Cleared</option>
                            <option value="DISCREPANCY">Discrepancy</option>
                            <option value="NOT_FOUND">Not found</option>
                          </select>
                          <button
                            className="button button-ghost"
                            onClick={() => sendRequest(check.id)}
                          >
                            <Send size={14} /> Request
                          </button>
                          <button
                            className="button button-primary"
                            onClick={() => logResponse(check.id)}
                          >
                            <ClipboardCheck size={14} /> Log response
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="verify-decision">
              <div
                className={`verify-gate ${isReadyForApproval(draft) ? "ready" : ""}`}
              >
                {isReadyForApproval(draft) ? (
                  <>
                    <ShieldCheck size={18} />
                    <div>
                      <strong>Ready to publish</strong>
                      <p>
                        Required documents are verified. Approving publishes this
                        listing to the marketplace.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertTriangle size={18} />
                    <div>
                      <strong>Approval locked</strong>
                      <p>
                        {draft.documents.filter(
                          (document) =>
                            document.required &&
                            document.status !== "VERIFIED",
                        ).length}{" "}
                        required document(s) still need to be verified before this
                        listing can be published. Office checks are optional and
                        recorded for the audit trail.
                      </p>
                    </div>
                  </>
                )}
              </div>
              <div className="verify-decision-actions">
                <button
                  className="button button-danger"
                  onClick={() => decide("REJECTED")}
                >
                  <X size={15} /> Reject
                </button>
                <button
                  className="button button-ghost"
                  onClick={() => decide("NEEDS_CORRECTION")}
                >
                  <AlertTriangle size={15} /> Request correction
                </button>
                <button
                  className="button button-primary"
                  disabled={!isReadyForApproval(draft)}
                  onClick={() => decide("APPROVED")}
                >
                  <Check size={15} /> Approve &amp; publish
                </button>
              </div>
            </div>
          </section>
        ) : (
          <>
            <div className="verification-box" style={{ marginBottom: 22 }}>
              <h3>Property location</h3>
              <p style={{ margin: 0, fontSize: ".82rem" }}>
                {YUTARA_SERVICE_AREA.city} · {YUTARA_SERVICE_AREA.province}
              </p>
              <p style={{ margin: "6px 0 0", fontSize: ".82rem" }}>
                Every approved listing must be within the current YuTara service
                area and pass document and government checks.
              </p>
            </div>
            <div className="stats">
              <div className="stat">
                <span>Pending verification</span>
                <strong>{pending.length}</strong>
              </div>
              <div className="stat">
                <span>Verified properties</span>
                <strong>
                  {
                    properties.filter(
                      (item) =>
                        item.status === "PUBLISHED" ||
                        item.verificationStatus === "VERIFIED",
                    ).length
                  }
                </strong>
              </div>
              <div className="stat">
                <span>Needs correction</span>
                <strong>
                  {
                    properties.filter(
                      (item) => item.status === "NEEDS_CORRECTION",
                    ).length
                  }
                </strong>
              </div>
              <div className="stat">
                <span>Awaiting office reply</span>
                <strong>
                  {records.reduce(
                    (sum, record) =>
                      sum +
                      record.checks.filter(
                        (check) =>
                          check.requestedAt && check.status === "PENDING",
                      ).length,
                    0,
                  )}
                </strong>
              </div>
            </div>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Property</th>
                    <th>Seller</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Review</th>
                  </tr>
                </thead>
                <tbody>
                  {properties.map((item) => {
                    const isPublished =
                      item.status === "PUBLISHED" ||
                      item.verificationStatus === "VERIFIED";

                    return (
                      <tr key={item.id}>
                        <td>
                          <strong>{item.title}</strong>
                          <br />
                          <span className="muted">
                            {item.barangay}, {item.city}
                          </span>
                        </td>
                        <td>{item.seller}</td>
                        <td>{item.type || item.propertyType}</td>
                        <td>
                          <span
                            className={`status ${isPublished ? "verified" : item.status === "NEEDS_CORRECTION" ? "correction" : "review"}`}
                          >
                            {item.status.replace("_", " ")}
                          </span>
                          <br />
                          <span
                            className={`status listing-status ${getListingStatus(item).toLowerCase()}`}
                          >
                            {getListingStatus(item).replaceAll("_", " ")}
                          </span>
                        </td>
                        <td>
                          <div className="admin-actions">
                            {!isPublished && (
                              <button
                                className="button button-primary"
                                onClick={() => select(item.id)}
                              >
                                <ClipboardCheck size={14} /> Review documents
                              </button>
                            )}
                            {isPublished &&
                              getListingStatus(item) === "OPEN_FOR_OFFERS" && (
                                <>
                                  <button
                                    className="button button-ghost"
                                    onClick={() =>
                                      onSetListingStatus(item.id, "CLOSED")
                                    }
                                  >
                                    Close
                                  </button>
                                  <button
                                    className="button button-ghost"
                                    onClick={() =>
                                      window.confirm(
                                        "Mark this property as sold?",
                                      ) &&
                                      onSetListingStatus(item.id, "SOLD")
                                    }
                                  >
                                    Mark sold
                                  </button>
                                  <button
                                    className="button button-danger"
                                    onClick={() => {
                                      if (
                                        !window.confirm(
                                          "Terminate Property Listing? This removes it from active marketplace results.",
                                        )
                                      )
                                        return;
                                      const reason = window.prompt(
                                        "Termination reason (required):",
                                      );
                                      if (reason?.trim())
                                        onSetListingStatus(
                                          item.id,
                                          "TERMINATED",
                                          reason.trim(),
                                        );
                                    }}
                                  >
                                    Terminate
                                  </button>
                                </>
                              )}
                          </div>
                          {getListingStatus(item) === "TERMINATED" && (
                            <small className="muted">
                              Reason:{" "}
                              {item.terminationReason || "Recorded by admin"}
                            </small>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="verification-box" style={{ marginTop: 22 }}>
              <h3>
                <ShieldCheck
                  size={18}
                  style={{ verticalAlign: "-4px", marginRight: 6 }}
                />
                Verification policy
              </h3>
              <p style={{ margin: 0, fontSize: ".82rem" }}>
                A listing is published only after the seller&apos;s documents and
                the government office responses are reviewed and cleared.
                Promoted listings cannot bypass this review.
                <Lock
                  size={13}
                  style={{ verticalAlign: "-2px", margin: "0 4px" }}
                />
                Office responses are recorded for the audit trail.
              </p>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
