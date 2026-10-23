"use client";

import { useState } from "react";
import { FileCheck2 } from "lucide-react";
import { Modal } from "./Modal";
import { readTransactions } from "@/lib/transactions";
import type { Property } from "@/lib/marketplace";

export function DocumentVault({
  property,
  reservationId,
}: {
  property: Property;
  reservationId: string;
}) {
  const [open, setOpen] = useState(false);
  const transaction =
    readTransactions().find((tx) => tx.reservationId === reservationId) ?? null;
  const verificationDocs = property.submittedDocuments ?? [];
  const buyerDocs = transaction?.documents ?? [];
  const count = verificationDocs.length + buyerDocs.length;

  return (
    <>
      <button
        type="button"
        className="asset-documents vault-button"
        onClick={() => setOpen(true)}
      >
        <strong>
          <FileCheck2 size={15} /> Document Vault
        </strong>
        <span>
          {count > 0 ? `${count} document(s)` : "No documents yet"} · view
        </span>
      </button>
      {open && (
        <Modal title="Document Vault" onClose={() => setOpen(false)}>
          <div className="verify-docs">
            <h4>Verification documents (seller)</h4>
            {verificationDocs.length ? (
              <ul>
                {verificationDocs.map((name, index) => (
                  <li key={`${name}-${index}`}>{name}</li>
                ))}
              </ul>
            ) : (
              <p className="muted">
                No seller verification documents are on file for this listing.
              </p>
            )}
            <h4>Your submitted documents</h4>
            {buyerDocs.length ? (
              <ul>
                {buyerDocs.map((name, index) => (
                  <li key={`${name}-${index}`}>{name}</li>
                ))}
              </ul>
            ) : (
              <p className="muted">
                You have not submitted documents for this reservation yet.
              </p>
            )}
          </div>
          <p className="muted" style={{ marginTop: 12 }}>
            Documents are visible only to the authenticated buyer and YuTara
            reviewers.
          </p>
        </Modal>
      )}
    </>
  );
}
