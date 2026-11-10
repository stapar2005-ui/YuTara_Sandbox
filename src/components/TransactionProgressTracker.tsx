"use client";

import { useEffect, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Clock,
  FileText,
  Lock,
  Users,
  ShieldCheck,
  MapPin,
} from "lucide-react";
import { formatMoney } from "@/lib/marketplace";
import {
  TransactionStage,
  STAGE_LABEL,
  STAGE_COLOR,
  STAGE_ORDER,
  stageIndex,
  readProcessingStages,
  readStageHistory,
  ProcessingStage,
  StageHistoryEntry,
} from "@/lib/transaction-stage-service";
import { readDocumentRequirements } from "@/lib/document-service";

export function TransactionProgressTracker({
  transactionId,
  buyerEmail,
  sellerEmail,
  userEmail,
  userRole,
}: {
  transactionId: string;
  buyerEmail: string;
  sellerEmail: string;
  userEmail: string;
  userRole: string;
}) {
  const [stages, setStages] = useState<ProcessingStage[]>([]);
  const [history, setHistory] = useState<StageHistoryEntry[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [currentStage, setCurrentStage] = useState<TransactionStage | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [stgs, hist, docs] = await Promise.all([
        readProcessingStages(transactionId),
        readStageHistory(transactionId),
        readDocumentRequirements(transactionId),
      ]);
      setStages(stgs);
      setHistory(hist);
      setDocuments(docs);

      // Determine current stage - the last IN_PROGRESS or the furthest along
      const inProgress = stgs.find((s) => s.status === "IN_PROGRESS");
      if (inProgress) {
        setCurrentStage(inProgress.stage);
      } else {
        const completed = stgs.filter((s) => s.status === "COMPLETED");
        if (completed.length > 0) {
          const last = completed.sort(
            (a, b) =>
              new Date(b.completedAt || b.updatedAt).getTime() -
              new Date(a.completedAt || a.updatedAt).getTime(),
          )[0];
          setCurrentStage(last.stage);
        } else if (stgs.length > 0) {
          setCurrentStage(stgs[0].stage);
        }
      }
      setLoading(false);
    };
    load();
  }, [transactionId]);

  const canViewPrivateBuyerDocs =
    userEmail === buyerEmail ||
    userRole.startsWith("AGENCY") ||
    userRole === "ADMIN";
  const canViewPrivateSellerDocs =
    userEmail === sellerEmail ||
    userRole.startsWith("AGENCY") ||
    userRole === "ADMIN";

  const currentIndex =
    currentStage !== null ? stageIndex(currentStage) : -1;
  const totalStages = STAGE_ORDER.length;

  if (loading) {
    return (
      <div className="table-wrap empty-dashboard">
        <Clock size={24} />
        <p className="muted">Loading transaction progress…</p>
      </div>
    );
  }

  const buyerDocs = documents.filter(
    (d: any) => d.responsibleParty === "BUYER",
  );
  const sellerDocs = documents.filter(
    (d: any) => d.responsibleParty === "SELLER",
  );
  const agencyDocs = documents.filter(
    (d: any) => d.responsibleParty === "AGENCY",
  );

  return (
    <div className="transaction-tracker">
      <div className="tracker-header">
        <h2 className="display">Transaction Progress</h2>
        <p className="muted">
          Track the land ownership transfer process from agreement to completion.
        </p>
      </div>

      {/* Progress Timeline */}
      <div className="tracker-timeline">
        <div className="timeline-track"></div>
        {STAGE_ORDER.map((stage, index) => {
          const done = index < currentIndex;
          const active = index === currentIndex;
          const stageData = stages.find((s) => s.stage === stage);
          return (
            <div key={stage} className="timeline-step">
              <div className={`timeline-dot ${done ? "done" : ""} ${active ? "active" : ""}`}>
                {done ? (
                  <BadgeCheck size={14} />
                ) : active ? (
                  <Clock size={14} />
                ) : null}
              </div>
              <div className="timeline-label">
                <strong>{STAGE_LABEL[stage]}</strong>
                {stageData && (
                  <p className="muted" style={{ fontSize: ".75rem", marginTop: 2 }}>
                    {stageData.status === "COMPLETED"
                      ? "Completed"
                      : stageData.status === "IN_PROGRESS"
                        ? "In progress"
                        : stageData.status === "ON_HOLD"
                          ? "On hold"
                          : "Pending"}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Current Stage Details */}
      {currentStage && (
        <div className="tracker-current-stage">
          <h3>Current Stage: {STAGE_LABEL[currentStage]}</h3>
          <p className="muted">
            {STAGE_ORDER.length > 0
              ? `Stage ${currentIndex + 1} of ${totalStages}`
              : ""}
          </p>
          {stages.length > 0 && (
            <div className="stage-details">
              {stages.map((s) => {
                if (s.stage !== currentStage) return null;
                return (
                  <div key={s.id} className="stage-card">
                    <div className="stage-info">
                      <span className="stage-status" style={{ backgroundColor: STAGE_COLOR[s.stage] || "#166534" }}>
                        {s.status.replaceAll("_", " ")}
                      </span>
                      {s.nextAction && (
                        <p className="muted" style={{ marginTop: 4 }}>
                          <strong>Next action:</strong> {s.nextAction}
                        </p>
                      )}
                      {s.deadline && (
                        <p className="muted" style={{ marginTop: 4 }}>
                          <strong>Deadline:</strong>{" "}
                          {new Date(s.deadline).toLocaleDateString()}
                        </p>
                      )}
                      {s.assignedTo && (
                        <p className="muted" style={{ marginTop: 4 }}>
                          <strong>Assigned to:</strong> {s.assignedTo} (
                          {s.assignedRole})
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Documents Section */}
      <div className="tracker-documents">
        <h3>Documents</h3>

        {buyerDocs.length > 0 && canViewPrivateBuyerDocs && (
          <div className="doc-category">
            <h4>Buyer Documents</h4>
            <div className="doc-list">
              {buyerDocs.map((doc: any) => (
                <div
                  key={doc.id}
                  className={`doc-item ${doc.status === "ACCEPTED" ? "accepted" : ""} ${doc.status === "REJECTED" ? "rejected" : ""} ${doc.status === "PENDING_SUBMISSION" || doc.status === "NOT_REQUESTED" ? "pending" : ""}`}
                >
                  <div className="doc-info">
                    <strong>{doc.requirementName}</strong>
                    <br />
                    <span className="muted" style={{ fontSize: ".8rem" }}>
                      {doc.description}
                    </span>
                  </div>
                  <span
                    className="doc-status"
                    style={{
                      backgroundColor:
                        doc.status === "ACCEPTED"
                          ? "#dcfce7"
                          : doc.status === "REJECTED"
                            ? "#fee2e2"
                            : doc.status === "SUBMITTED" ||
                              doc.status === "UNDER_REVIEW"
                              ? "#fef3c7"
                              : "#e5e7eb",
                      color:
                        doc.status === "ACCEPTED"
                          ? "#166534"
                          : doc.status === "REJECTED"
                            ? "#b91c1c"
                            : "#374151",
                    }}
                  >
                    {doc.status.replaceAll("_", " ")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {sellerDocs.length > 0 && canViewPrivateSellerDocs && (
          <div className="doc-category">
            <h4>Seller Documents</h4>
            <div className="doc-list">
              {sellerDocs.map((doc: any) => (
                <div
                  key={doc.id}
                  className={`doc-item ${doc.status === "ACCEPTED" ? "accepted" : ""} ${doc.status === "REJECTED" ? "rejected" : ""} ${doc.status === "PENDING_SUBMISSION" || doc.status === "NOT_REQUESTED" ? "pending" : ""}`}
                >
                  <div className="doc-info">
                    <strong>{doc.requirementName}</strong>
                    <br />
                    <span className="muted" style={{ fontSize: ".8rem" }}>
                      {doc.description}
                    </span>
                  </div>
                  <span
                    className="doc-status"
                    style={{
                      backgroundColor:
                        doc.status === "ACCEPTED"
                          ? "#dcfce7"
                          : doc.status === "REJECTED"
                            ? "#fee2e2"
                            : doc.status === "SUBMITTED" ||
                              doc.status === "UNDER_REVIEW"
                              ? "#fef3c7"
                              : "#e5e7eb",
                      color:
                        doc.status === "ACCEPTED"
                          ? "#166534"
                          : doc.status === "REJECTED"
                            ? "#b91c1c"
                            : "#374151",
                    }}
                  >
                    {doc.status.replaceAll("_", " ")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {!canViewPrivateBuyerDocs && buyerDocs.length > 0 && (
          <div className="doc-category">
            <h4>Buyer Documents</h4>
            <p className="muted">
              These documents are private and not visible to you.
            </p>
          </div>
        )}
        {!canViewPrivateSellerDocs && sellerDocs.length > 0 && (
          <div className="doc-category">
            <h4>Seller Documents</h4>
            <p className="muted">
              These documents are private and not visible to you.
            </p>
          </div>
        )}

        {documents.length === 0 && (
          <p className="muted">No documents have been requested yet.</p>
        )}
      </div>

      {/* Stage History */}
      {history.length > 0 && (
        <div className="tracker-history">
          <h3>Processing History</h3>
          <div className="history-list">
            {history.map((entry: StageHistoryEntry) => (
              <div key={entry.id} className="history-item">
                <div className="history-header">
                  <span
                    className="history-stage"
                    style={{ backgroundColor: STAGE_COLOR[entry.stage] || "#166534" }}
                  >
                    {STAGE_LABEL[entry.stage]}
                  </span>
                  <span className="history-time">
                    {new Date(entry.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="muted" style={{ margin: "4px 0 0", fontSize: ".85rem" }}>
                  {entry.note}
                </p>
                <div className="history-actor">
                  {entry.changedBy} ({entry.changedByRole})
                  {entry.previousStage &&
                    ` → moved from ${STAGE_LABEL[entry.previousStage]}`}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
