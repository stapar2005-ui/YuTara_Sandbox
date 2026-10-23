"use client";

import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { formatMoney } from "@/lib/marketplace";
import {
  formatTimestamp,
  readTransactions,
  TRANSACTIONS_EVENT,
  verifyTransaction,
  Transaction,
} from "@/lib/transactions";

export function AdminTransactionVerifications() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

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

  const pending = transactions.filter(
    (tx) => tx.stage === "DOCUMENTS_SUBMITTED",
  );

  if (!pending.length) {
    return (
      <p className="muted">
        No bookings are currently awaiting document verification.
      </p>
    );
  }

  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Transaction</th>
            <th>Buyer / Property</th>
            <th>Documents</th>
            <th>Submitted</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {pending.map((tx) => (
            <tr key={tx.id}>
              <td>
                <code className="tx-ref">{tx.id}</code>
                <br />
                <span className="muted">{formatMoney(tx.salePrice)}</span>
              </td>
              <td>
                <strong>{tx.buyerName}</strong>
                <br />
                <span className="muted">{tx.propertyTitle}</span>
              </td>
              <td>
                {tx.documents.length ? (
                  <ul style={{ margin: 0, paddingLeft: 16 }}>
                    {tx.documents.map((doc, index) => (
                      <li key={`${doc}-${index}`}>{doc}</li>
                    ))}
                  </ul>
                ) : (
                  <span className="muted">—</span>
                )}
              </td>
              <td>{formatTimestamp(tx.updatedAt)}</td>
              <td>
                <button
                  className="button button-primary"
                  onClick={() => verifyTransaction(tx.id, "YUTARA")}
                >
                  <ShieldCheck size={15} /> Verify documents
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
