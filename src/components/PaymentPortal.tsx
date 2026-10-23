"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Building2,
  Check,
  CircleCheckBig,
  Copy,
  CreditCard,
  Loader2,
  Lock,
  Receipt,
  ShieldCheck,
  Smartphone,
  Wallet,
} from "lucide-react";
import { formatMoney, Property } from "@/lib/marketplace";
import {
  confirmSimulatedPayment,
  Reservation,
  RESERVATION_FEE,
} from "@/lib/reservation-service";

type PayMethod = "gcash" | "maya" | "bank" | "card";
type Stage = "form" | "processing" | "done";

const METHODS: {
  id: PayMethod;
  label: string;
  hint: string;
  brand: string;
}[] = [
  { id: "gcash", label: "GCash", hint: "E-wallet · instant", brand: "#007dfe" },
  { id: "maya", label: "Maya", hint: "E-wallet · instant", brand: "#5fbf4d" },
  { id: "bank", label: "Bank Transfer", hint: "Online banking", brand: "#b8862f" },
  { id: "card", label: "Credit / Debit Card", hint: "Visa · Mastercard", brand: "#123d32" },
];

const BANKS = [
  "BDO Unibank",
  "BPI",
  "Metrobank",
  "Landbank",
  "UnionBank",
  "Security Bank",
];

const PROCESSING_STEPS = [
  "Establishing secure connection",
  "Contacting payment provider",
  "Authorizing transaction",
  "Confirming reservation",
];

function methodIcon(id: PayMethod, size = 18) {
  if (id === "bank") return <Building2 size={size} />;
  if (id === "card") return <CreditCard size={size} />;
  return <Smartphone size={size} />;
}

