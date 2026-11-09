"use client";

import { useEffect, useState } from "react";
import { FileCheck2 } from "lucide-react";
import { Modal } from "./Modal";
import { readTransactions, Transaction } from "@/lib/transactions";
import type { Property } from "@/lib/marketplace";

export function DocumentVault({
  _property,
  reservationId,
}: {
  _property: Property;
  reservationId: string;
}) {
  const [open, setOpen] = useState(false);
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  void _property;

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      const txs = await readTransactions();
      setTransaction(txs.find((tx) => tx.reservationId === reservationId) ?? null);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [reservationId, open]);

  const docs = transaction?.documentsPrepared ?? [];
  const count = docs.length;

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
            <h4>Agency-prepared documents</h4>
            {docs.length ? (
              <ul>
                {docs.map((name, index) => (
                  <li key={`${name}-${index}`}>{name}</li>
                ))}
              </ul>
            ) : (
              <p className="muted">
                No agency-prepared documents are on file for this transaction
                yet.
              </p>
            )}
          </div>
          <p className="muted" style={{ marginTop: 12 }}>
            Documents are managed by the partner agency and visible to both
            parties once prepared.
          </p>
        </Modal>
      )}
    </>
  );
}
