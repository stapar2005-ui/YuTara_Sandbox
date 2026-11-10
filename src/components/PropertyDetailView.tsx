"use client";

import { ArrowLeft, Heart, MapPin, MessageCircle, Users } from "lucide-react";
import { getListingStatus, money, Property } from "@/lib/marketplace";

export function PropertyDetailView({
  property,
  saved,
  owned = false,
  onSave,
  onBack,
  onContact,
  onRequestBooking,
}: {
  property: Property;
  saved: boolean;
  owned?: boolean;
  onSave: () => void;
  onBack: () => void;
  onContact: () => void;
  onRequestBooking?: () => void;
}) {
  const status = getListingStatus(property);
  const isBookable = status === "OPEN_FOR_OFFERS";

  const STATUS_COLOR: Record<string, string> = {
    OPEN_FOR_OFFERS: "#166534",
    BOOKING_REQUESTED: "#d97706",
    RESERVED: "#d97706",
    CLOSED: "#b91c1c",
    SOLD: "#b91c1c",
    TERMINATED: "#b91c1c",
  };

  return (
    <main className="detail-view">
      <div className="container">
        <button className="back-button" onClick={onBack}>
          <ArrowLeft size={16} /> Back to marketplace
        </button>
        <div className="detail-grid">
          <div>
            <div
              className="detail-image"
              style={{
                backgroundImage: `url(${property.image})`,
                backgroundPosition: property.imagePosition || "center",
              }}
            />
            <div className="map-reference">
              <div className="eyebrow">Location reference</div>
              <strong>{property.barangay}, {property.city}</strong>
              <p>
                Coordinates: {property.latitude.toFixed(4)},{" "}
                {property.longitude.toFixed(4)}
              </p>
              <small>
                Coordinates and boundaries are approximate and do not replace an
                official survey.
              </small>
            </div>
          </div>
          <div className="detail-copy">
            <div className="badge-row" style={{ position: "static" }}>
              <span
                className="badge badge-status"
                style={{
                  backgroundColor: STATUS_COLOR[status] || "#166534",
                  color: "#ffffff",
                }}
              >
                {status.replaceAll("_", " ")}
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
                <strong>{status.replaceAll("_", " ")}</strong>
              </div>
            </div>
            <p>{property.description}</p>
            <div style={{ display: "flex", gap: 9, marginTop: 24 }}>
              {owned ? (
                <p className="status-message">
                  This is your listing. Manage it from your seller workspace.
                </p>
              ) : isBookable ? (
                <>
                  <button
                    className="button button-primary"
                    onClick={onRequestBooking}
                  >
                    Request Booking
                  </button>
                  <button className="button button-ghost" onClick={onContact}>
                    <MessageCircle size={16} /> Contact Seller
                  </button>
                </>
              ) : (
                <p className="status-message">
                  {status === "CLOSED"
                    ? "This listing is currently closed and is not accepting new inquiries."
                    : status === "SOLD"
                      ? "This property has been sold and is no longer available."
                      : status === "BOOKING_REQUESTED"
                        ? "A booking request is pending seller review."
                        : status === "RESERVED"
                          ? "This property is currently reserved."
                          : "This listing has been terminated and is no longer available."}
                </p>
              )}
              <button className="button button-ghost" onClick={onSave}>
                <Heart size={16} fill={saved ? "#d79c43" : "none"} />{" "}
                {saved ? "Saved" : "Save"}
              </button>
            </div>
            <div className="verification-box" style={{ borderColor: "#d79c43" }}>
              <h3>
                <Users
                  size={18}
                  style={{ verticalAlign: "-4px", marginRight: 6 }}
                />
                Listing Information
              </h3>
              <ul>
                <li>
                  Property details are provided by the seller and have not been
                  independently verified by YuTara.
                </li>
                <li>
                  Buyers should conduct appropriate legal and government due
                  diligence before completing a purchase.
                </li>
                <li>
                  YuTara does not establish legal ownership at the listing
                  stage.
                </li>
              </ul>
              <p style={{ fontSize: ".74rem", marginBottom: 0, marginTop: 8 }}>
                The affiliated agency coordinates the ownership transfer
                process once a booking is approved by the seller.
              </p>
            </div>
          </div>
        </div>
      </div>
      <button
        className="floating-contact"
        onClick={onContact}
        aria-label="Contact seller"
      >
        <MessageCircle size={20} />
      </button>
    </main>
  );
}
