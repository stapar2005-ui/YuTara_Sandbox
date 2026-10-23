"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  Bookmark,
  Check,
  MapPin,
  ShieldCheck,
  Store,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { AppNav } from "@/components/AppNav";
import { BuyerTransactions } from "@/components/BuyerTransactions";
import { SellerTransactions } from "@/components/SellerTransactions";
import { DocumentVault } from "@/components/DocumentVault";
import { DemoUser, getStoredSession } from "@/lib/demo-auth";
import { formatMoney } from "@/lib/marketplace";
import { readProperties } from "@/lib/property-store";
import { readTransactions } from "@/lib/transactions";
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

  const owned = reservations.filter(
    (reservation) => reservation.buyerId === session?.email,
  );
  const properties = readProperties();
  const transactions = readTransactions();
  const myListings = session
    ? properties.filter((property) => property.sellerEmail === session.email)
    : [];
  const sellerTx = session
    ? transactions.filter((tx) => tx.sellerId === session.email)
    : [];
  const soldIds = new Set(sellerTx.map((tx) => tx.propertyId));
  const onSale = myListings.filter((listing) => !soldIds.has(listing.id));
  const sold = myListings.filter((listing) => soldIds.has(listing.id));

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
            <Link className="button button-primary" href="/marketplace/map">
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
