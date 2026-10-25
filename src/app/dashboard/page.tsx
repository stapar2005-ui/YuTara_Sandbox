"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  Bookmark,
  Check,
  MapPin,
  Megaphone,
  ShieldCheck,
  Store,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { AppNav } from "@/components/AppNav";
import { BuyerTransactions } from "@/components/BuyerTransactions";
import { SellerTransactions } from "@/components/SellerTransactions";
import { DocumentVault } from "@/components/DocumentVault";
import { Modal } from "@/components/Modal";
import { DemoUser, getStoredSession } from "@/lib/demo-auth";
import {
  formatMoney,
  isActiveListing,
  isPromotionActive,
  Property,
} from "@/lib/marketplace";
import { readProperties, PROPERTIES_EVENT } from "@/lib/property-store";
import {
  endPromotion,
  PROMO_OPTIONS,
  promoteLand,
  promotionEndLabel,
} from "@/lib/promotions";
import { readTransactions, Transaction } from "@/lib/transactions";
import { readReservations, Reservation } from "@/lib/reservation-service";

const LISTING_STATUS_CLASS: Record<string, string> = {
  OPEN_FOR_OFFERS: "verified",
  VERIFIED: "verified",
  PENDING_REVIEW: "review",
  UNDER_REVIEW: "review",
  DRAFT: "review",
  NOT_STARTED: "review",
  NEEDS_CORRECTION: "correction",
  REJECTED: "correction",
  TERMINATED: "correction",
};

