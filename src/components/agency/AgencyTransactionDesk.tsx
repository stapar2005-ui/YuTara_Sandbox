"use client";

import { useEffect, useState } from "react";
import { formatMoney } from "@/lib/marketplace";
import {
  readTransactions,
  TRANSACTIONS_EVENT,
  Transaction,
} from "@/lib/transactions";

export function AgencyTransactionDesk() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

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
    (tx) =>
      tx.stage !== "COMPLETED" && tx.stage !== "CANCELLED",
  );

  if (!agency.length) {
    return (
      <p className="muted">
        No transactions currently being handled by the agency.
      </p>
    );
  }

  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Transaction</th>
            <th>Buyer / Seller</th>
            <th>Property</th>
            <th>Stage</th>
            <th>Sale price</th>
            <th>Agency fee</th>
          </tr>
        </thead>
        <tbody>
          {agency.map((tx) => (
            <tr key={tx.id}>
              <td>
                <code className="tx-ref">{tx.id}</code>
              </td>
              <td>
                <strong>{tx.buyerName}</strong>
                <br />
                <span className="muted">{tx.sellerName}</span>
              </td>
              <td>
                <strong>{tx.propertyTitle}</strong>
                <br />
                <span className="muted">{tx.barangay}, {tx.city}</span>
              </td>
              <td>
                <span className="badge badge-status">{tx.stage.replaceAll("_", " ")}</span>
              </td>
              <td>{formatMoney(tx.salePrice)}</td>
              <td>{formatMoney(tx.agencyFee)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
