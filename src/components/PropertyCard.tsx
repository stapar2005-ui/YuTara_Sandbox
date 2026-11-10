"use client";

import { ArrowRight, Heart, MapPin, Road } from "lucide-react";
import { getListingStatus, money, Property, roadAccessLabel } from "@/lib/marketplace";

export function PropertyCard({
  property,
  saved,
  onSave,
  onOpen,
  onRequestBooking,
}: {
  property: Property;
  saved: boolean;
  onSave: () => void;
  onOpen: () => void;
  onRequestBooking?: () => void;
}) {
  const status = getListingStatus(property);
  const isBookable = status === "OPEN_FOR_OFFERS";
  const pricePerSqm = property.area > 0 ? Math.round(property.price / property.area) : 0;

  const BUYER_BADGE: Record<string, { label: string; color: string }> = {
    OPEN_FOR_OFFERS: { label: "Available for Booking", color: "#166534" },
    BOOKING_REQUESTED: { label: "In Escrow Review", color: "#d97706" },
    RESERVED: { label: "Reserved", color: "#d97706" },
    CLOSED: { label: "Closed", color: "#64748b" },
    SOLD: { label: "Sold", color: "#b91c1c" },
    TERMINATED: { label: "Terminated", color: "#b91c1c" },
  };

  const badge = BUYER_BADGE[status] || BUYER_BADGE.OPEN_FOR_OFFERS;

  return (
    <article className="property-card group">
      <div
        className="property-image"
        style={{
          backgroundImage: `url(${property.image})`,
          backgroundPosition: property.imagePosition || "center",
        }}
      >
        <div className="badge-row">
          <span
            className="badge badge-status"
            style={{ backgroundColor: badge.color, color: "#ffffff" }}
          >
            {badge.label}
          </span>
          {property.promoted && (
            <span className="badge badge-promoted">Promoted</span>
          )}
          <button
            className="save-float"
            aria-label={saved ? "Remove saved property" : "Save property"}
            onClick={onSave}
          >
            <Heart
              size={16}
              fill={saved ? "#d79c43" : "none"}
              color={saved ? "#d79c43" : "currentColor"}
            />
          </button>
        </div>
        <button
          className="book-request-float"
          aria-label="Request booking"
          disabled={!isBookable}
          onClick={onRequestBooking}
        >
          <ArrowRight size={14} />
        </button>
      </div>
      <div className="property-body">
        <div className="property-type">{property.type || property.propertyType} lot</div>
        <h3>{property.title}</h3>
        <div className="property-location">
          <MapPin size={14} /> {property.barangay}, {property.city}
        </div>
        <div className="property-meta">
          <span className="price">{money(property.price)}</span>
          <span className="price-per-sqm">· ₱{pricePerSqm.toLocaleString()}/sqm</span>
          <span className="area">{property.area.toLocaleString()} sqm</span>
        </div>
        <div className="property-road-access">
          <Road size={12} />
          <span>{roadAccessLabel[property.roadAccess]}</span>
        </div>
        {!isBookable && (
          <p className="status-note muted" style={{ marginTop: 8, fontSize: ".75rem" }}>
            {status === "BOOKING_REQUESTED"
              ? "A booking request is pending seller review."
              : status === "RESERVED"
                ? "This property is currently reserved."
                : status === "CLOSED"
                  ? "This listing is closed."
                  : status === "SOLD"
                    ? "This property has been sold."
                    : "This listing is no longer available."}
          </p>
        )}
        <button className="button button-ghost card-action" onClick={onOpen}>
          View property <ArrowRight size={15} />
        </button>
      </div>
    </article>
  );
}
