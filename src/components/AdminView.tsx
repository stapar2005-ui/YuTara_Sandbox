"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Check,
  Lock,
  ShieldCheck,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";
import {
  getListingStatus,
  ListingStatus,
  Property,
} from "@/lib/marketplace";
import { YUTARA_SERVICE_AREA } from "@/lib/yutara-config";
import { resetAllData } from "@/lib/reset";
import {
  approvePendingUser,
  denyPendingUser,
  readPendingUsers,
} from "@/lib/demo-auth";
import type { PendingUser } from "@/lib/demo-auth";

export function AdminView({
  properties,
  onSetListingStatus,
}: {
  properties: Property[];
  onSetListingStatus: (
    id: number,
    status: ListingStatus,
    reason?: string,
  ) => void;
}) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);

  const pending = properties.filter(
    (item) => item.listingStatus !== "OPEN_FOR_OFFERS",
  );

  const selected = properties.find((item) => item.id === selectedId) || null;

  const isPublished = (item: Property) =>
    getListingStatus(item) === "OPEN_FOR_OFFERS";

  useEffect(() => {
    const sync = () => setPendingUsers(readPendingUsers());
    sync();
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  return (
    <main className="workspace">
      <div className="container">
        <div className="eyebrow">YuTara operations</div>
        <h1 className="display">Listing desk</h1>

        {selected ? (
          <section className="listing-detail">
            <button
              className="back-button"
              onClick={() => setSelectedId(null)}
            >
              <ArrowLeft size={16} /> Back to queue
            </button>

            <div className="listing-detail-head">
              <div>
                <div className="eyebrow">Managing listing</div>
                <h2 className="display">{selected.title}</h2>
                <p className="muted">
                  {selected.barangay}, {selected.city} · Seller:{" "}
                  {selected.seller} · {selected.type || selected.propertyType}
                </p>
              </div>
              <div className="listing-status-box">
                <span className="muted">Listing status</span>
                <span
                  className={`status ${
                    isPublished(selected) ? "verified" : "review"
                  }`}
                >
                  {getListingStatus(selected).replaceAll("_", " ")}
                </span>
              </div>
            </div>

            <div className="listing-actions">
              {isPublished(selected) && (
                <>
                  <button
                    className="button button-ghost"
                    onClick={() => {
                      if (
                        !window.confirm(
                          "Close this listing? It will be removed from active marketplace results.",
                        )
                      )
                        return;
                      onSetListingStatus(selected.id, "CLOSED");
                    }}
                  >
                    Close listing
                  </button>
                  <button
                    className="button button-ghost"
                    onClick={() => {
                      if (
                        !window.confirm(
                          "Mark this property as sold?",
                        )
                      )
                        return;
                      onSetListingStatus(selected.id, "SOLD");
                    }}
                  >
                    Mark sold
                  </button>
                </>
              )}
              {!isPublished(selected) && (
                <button
                  className="button button-primary"
                  onClick={() =>
                    onSetListingStatus(selected.id, "OPEN_FOR_OFFERS")
                  }
                >
                  Reopen listing
                </button>
              )}
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
                    onSetListingStatus(selected.id, "TERMINATED", reason.trim());
                }}
              >
                Terminate
              </button>
              {getListingStatus(selected) === "TERMINATED" && (
                <small className="muted">
                  Reason: {selected.terminationReason || "Recorded by admin"}
                </small>
              )}
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
                Manage listing status for all properties in the current YuTara
                service area.
              </p>
            </div>
            <div className="stats">
              <div className="stat">
                <span>Total listings</span>
                <strong>{properties.length}</strong>
              </div>
              <div className="stat">
                <span>Open for offers</span>
                <strong>
                  {properties.filter(isPublished).length}
                </strong>
              </div>
              <div className="stat">
                <span>Not open</span>
                <strong>{pending.length}</strong>
              </div>
              <div className="stat">
                <span>Pending user approvals</span>
                <strong>
                  {pendingUsers.filter((u) => u.status === "PENDING").length}
                </strong>
              </div>
            </div>

            {/* User Registration Approval Section */}
            <div className="table-wrap" style={{ marginTop: 26 }}>
              <div className="section-heading">
                <div>
                  <div className="eyebrow">User registration queue</div>
                  <h2 className="display">Approve new users</h2>
                </div>
                <p className="muted">
                  Review and approve or deny new user registration applications.
                  Each applicant has submitted at least one valid ID for
                  verification.
                </p>
              </div>
              {pendingUsers.length === 0 ? (
                <div className="table-wrap empty-dashboard">
                  <UserPlus size={24} />
                  <p className="muted">
                    No pending user registrations. New applicants will appear
                    here.
                  </p>
                </div>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Applicant</th>
                      <th>Email</th>
                      <th>ID(s)</th>
                      <th>Submitted</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingUsers.map((user) => (
                      <tr key={user.id}>
                        <td>
                          <strong>{user.name}</strong>
                        </td>
                        <td>
                          <span className="muted">{user.email}</span>
                        </td>
                        <td>
                          <span className="badge badge-status">
                            {user.id2 ? "2 IDs" : "1 ID"}
                          </span>
                        </td>
                        <td className="muted">
                          {new Date(user.createdAt).toLocaleDateString(
                            "en-PH",
                            { month: "short", day: "numeric" },
                          )}
                        </td>
                        <td>
                          <span
                            className={`status ${
                              user.status === "PENDING"
                                ? "review"
                                : user.status === "APPROVED"
                                  ? "verified"
                                  : "correction"
                            }`}
                          >
                            {user.status}
                          </span>
                        </td>
                        <td>
                          {user.status === "PENDING" ? (
                            <div style={{ display: "flex", gap: 6 }}>
                              <button
                                className="button button-primary"
                                onClick={() => {
                                  approvePendingUser(user.id, "admin");
                                  setPendingUsers(readPendingUsers());
                                }}
                              >
                                <Check size={14} /> Approve
                              </button>
                              <button
                                className="button button-danger"
                                onClick={() => {
                                  denyPendingUser(user.id, "admin");
                                  setPendingUsers(readPendingUsers());
                                }}
                              >
                                <X size={14} /> Deny
                              </button>
                            </div>
                          ) : (
                            <span className="muted">
                              {user.status === "APPROVED"
                                ? "Approved"
                                : "Denied"}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="table-wrap" style={{ marginTop: 22 }}>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginBottom: 12 }}>
                <button
                  className="button button-danger"
                  onClick={async () => {
                    if (
                      !window.confirm(
                        "Reset all data? This clears every listing, reservation, transaction, pending user, and session. This cannot be undone.",
                      )
                    )
                      return;
                    await resetAllData();
                    window.location.reload();
                  }}
                >
                  <Trash2 size={15} /> Reset All Data
                </button>
              </div>
              <table className="table">
                <thead>
                  <tr>
                    <th>Property</th>
                    <th>Seller</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {properties.map((item) => {
                    const published = isPublished(item);
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
                            className={`status ${
                              published ? "verified" : "review"
                            }`}
                          >
                            {getListingStatus(item).replaceAll("_", " ")}
                          </span>
                        </td>
                        <td>
                          <div className="admin-actions">
                            {published ? (
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
                                  onClick={() => {
                                    if (
                                      !window.confirm(
                                        "Mark this property as sold?",
                                      )
                                    )
                                      return;
                                    onSetListingStatus(item.id, "SOLD");
                                  }}
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
                            ) : (
                              <button
                                className="button button-primary"
                                onClick={() =>
                                  onSetListingStatus(
                                    item.id,
                                    "OPEN_FOR_OFFERS",
                                  )
                                }
                              >
                                Reopen
                              </button>
                            )}
                            {getListingStatus(item) === "TERMINATED" && (
                              <small className="muted">
                                Reason:{" "}
                                {item.terminationReason || "Recorded by admin"}
                              </small>
                            )}
                          </div>
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
                Listing policy
              </h3>
              <p style={{ margin: 0, fontSize: ".82rem" }}>
                Listings are published directly to the marketplace. The partner
                agency coordinates escrow, documents, and the transfer from
                listing to closing. YuTara does not perform government
                verification or title review.
                <Lock
                  size={13}
                  style={{ verticalAlign: "-2px", margin: "0 4px" }}
                />
              </p>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
