"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { CheckoutNav } from "@/components/CheckoutNav";
import { DemoUser, getStoredSession } from "@/lib/demo-auth";
import { formatMoney, MarketplaceProperty } from "@/lib/marketplace";
import { readProperties } from "@/lib/property-store";
import { PaymentPortal } from "@/components/PaymentPortal";
import {
  createReservation,
  Reservation,
  RESERVATION_FEE,
} from "@/lib/reservation-service";
import {
  createTransactionFromReservation,
  markBookingPaid,
} from "@/lib/transactions";

export default function ReservationPage() {
  const params = useParams<{ propertyId: string }>();
  const router = useRouter();
  const [property, setProperty] = useState<
    MarketplaceProperty | null | undefined
  >(undefined);
  const [session, setSession] = useState<DemoUser | null>(null);
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [needsPayment, setNeedsPayment] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const found =
        readProperties().find(
          (item) => item.id === Number(params.propertyId),
        ) ?? null;
      setProperty(found);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [params.propertyId]);

  useEffect(() => {
    if (!property) return;
    window.setTimeout(() => {
      const current = getStoredSession();
      if (!current) {
        router.replace(`/login?next=/reservation/${params.propertyId}`);
        return;
      }
      setSession(current);
      if (property.sellerEmail && property.sellerEmail === current.email) {
        setError("You can't reserve your own listing.");
        return;
      }
      const result = createReservation(property, current.email);
      if (result.error) {
        setError(result.error);
      } else {
        setReservation(result.reservation ?? null);
        setNeedsPayment(
          result.reservation
            ? result.reservation.status === "PENDING_PAYMENT"
            : false,
        );
        if (result.reservation) {
          createTransactionFromReservation({
            reservation: result.reservation,
            property,
            buyerName: current.name,
          });
        }
      }
    }, 0);
  }, [property, router, params.propertyId]);

  if (property === undefined) {
    return (
      <div className="app-shell">
        <CheckoutNav />
        <main className="workspace">
          <div className="container">
            <div className="pay-loading">
              <span className="pay-spinner" />
              Loading property…
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (property === null) {
    return (
      <div className="app-shell">
        <CheckoutNav />
        <main className="workspace">
          <div className="container">
            <h1>Property not found</h1>
            <p className="muted">
              This listing may have been removed or is no longer available.
            </p>
            <Link className="button button-ghost" href="/marketplace/map">
              Back to marketplace
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <CheckoutNav />
      <main className="workspace">
        <div className="container reservation-shell">
          <button className="back-button" onClick={() => router.back()}>
            <ArrowLeft size={16} /> Back to property
          </button>
          <div className="eyebrow">Secure checkout</div>
          <h1 className="display">Reserve with clarity.</h1>
          <p className="muted">
            Review your reservation and complete the reservation payment to hold
            this property.
          </p>
          {error ? (
            <div className="status-message reservation-error">
              {error}
              <br />
              <Link href={`/marketplace/${property.id}`}>
                Return to property
              </Link>
            </div>
          ) : reservation && session ? (
            needsPayment ? (
              <PaymentPortal
                property={property}
                reservation={reservation}
                buyerName={session.name}
                buyerEmail={session.email}
                onConfirmed={(updated) => {
                  setReservation(updated);
                  markBookingPaid(updated.id, updated.paymentMethod || "Card");
                }}
              />
            ) : (
              <section className="confirmation-panel">
                <div className="seal">
                  <Check size={22} />
                </div>
                <div className="eyebrow">Reservation active</div>
                <h2 className="display">Payment already completed</h2>
                <p className="muted">
                  This property is already reserved under your account. Continue
                  from your transaction records.
                </p>
                <div className="review-panel">
                  <div className="review-row">
                    <span>Reservation ID</span>
                    <strong>{reservation.id}</strong>
                  </div>
                  <div className="review-row">
                    <span>Amount</span>
                    <strong>{formatMoney(RESERVATION_FEE)}</strong>
                  </div>
                  <div className="review-row">
                    <span>Status</span>
                    <strong>{reservation.status}</strong>
                  </div>
                </div>
                <Link className="button button-primary" href="/dashboard">
                  View my transactions
                </Link>
              </section>
            )
          ) : (
            <div className="pay-loading">
              <span className="pay-spinner" />
              Preparing your checkout…
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
