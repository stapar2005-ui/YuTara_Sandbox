"use client";

import { ArrowLeft, Check, Heart, MapPin, MessageCircle, ShieldCheck } from "lucide-react";
import { getListingStatus, isActiveListing, money, Property } from "@/lib/marketplace";

export function PropertyDetailView({
  property,
  saved,
  owned = false,
  onSave,
  onBack,
  onContact,
  onReserve,
}: {
  property: Property;
  saved: boolean;
  owned?: boolean;
  onSave: () => void;
  onBack: () => void;
  onContact: () => void;
  onReserve: () => void;
}) {
  const isVerified =
    property.status === "PUBLISHED" || property.verificationStatus === "VERIFIED";

  return (
    <main className="detail-view">
      <div className="container">
        <button className="back-button" onClick={onBack}>
          <ArrowLeft size={16} /> Back to marketplace
        </button>
        <div className="detail-grid">
          <div
            className="detail-image"
            style={{
              backgroundImage: `url(${property.image})`,
              backgroundPosition: property.imagePosition || "center",
            }}
          />
          <div className="detail-copy">
            <div className="badge-row" style={{ position: "static" }}>
              {isVerified && (
                <span className="badge badge-verified">
                  <Check size={12} /> YuTara verified
                </span>
              )}
              <span
                className={`badge badge-status ${getListingStatus(property).toLowerCase()}`}
              >
                {getListingStatus(property).replaceAll("_", " ")}
              </span>
              {property.promoted && (
                <span className="badge badge-promoted">Promoted</span>
              )}
            </div>
            <h1 className="display">{property.title}</h1>
            <div className="property-location">
              <MapPin size={15} /> {property.barangay}, {property.city}
            </div>
            <div className="muted" style={{ marginTop: 6, fontSize: ".82rem" }}>
              {property.province} · {property.generalAddress}
            </div>
            <div className="detail-price">{money(property.price)}</div>
            <div className="muted">Listed by {property.seller}</div>
            <div className="detail-specs">
              <div className="spec">
                <span>Land area</span>
                <strong>{property.area.toLocaleString()} sqm</strong>
              </div>
              <div className="spec">
                <span>Property type</span>
                <strong>{property.type || property.propertyType}</strong>
              </div>
              <div className="spec">
                <span>Listing status</span>
                <strong>{getListingStatus(property).replaceAll("_", " ")}</strong>
              </div>
            </div>
            <p>{property.description}</p>
            <div style={{ display: "flex", gap: 9, marginTop: 24 }}>
              {owned ? (
                <p className="status-message">
                  This is your listing. Manage it from your seller workspace.
                </p>
              ) : isActiveListing(property) ? (
                <>
                  <button className="button button-primary" onClick={onReserve}>
                    Reserve property
                  </button>
                  <button className="button button-ghost" onClick={onContact}>
                    <MessageCircle size={16} /> Contact seller
                  </button>
                </>
              ) : (
                <p className="status-message">
                  {getListingStatus(property) === "CLOSED"
                    ? "This listing is currently closed and is not accepting new inquiries."
                    : getListingStatus(property) === "SOLD"
                      ? "This property has been sold and is no longer available."
                      : "This listing has been terminated by YuTara and is no longer available."}
                </p>
              )}
              <button className="button button-ghost" onClick={onSave}>
                <Heart size={16} fill={saved ? "#d79c43" : "none"} />{" "}
                {saved ? "Saved" : "Save"}
              </button>
            </div>
            <div className="verification-box">
              <h3>
                <ShieldCheck
                  size={18}
                  style={{ verticalAlign: "-4px", marginRight: 6 }}
                />
                YuTara verification
              </h3>
              <ul>
                <li>
                  <Check size={14} /> Seller identity reviewed
                </li>
                <li>
                  <Check size={14} /> Required documents submitted
                </li>
                <li>
                  <Check size={14} /> Property information reviewed
                </li>
                <li>
                  <Check size={14} /> Listing requirements met
                </li>
              </ul>
              <p style={{ fontSize: ".74rem", marginBottom: 0 }}>
                Verification ID: YT-2026-{String(property.id).padStart(6, "0")}.
                Buyers should conduct appropriate legal and government due
                diligence.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