function formatMobile(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 4) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 4)} ${digits.slice(4)}`;
  return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
}

function formatCard(value: string) {
  return value
    .replace(/\D/g, "")
    .slice(0, 16)
    .replace(/(.{4})/g, "$1 ")
    .trim();
}

function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function cardBrand(number: string) {
  const digits = number.replace(/\D/g, "");
  if (/^4/.test(digits)) return "Visa";
  if (/^5[1-5]/.test(digits) || /^2[2-7]/.test(digits)) return "Mastercard";
  if (/^3[47]/.test(digits)) return "Amex";
  if (/^6/.test(digits)) return "Discover";
  return "Card";
}

export function PaymentPortal({
  property,
  reservation,
  buyerName,
  buyerEmail,
  onConfirmed,
}: {
  property: Property;
  reservation: Reservation;
  buyerName: string;
  buyerEmail: string;
  onConfirmed?: (reservation: Reservation) => void;
}) {
  const [method, setMethod] = useState<PayMethod>("gcash");
  const [stage, setStage] = useState<Stage>("form");
  const [stepIndex, setStepIndex] = useState(0);
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState<Reservation | null>(null);
  const [copied, setCopied] = useState(false);

  const [mobile, setMobile] = useState("");
  const [bank, setBank] = useState(BANKS[0]);
  const [bankRef, setBankRef] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState(buyerName);
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");

  const methodMeta = METHODS.find((item) => item.id === method)!;

  function validate(): string {
    if (method === "gcash" || method === "maya") {
      const digits = mobile.replace(/\D/g, "");
      if (digits.length !== 11 || !digits.startsWith("09"))
        return "Enter a valid 11-digit mobile number starting with 09.";
    }
    if (method === "bank") {
      if (!bank) return "Please select your bank.";
    }
    if (method === "card") {
      const digits = cardNumber.replace(/\D/g, "");
      if (digits.length < 15) return "Enter a valid card number.";
      if (!cardName.trim()) return "Enter the cardholder name.";
      const [mm, yy] = cardExpiry.split("/");
      if (!mm || !yy || Number(mm) < 1 || Number(mm) > 12 || yy.length < 2)
        return "Enter a valid expiry date (MM/YY).";
      if (cardCvc.replace(/\D/g, "").length < 3)
        return "Enter a valid CVC.";
    }
    return "";
  }

  function methodLabel(): string {
    if (method === "gcash") return `GCash · ${mobile}`;
    if (method === "maya") return `Maya · ${mobile}`;
    if (method === "bank") return `Bank Transfer · ${bank}`;
    return `${cardBrand(cardNumber)} · **** ${cardNumber.replace(/\D/g, "").slice(-4)}`;
  }

  function pay() {
    const validation = validate();
    if (validation) {
      setError(validation);
      return;
    }
    setError("");
    setStage("processing");
    setStepIndex(0);

    PROCESSING_STEPS.forEach((_, index) => {
      window.setTimeout(() => setStepIndex(index), index * 420);
    });

    window.setTimeout(() => {
      const updated = confirmSimulatedPayment(reservation.id, methodLabel());
      if (!updated) {
        setStage("form");
        setError("Payment could not be completed. Please start a new reservation.");
        return;
      }
      setReceipt(updated);
      setStage("done");
      onConfirmed?.(updated);
    }, PROCESSING_STEPS.length * 420 + 260);
  }

  function copyReference() {
    if (!receipt?.paymentId) return;
    try {
      navigator.clipboard.writeText(receipt.paymentId);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }

  if (stage === "done" && receipt) {
    return (
      <section className="pay-receipt">
        <div className="pay-receipt-head">
          <span className="pay-success-icon">
            <CircleCheckBig size={30} />
          </span>
          <div>
            <div className="eyebrow">Payment successful</div>
            <h2 className="display">Reservation confirmed</h2>
            <p className="muted">
              A receipt has been generated for your reservation.
            </p>
          </div>
        </div>

        <div className="pay-receipt-body">
          <div className="pay-receipt-ref">
            <div>
              <span className="muted">Reference number</span>
              <strong>{receipt.paymentId}</strong>
            </div>
            <button className="button button-ghost" onClick={copyReference}>
              {copied ? <Check size={15} /> : <Copy size={15} />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>

          <div className="review-panel">
            <div className="review-row">
              <span>Property</span>
              <strong>{property.title}</strong>
            </div>
            <div className="review-row">
              <span>Location</span>
              <strong>
                {property.barangay}, {property.city}
              </strong>
            </div>
            <div className="review-row">
              <span>Paid by</span>
              <strong>{receipt.paymentMethod}</strong>
            </div>
            <div className="review-row">
              <span>Buyer</span>
              <strong>
                {buyerName}
                <span className="pay-buyer-email">{buyerEmail}</span>
              </strong>
            </div>
            <div className="review-row">
              <span>Amount paid</span>
              <strong>{formatMoney(receipt.reservationFee)}</strong>
            </div>
            <div className="review-row">
              <span>Status</span>
              <strong className="pay-status-ok">RESERVED</strong>
            </div>
          </div>

          <div className="pay-disclaimer">
            <ShieldCheck size={15} />
            <span>
              Your reservation payment is held securely until the ownership
              transfer is complete.
            </span>
          </div>
        </div>

        <div className="pay-receipt-actions">
          <Link className="button button-primary" href="/dashboard">
            View my assets
          </Link>
          <Link className="button button-ghost" href="/marketplace">
            Back to marketplace
          </Link>
        </div>
      </section>
    );
  }

  return (
    <div className="pay-shell">
      <section className="pay-summary">
        <div className="pay-summary-head">
          <div className="eyebrow">Order summary</div>
          <h2>{property.title}</h2>
        </div>
        <div
          className="pay-summary-image"
          style={{
            backgroundImage: `url(${property.image})`,
            backgroundPosition: property.imagePosition || "center",
          }}
        />
        <p className="property-location">
          {property.barangay}, {property.city} ·{" "}
          {property.area.toLocaleString()} sqm
        </p>
        <div className="review-row">
          <span>Listing price</span>
          <strong>{formatMoney(property.price)}</strong>
        </div>
        <div className="review-row">
          <span>Reservation fee</span>
          <strong>{formatMoney(RESERVATION_FEE)}</strong>
        </div>
        <div className="review-row">
          <span>Processing fee</span>
          <strong>{formatMoney(0)}</strong>
        </div>
        <div className="pay-total">
          <span>Total due today</span>
          <strong>{formatMoney(RESERVATION_FEE)}</strong>
        </div>
        <div className="pay-summary-note">
          <Lock size={13} />
          <span>
            The reservation fee holds this property for 48 hours. The remaining
            balance is settled directly with the seller after due diligence.
          </span>
        </div>
      </section>

      <section className="pay-panel">
        <div className="pay-secure">
          <span className="pay-secure-title">
            <Lock size={14} /> Secure checkout
          </span>
          <span className="pay-secure-meta">
            <ShieldCheck size={14} /> 256-bit TLS · PCI-DSS aligned
          </span>
        </div>

        {stage === "processing" ? (
          <div className="pay-processing">
            <Loader2 className="pay-spinner" size={30} />
            <h3>Processing payment</h3>
            <p className="muted">
              Please do not close this window while we confirm your payment.
            </p>
            <ul className="pay-steps">
              {PROCESSING_STEPS.map((label, index) => (
                <li
                  key={label}
                  className={
                    index < stepIndex
                      ? "complete"
                      : index === stepIndex
                        ? "active"
                        : ""
                  }
                >
                  <span>
                    {index < stepIndex ? (
                      <Check size={12} />
                    ) : index === stepIndex ? (
                      <Loader2 size={12} className="pay-spinner" />
                    ) : null}
                  </span>
                  {label}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="pay-body">
            <h2 className="display">Payment method</h2>
            <p className="muted pay-lead">
              Choose how you would like to pay the reservation fee.
            </p>

            <div className="pay-methods">
              {METHODS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`pay-method ${method === item.id ? "active" : ""}`}
                  onClick={() => {
                    setMethod(item.id);
                    setError("");
                  }}
                >
                  <span
                    className="pay-method-icon"
                    style={{ background: item.brand }}
                  >
                    {methodIcon(item.id)}
                  </span>
                  <span className="pay-method-text">
                    <strong>{item.label}</strong>
                    <small>{item.hint}</small>
                  </span>
                  <span className="pay-method-check">
                    {method === item.id && <Check size={13} />}
                  </span>
                </button>
              ))}
            </div>

            <div className="pay-form">
              {(method === "gcash" || method === "maya") && (
                <>
                  <label className="form-label">
                    {methodMeta.label} mobile number
                    <input
                      className="form-input"
                      inputMode="numeric"
                      placeholder="0917 123 4567"
                      value={mobile}
                      onChange={(event) => {
                        setMobile(formatMobile(event.target.value));
                        setError("");
                      }}
                    />
                  </label>
                  <div className="pay-inline-note">
                    <Smartphone size={14} /> A one-time PIN would be sent to this
                    number in the live app.
                  </div>
                </>
              )}

              {method === "bank" && (
                <>
                  <label className="form-label">
                    Select your bank
                    <select
                      className="form-input"
                      value={bank}
                      onChange={(event) => setBank(event.target.value)}
                    >
                      {BANKS.map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                    </select>
                  </label>
                  <label className="form-label">
                    Reference / account note (optional)
                    <input
                      className="form-input"
                      placeholder="e.g. Account ending 4821"
                      value={bankRef}
                      onChange={(event) => setBankRef(event.target.value)}
                    />
                  </label>
                </>
              )}

              {method === "card" && (
                <>
                  <label className="form-label">
                    Card number
                    <span className="pay-card-field">
                      <input
                        className="form-input"
                        inputMode="numeric"
                        placeholder="1234 5678 9012 3456"
                        value={cardNumber}
                        onChange={(event) => {
                          setCardNumber(formatCard(event.target.value));
                          setError("");
                        }}
                      />
                      {cardNumber && (
                        <span className="pay-brand">
                          {cardBrand(cardNumber)}
                        </span>
                      )}
                    </span>
                  </label>
                  <label className="form-label">
                    Cardholder name
                    <input
                      className="form-input"
                      placeholder="Name as shown on card"
                      value={cardName}
                      onChange={(event) => setCardName(event.target.value)}
                    />
                  </label>
                  <div className="pay-row">
                    <label className="form-label">
                      Expiry
                      <input
                        className="form-input"
                        inputMode="numeric"
                        placeholder="MM/YY"
                        value={cardExpiry}
                        onChange={(event) =>
                          setCardExpiry(formatExpiry(event.target.value))
                        }
                      />
                    </label>
                    <label className="form-label">
                      CVC
                      <input
                        className="form-input"
                        inputMode="numeric"
                        placeholder="123"
                        maxLength={4}
                        value={cardCvc}
                        onChange={(event) =>
                          setCardCvc(
                            event.target.value.replace(/\D/g, "").slice(0, 4),
                          )
                        }
                      />
                    </label>
                  </div>
                </>
              )}
            </div>

            {error && (
              <p className="status-message reservation-error" role="alert">
                {error}
              </p>
            )}

            <button
              className="button button-primary full-button pay-pay"
              onClick={pay}
            >
              <Lock size={15} /> Pay {formatMoney(RESERVATION_FEE)}
            </button>

            <div className="pay-trust">
              <span>
                <ShieldCheck size={13} /> Encrypted
              </span>
              <span>
                <Wallet size={13} /> Buyer protected
              </span>
              <span>
                <Receipt size={13} /> Instant receipt
              </span>
            </div>
            <small className="muted pay-demo">
              Your payment details are encrypted and never stored on our
              servers.
            </small>
          </div>
        )}
      </section>
    </div>
  );
}