function EmptyNote({ children }: { children: ReactNode }) {
  return (
    <div className="table-wrap empty-dashboard">
      <ShieldCheck size={24} />
      <p className="muted">{children}</p>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState<DemoUser | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [promoteId, setPromoteId] = useState<number | null>(null);
  const [promoteDays, setPromoteDays] = useState(30);

  useEffect(() => {
    window.setTimeout(() => {
      const current = getStoredSession();
      if (!current) {
        router.replace("/login");
        return;
      }
      setSession(current);
      setReservations(readReservations());
    }, 0);
  }, [router]);

  useEffect(() => {
    const sync = () => {
      setProperties(readProperties());
      setTransactions(readTransactions());
    };
    const timer = window.setTimeout(sync, 0);
    window.addEventListener(PROPERTIES_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener(PROPERTIES_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const owned = reservations.filter(
    (reservation) => reservation.buyerId === session?.email,
  );

  const myListings = session
    ? properties.filter((property) => property.sellerEmail === session.email)
    : [];
  const sellerTx = session
    ? transactions.filter((tx) => tx.sellerId === session.email)
    : [];
  const soldIds = new Set(sellerTx.map((tx) => tx.propertyId));
  const onSale = myListings.filter((listing) => !soldIds.has(listing.id));
  const sold = myListings.filter((listing) => soldIds.has(listing.id));
  const promoteListing =
    promoteId !== null
      ? (myListings.find((listing) => listing.id === promoteId) ?? null)
      : null;
  const promoOption =
    PROMO_OPTIONS.find((option) => option.days === promoteDays) ??
    PROMO_OPTIONS[2];

  return (
    <div className="app-shell">
      <AppNav session={session} />
      <main className="workspace">
        <div className="container">
          <div className="eyebrow">Dashboard</div>
          <h1 className="display">Welcome back, {session?.name || "there"}.</h1>
          <p className="muted">
            Everything about your land in one place: what you reserved, what you
            are selling, and what you have sold.
          </p>
          <div className="stats">
            <div className="stat">
              <span>Land reserved</span>
              <strong>{owned.length}</strong>
            </div>
            <div className="stat">
              <span>Land on sale</span>
              <strong>{onSale.length}</strong>
            </div>
            <div className="stat">
              <span>Land sold</span>
              <strong>{sold.length}</strong>
            </div>
            <div className="stat">
              <span>Transactions</span>
              <strong>{transactions.length}</strong>
            </div>
          </div>

          {/* Land Reserved */}
          <div className="dashboard-heading" style={{ marginTop: 40 }}>
            <div>
              <div className="eyebrow">Buying</div>
              <h2 className="display">
                <Bookmark size={20} style={{ verticalAlign: "-3px" }} /> Land
                reserved
              </h2>
            </div>
            <Link className="button button-primary" href="/marketplace">
              Discover land
            </Link>
          </div>
          {owned.length === 0 ? (
            <EmptyNote>You have not reserved any land yet.</EmptyNote>
          ) : (
            <div className="dashboard-grid">
              {owned.map((reservation) => {
                const property = properties.find(
                  (item) => item.id === reservation.propertyId,
                );
                if (!property) return null;
                return (
                  <article className="asset-card" key={reservation.id}>
                    <div
                      className="asset-image"
                      style={{
                        backgroundImage: `url(${property.image})`,
                        backgroundPosition: property.imagePosition || "center",
                      }}
                    />
                    <div className="property-body">
                      <span className="badge badge-verified">
                        <Check size={12} /> YuTara verified
                      </span>
                      <h3>{property.title}</h3>
                      <p className="property-location">
                        <MapPin size={14} /> {property.barangay}, {property.city}
                      </p>
                      <div className="property-meta">
                        <strong className="price">
                          {formatMoney(property.price)}
                        </strong>
                        <span className="status verified">
                          {reservation.status}
                        </span>
                      </div>
                      <DocumentVault
                        property={property}
                        reservationId={reservation.id}
                      />
                      <small className="muted">Reservation {reservation.id}</small>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
          {session && owned.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <BuyerTransactions email={session.email} />
            </div>
          )}

          {/* Land on Sale */}
          <div className="dashboard-heading" style={{ marginTop: 46 }}>
            <div>
              <div className="eyebrow">Selling</div>
              <h2 className="display">
                <Store size={20} style={{ verticalAlign: "-3px" }} /> Land on sale
              </h2>
            </div>
            <Link className="button button-ghost" href="/?view=seller">
              Manage listings
            </Link>
          </div>
          {onSale.length === 0 ? (
            <EmptyNote>
              You have no land on sale. List land to start selling.
            </EmptyNote>
          ) : (
            <div className="dashboard-grid">
              {onSale.map((listing) => (
                <article className="asset-card" key={listing.id}>
                  <div
                    className="asset-image"
                    style={{
                      backgroundImage: `url(${listing.image})`,
                      backgroundPosition: listing.imagePosition || "center",
                    }}
                  />
                  <div className="property-body">
                    <span
                      className={`status ${LISTING_STATUS_CLASS[listing.status] ?? "review"}`}
                    >
                      {listing.status.replaceAll("_", " ")}
                    </span>
                    <h3>{listing.title}</h3>
                    <p className="property-location">
                      <MapPin size={14} /> {listing.barangay}, {listing.city}
                    </p>
                    <div className="property-meta">
                      <strong className="price">
                        {formatMoney(listing.price)}
                      </strong>
                      <span className="area">
                        {listing.area.toLocaleString()} sqm
                      </span>
                    </div>
                    {listing.status === "UNDER_REVIEW" && (
                      <small className="muted">
                        Awaiting YuTara verification. It becomes visible in the
                        marketplace once approved.
                      </small>
                    )}
                    {isPromotionActive(listing) ? (
                      <div className="promo-box">
                        <span className="badge badge-promoted">
                          <Megaphone size={12} /> Promoted
                        </span>
                        <small className="muted">
                          Runs until {promotionEndLabel(listing.promotionUntil)}
                        </small>
                        <button
                          className="button button-ghost"
                          onClick={() => endPromotion(listing.id)}
                        >
                          Stop promotion
                        </button>
                      </div>
                    ) : (
                      <div className="promo-box">
                        <button
                          className="button button-primary"
                          disabled={!isActiveListing(listing)}
                          onClick={() => {
                            setPromoteId(listing.id);
                            setPromoteDays(30);
                          }}
                        >
                          <Megaphone size={14} /> Promote this land
                        </button>
                        {!isActiveListing(listing) && (
                          <small className="muted">
                            You can promote this land once it is approved and live
                            on the marketplace.
                          </small>
                        )}
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}

          {/* Land Sold */}
          <div className="dashboard-heading" style={{ marginTop: 46 }}>
            <div>
              <div className="eyebrow">Selling</div>
              <h2 className="display">
                <BadgeCheck size={20} style={{ verticalAlign: "-3px" }} /> Land
                sold
              </h2>
            </div>
            <p className="muted" style={{ maxWidth: 340 }}>
              Land buyers have booked, and the current step of each transaction.
            </p>
          </div>
          {sold.length === 0 ? (
            <EmptyNote>
              No land has been booked or sold yet. Bookings appear here once a
              buyer reserves your listing.
            </EmptyNote>
          ) : (
            <div className="dashboard-grid">
              {sold.map((listing) => (
                <article className="asset-card" key={listing.id}>
                  <div
                    className="asset-image"
                    style={{
                      backgroundImage: `url(${listing.image})`,
                      backgroundPosition: listing.imagePosition || "center",
                    }}
                  />
                  <div className="property-body">
                    <span className="badge badge-verified">
                      <BadgeCheck size={12} /> Booked
                    </span>
                    <h3>{listing.title}</h3>
                    <p className="property-location">
                      <MapPin size={14} /> {listing.barangay}, {listing.city}
                    </p>
                    <div className="property-meta">
                      <strong className="price">
                        {formatMoney(listing.price)}
                      </strong>
                      <span className="area">
                        {listing.area.toLocaleString()} sqm
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
          {session && sold.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <SellerTransactions email={session.email} />
            </div>
          )}

          {promoteListing && (
            <Modal
              title="Promote your land"
              onClose={() => setPromoteId(null)}
            >
              <p className="muted">
                Promoting places <strong>{promoteListing.title}</strong> in the{" "}
                <strong>YuTara Promoted</strong> banner on the home and
                marketplace pages. Choose how long the promotion should last.
              </p>
              <label className="form-label">
                Promotion length
                <select
                  className="form-input"
                  value={promoteDays}
                  onChange={(event) =>
                    setPromoteDays(Number(event.target.value))
                  }
                >
                  {PROMO_OPTIONS.map((option) => (
                    <option key={option.days} value={option.days}>
                      {option.label} — {formatMoney(option.price)}
                    </option>
                  ))}
                </select>
              </label>
              <div className="review-panel">
                <div className="review-row">
                  <span>Promotion</span>
                  <strong>{promoOption.label}</strong>
                </div>
                <div className="review-row">
                  <span>Total</span>
                  <strong>{formatMoney(promoOption.price)}</strong>
                </div>
              </div>
              <div className="modal-foot">
                <button
                  className="button button-ghost"
                  onClick={() => setPromoteId(null)}
                >
                  Cancel
                </button>
                <button
                  className="button button-primary"
                  onClick={() => {
                    promoteLand(promoteListing.id, promoOption.days);
                    setPromoteId(null);
                  }}
                >
                  <Megaphone size={15} /> Pay {formatMoney(promoOption.price)} &amp;
                  promote
                </button>
              </div>
            </Modal>
          )}

          <div className="trust-card dashboard-note">
            <h3>
              <ShieldCheck size={18} /> Keep your due diligence active
            </h3>
            <p>
              YuTara verification helps you understand submitted information. It
              does not guarantee legal ownership, replace government
              verification, or make a reservation equivalent to ownership.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
