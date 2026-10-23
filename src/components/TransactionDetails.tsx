"use client";

import {
  Banknote,
  Check,
  CircleCheckBig,
  Clock,
  FileText,
  Lock,
  Receipt,
  Undo2,
} from "lucide-react";
import { formatMoney } from "@/lib/marketplace";
import {
  formatTimestamp,
  STAGE_LABEL,
  STAGE_ORDER,
  stageIndex,
  Transaction,
} from "@/lib/transactions";

export function TransactionProgress({ transaction }: { transaction: Transaction }) {
  const current = stageIndex(transaction.stage);
  const cancelled = transaction.stage === "CANCELLED";

  return (
    <div className="tx-progress">
      {STAGE_ORDER.map((stage, index) => {
        const done = !cancelled && index < current;
        const active = !cancelled && index === current;
        return (
          <div
            key={stage}
            className={`tx-step ${done ? "done" : ""} ${active ? "active" : ""}`}
          >
            <span className="tx-step-dot">
              {done ? <Check size={12} /> : active ? <Clock size={12} /> : null}
            </span>
            <span className="tx-step-label">{STAGE_LABEL[stage]}</span>
          </div>
        );
      })}
      {cancelled && (
        <div className="tx-step cancelled">
          <span className="tx-step-dot">
            <Undo2 size={12} />
          </span>
          <span className="tx-step-label">{STAGE_LABEL.CANCELLED}</span>
        </div>
      )}
    </div>
  );
}

export function TransactionRecords({ transaction }: { transaction: Transaction }) {
  return (
    <div className="tx-records">
      <div className="tx-section">
        <h4>
          <Receipt size={15} /> Payment records
        </h4>
        <div className="table-wrap tx-table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Reference</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {transaction.payments.map((payment) => (
                <tr key={payment.id}>
                  <td>
                    <strong>{payment.label}</strong>
                  </td>
                  <td>{formatMoney(payment.amount)}</td>
                  <td>{payment.method}</td>
                  <td>
                    <code className="tx-ref">{payment.reference}</code>
                  </td>
                  <td>
                    <span
                      className={`status ${payment.status === "PAID" ? "verified" : payment.status === "RELEASED" ? "open_for_offers" : "review"}`}
                    >
                      {payment.status}
                    </span>
                  </td>
                  <td>{formatTimestamp(payment.paidAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="tx-section">
        <h4>
          <FileText size={15} /> Transaction history
        </h4>
        <ul className="tx-events">
          {transaction.events
            .slice()
            .reverse()
            .map((item) => (
              <li key={item.id}>
                <span className={`tx-actor ${item.actor.toLowerCase()}`}>
                  {item.actor}
                </span>
                <div>
                  <strong>{item.title}</strong>
                  {item.detail && <p>{item.detail}</p>}
                  <small>{formatTimestamp(item.at)}</small>
                </div>
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
}

export function TransactionFacts({ transaction }: { transaction: Transaction }) {
  const balancePaid =
    transaction.escrowHeld >= transaction.salePrice ||
    transaction.stage === "COMPLETED";
  return (
    <div className="tx-facts">
      <div className="tx-fact">
        <span>Transaction ID</span>
        <strong>{transaction.id}</strong>
      </div>
      <div className="tx-fact">
        <span>Sale price</span>
        <strong>{formatMoney(transaction.salePrice)}</strong>
      </div>
      <div className="tx-fact">
        <span>Reservation fee</span>
        <strong>{formatMoney(transaction.reservationFee)}</strong>
      </div>
      <div className="tx-fact">
        <span>Remaining balance</span>
        <strong>
          {formatMoney(balancePaid ? 0 : transaction.balance)}
        </strong>
      </div>
      <div className="tx-fact">
        <span>
          <Lock size={12} /> Held in escrow
        </span>
        <strong>{formatMoney(transaction.escrowHeld)}</strong>
      </div>
      <div className="tx-fact">
        <span>
          <CircleCheckBig size={12} /> Current stage
        </span>
        <strong className="tx-stage-value">
          {STAGE_LABEL[transaction.stage]}
        </strong>
      </div>
      <div className="tx-fact">
        <span>
          <Banknote size={12} /> Buyer
        </span>
        <strong>{transaction.buyerName}</strong>
      </div>
      <div className="tx-fact">
        <span>
          <Banknote size={12} /> Seller
        </span>
        <strong>{transaction.sellerName}</strong>
      </div>
    </div>
  );
}
