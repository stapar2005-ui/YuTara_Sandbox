"use client";

import { ArrowLeft, Heart, MapPin, MessageCircle, Users } from "lucide-react";
import { getListingStatus, money, Property } from "@/lib/marketplace";

const STATUS_CONFIG: Record<string, { label: string; variant: "green" | "amber" | "red" | "gray" }> = {
  OPEN_FOR_OFFERS: { label: "Open for Offers", variant: "green" },
  BOOKING_REQUESTED: { label: "Booking Requested", variant: "amber" },
  RESERVED: { label: "Reserved", variant: "amber" },
  CLOSED: { label: "Closed", variant: "gray" },
  SOLD: { label: "Sold", variant: "red" },
  TERMINATED: { label: "Terminated", variant: "red" },
};

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
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.OPEN_FOR_OFFERS;
  const isBookable = status === "OPEN_FOR_OFFERS";

  return (
    <div className="detail-view page">
      <div className="container">
        <button className="back-button" onClick={onBack}>
          <ArrowLeft size={16} /> Back to marketplace
        </button>
        <div className="detail-grid">
          <div className="detail-gallery">
            <div
              className="detail-image"
              style={{
                backgroundImage: `url(${property.image})`,
                backgroundPosition: property.imagePosition || "center",
              }}
            />
            <div className="detail-location">
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
            <div className="badge-row">
              <span className={`badge badge-${config.variant}`}>
                {config.label}
              </span>
              {property.promoted && (
                <span className="badge badge-gray">Promoted</span>
              )}
            </div>
            <h1 className="detail-title">{property.title}</h1>
            <div className="property-location">
              <MapPin size={15} /> {property.barangay}, {property.city}
            </div>
            <div className="muted" style={{ marginTop: 6, fontSize: ".82rem" }}>
              {property.province} · {property.generalAddress}
            </div>
            <div className="detail-price">{money(property.price)}</div>
            <div className="muted" style={{ marginTop: 4 }}>
              Listed by {property.seller}
            </div>

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
                <strong>{config.label}</strong>
              </div>
            </div>

            <p>{property.description}</p>

            <div style={{ display: "flex", gap: 9, marginTop: 24, flexWrap: "wrap" }}>
              {owned ? (
                <p className="status-message">
                  This is your listing. Manage it from your seller workspace.
                </p>
              ) : isBookable && onRequestBooking ? (
                <>
                  <button
                    className="btn btn-primary"
                    onClick={onRequestBooking}
                  >
                    Request Booking
                  </button>
                  <button className="btn btn-ghost" onClick={onContact}>
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
              <button className="btn btn-ghost" onClick={onSave}>
                <Heart size={16} fill={saved ? "#d79c43" : "none"} />{" "}
                {saved ? "Saved" : "Save"}
              </button>
            </div>

            <div className="verification-box">
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
    </div>
  );
}
