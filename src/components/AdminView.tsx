"use client";

import { Fragment, useEffect, useState } from "react";
import {
  ArrowLeft,
  Check,
  FileText,
  Image,
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
import { Modal } from "@/components/Modal";
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
  const [inspectingUser, setInspectingUser] = useState<PendingUser | null>(null);
  const [denyModalOpen, setDenyModalOpen] = useState(false);
  const [denyReason, setDenyReason] = useState("");

  const pending = properties.filter(
    (item) => item.listingStatus !== "OPEN_FOR_OFFERS",
  );
  const listingsByCategory = properties.reduce<Record<string, Property[]>>(
    (groups, item) => {
      const category = (item.type || item.propertyType || "Other").trim() || "Other";
      (groups[category] ??= []).push(item);
      return groups;
    },
    {},
  );
  const sortedListingGroups = Object.entries(listingsByCategory)
    .sort(([categoryA], [categoryB]) => categoryA.localeCompare(categoryB, undefined, { sensitivity: "base" }))
    .map(([category, items]) => ({
      category,
      items: [...items].sort((itemA, itemB) => itemA.title.localeCompare(itemB.title, undefined, { sensitivity: "base" })),
    }));

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
    <div className="workspace">
      <div className="container">
        <div className="eyebrow">Admin workspace · owner support</div>
        <h1 className="display">Land listings</h1>

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
                Find a listing by category and property name, then review its
                owner and status to help with listing concerns.
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

            <div id="land-listings" className="table-wrap admin-land-listings" style={{ marginTop: 22, scrollMarginTop: 96 }}>
              <div className="section-heading admin-land-listings-heading">
                <div>
                  <div className="eyebrow">Owner support</div>
                  <h2 className="display">All land listings</h2>
                </div>
                <p className="muted">Categories and property names are listed alphabetically.</p>
              </div>
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
                    <th>Owner / contact</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedListingGroups.map(({ category, items }) => (
                    <Fragment key={category}>
                      <tr className="admin-listing-category-row">
                        <th colSpan={5} scope="rowgroup">
                          <span>{category}</span>
                          <span className="muted">{items.length} {items.length === 1 ? "listing" : "listings"}</span>
                        </th>
                      </tr>
                      {items.map((item) => {
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
                        <td>
                          <strong>{item.seller}</strong>
                          {item.sellerEmail && (
                            <>
                              <br />
                              <a className="admin-owner-email" href={`mailto:${item.sellerEmail}`}>
                                {item.sellerEmail}
                              </a>
                            </>
                          )}
                        </td>
                        <td>{category}</td>
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
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
            {/* User Registration Approval Section */}
            <div
              id="user-registrations"
              className="table-wrap"
              style={{ marginTop: 26, scrollMarginTop: 90 }}
            >
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
                                  setInspectingUser(user);
                                }}
                              >
                                <FileText size={14} /> Inspect
                              </button>
                              <button
                                className="button button-danger"
                                onClick={() => {
                                  setDenyModalOpen(true);
                                  setDenyReason("");
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
        {inspectingUser && (
          <Modal title="Applicant Inspection" onClose={() => setInspectingUser(null)}>
            <div className="container">
              <div className="section-heading">
                <div>
                  <div className="eyebrow">Applicant Details</div>
                  <h2 className="display">{inspectingUser.name}</h2>
                </div>
              </div>
              <div className="table-wrap">
                <table className="table">
                  <tbody>
                    <tr>
                      <td><strong>Email</strong></td>
                      <td>{inspectingUser.email}</td>
                    </tr>
                    <tr>
                      <td><strong>Mobile</strong></td>
                      <td>{inspectingUser.mobile || "Not provided"}</td>
                    </tr>
                    <tr>
                      <td><strong>Submitted</strong></td>
                      <td>{new Date(inspectingUser.createdAt).toLocaleDateString("en-PH")}</td>
                    </tr>
                    <tr>
                      <td><strong>ID Documents</strong></td>
                      <td>
                        {inspectingUser.id2 ? "2 IDs submitted" : "1 ID submitted"}
                        <br />
                        <span className="muted">
                          {inspectingUser.id1Url ? (
                            <>
                              <Image size={14} /> ID #1: <a href={inspectingUser.id1Url} target="_blank" rel="noreferrer">View file</a>
                            </>
                          ) : (
                            "ID #1 not available"
                          )}
                          {inspectingUser.id2Url ? (
                            <>
                              <br />
                              <Image size={14} /> ID #2: <a href={inspectingUser.id2Url} target="_blank" rel="noreferrer">View file</a>
                            </>
                          ) : null}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td><strong>Face Verification</strong></td>
                      <td>
                        {inspectingUser.faceScanUrl ? (
                          <>
                            <Image size={14} /> Face scan available: <a href={inspectingUser.faceScanUrl} target="_blank" rel="noreferrer">View selfie</a>
                          </>
                        ) : (
                          "No face scan on file"
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="modal-foot" style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button className="button button-ghost" onClick={() => {
                  approvePendingUser(inspectingUser.id, "admin");
                  setPendingUsers(readPendingUsers());
                  setInspectingUser(null);
                }}>
                  <Check size={14} /> Approve Application
                </button>
                <button className="button button-danger" onClick={() => {
                  setInspectingUser(null);
                  setDenyModalOpen(true);
                  setDenyReason("");
                }}>
                  <X size={14} /> Reject with Reason
                </button>
              </div>
            </div>
          </Modal>
        )}
        {denyModalOpen && (
          <Modal title="Deny Application" onClose={() => setDenyModalOpen(false)}>
            <div className="container">
              <div className="section-heading">
                <div>
                  <div className="eyebrow">Denial Reason</div>
                  <h2 className="display">Reject Application</h2>
                </div>
              </div>
              <p className="muted">
                Please provide a reason for denying this application. The
                applicant will be notified.
              </p>
              <div className="form-grid">
                <label style={{ gridColumn: "1 / -1" }}>
                  Reason for denial
                  <textarea
                    className="form-input form-textarea"
                    value={denyReason}
                    onChange={(e) => setDenyReason(e.target.value)}
                    placeholder="e.g. Invalid ID document, incomplete information..."
                  />
                </label>
              </div>
              <div className="modal-foot" style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button className="button button-ghost" onClick={() => setDenyModalOpen(false)}>
                  Cancel
                </button>
                <button className="button button-danger" onClick={() => {
                  if (!denyReason.trim()) return;
                  denyPendingUser(inspectingUser?.id ?? "", "admin", denyReason);
                  setPendingUsers(readPendingUsers());
                  setDenyModalOpen(false);
                  setDenyReason("");
                }}>
                  <X size={14} /> Confirm Denial
                </button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
}
